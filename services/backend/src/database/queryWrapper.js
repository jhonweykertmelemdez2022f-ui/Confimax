/**
 * ============================================================
 * PG POOL WRAPPER CON EVENTOS
 * ============================================================
 * Envuelve el pool de PostgreSQL para interceptar operaciones
 * de escritura (INSERT, UPDATE, DELETE) y emitir eventos
 * que alimentan auditoría y cache invalidation.
 *
 * Usa la API de pg nativa con SQL raw. No requiere Prisma.
 *
 * Estrategia de detección:
 *   - INSERT → entity.created
 *   - UPDATE → entity.updated (requiere oldData previo)
 *   - DELETE → entity.deleted (requiere oldData previo)
 */

const { AsyncLocalStorage } = require('async_hooks');
const { pool } = require('../models');
const { emitEntityEvent } = require('../events/emitter');

/**
 * Detecta la operación a partir del SQL normalizado.
 * @param {string} sql
 * @returns {string|null} 'CREATE' | 'UPDATE' | 'DELETE'
 */
function detectOperation(sql) {
  const normalized = sql.trim().toUpperCase();
  if (normalized.startsWith('INSERT')) return 'CREATE';
  if (normalized.startsWith('UPDATE')) return 'UPDATE';
  if (normalized.startsWith('DELETE')) return 'DELETE';
  return null;
}

/**
 * Extrae el nombre de la entidad (tabla) del SQL.
 * Heurística: primera palabra después de INSERT INTO / UPDATE / DELETE FROM.
 * @param {string} sql
 * @returns {string|null}
 */
function extractEntity(sql) {
  const normalized = sql.trim().toUpperCase();
  let match;

  if (normalized.startsWith('INSERT INTO')) {
    match = normalized.match(/^INSERT\s+INTO\s+(\w+)/);
  } else if (normalized.startsWith('UPDATE')) {
    match = normalized.match(/^UPDATE\s+(\w+)/);
  } else if (normalized.startsWith('DELETE')) {
    match = normalized.match(/^DELETE\s+FROM\s+(\w+)/);
  }

  return match ? match[1] : null;
}

/**
 * Extrae el ID del registro afectado de los parámetros,
 * basándose en la cláusula WHERE id = $N o RETURNING id.
 * @param {string} sql
 * @param {Array} values
 * @returns {string|number|null}
 */
function extractRecordId(sql, values) {
  const normalized = sql.toUpperCase();

  // Si hay RETURNING * o RETURNING id, preferimos eso (no disponible hasta después del query)
  // Para INSERT, usamos el resultado del query mismo.
  // Para UPDATE/DELETE, buscamos WHERE id = $N
  const idMatch = normalized.match(/WHERE\s+(?:ID|\\W*ID\\W*)\s*=\s*\$(\d+)/i);
  if (idMatch) {
    const paramIndex = parseInt(idMatch[1], 10) - 1;
    return values[paramIndex] ?? null;
  }

  return null;
}

/**
 * Contexto del request actual usando AsyncLocalStorage.
 * Aisla el contexto por async call stack para evitar
 * filtrado entre requests concurrentes.
 */
const asyncLocalStorage = new AsyncLocalStorage();

function getRequestContext() {
  return asyncLocalStorage.getStore() || {};
}

/**
 * Wrapper principal sobre pool.query.
 * Para operaciones de escritura:
 *   1. Si es UPDATE/DELETE, hace un SELECT previo para capturar oldData.
 *   2. Ejecuta la query.
 *   3. Emite el evento correspondiente.
 *
 * @param {string} sql
 * @param {Array} values
 * @param {object} client - Cliente pg opcional para transacciones
 * @returns {Promise<object>} Resultado de pg
 */
async function query(sql, values = [], client = null) {
  const operation = detectOperation(sql);
  const entity = extractEntity(sql);

  const pgClient = client || pool;

  if (!operation || !entity) {
    // SELECT u otro query no mutador: pasar directo
    return pgClient.query(sql, values);
  }

  const ctx = getRequestContext();
  let oldData = null;
  let recordId = null;

  // Para UPDATE/DELETE necesitamos oldData antes de mutar
  if (operation === 'UPDATE' || operation === 'DELETE') {
    recordId = extractRecordId(sql, values);
    if (recordId) {
      try {
        const { rows } = await pgClient.query(`SELECT * FROM ${entity} WHERE id = $1`, [recordId]);
        oldData = rows[0] || null;
      } catch (err) {
        console.warn(`[QUERY-WRAPPER] No se pudo obtener oldData para ${entity}:${recordId}`, err.message);
      }
    }
  }

  // Ejecutar la query principal
  const result = await pgClient.query(sql, values);

  // Determinar newData / recordId
  let newData = null;
  if (operation === 'CREATE') {
    // INSERT ... RETURNING * → rows[0] contiene el nuevo registro
    newData = result.rows[0] || null;
    recordId = newData?.id ?? null;
  } else if (operation === 'UPDATE') {
    newData = result.rows[0] || null;
    recordId = recordId ?? newData?.id ?? null;
  } else if (operation === 'DELETE') {
    recordId = recordId ?? values[values.length - 1] ?? null;
  }

  // Si estamos dentro de una transacción, acumular evento en el client
  if (client && client._pendingEvents) {
    client._pendingEvents.push({
      operation,
      entity,
      recordId,
      oldData,
      newData,
      userId: ctx.userId,
      username: ctx.username,
      ip: ctx.ip,
      endpoint: ctx.endpoint,
      userAgent: ctx.userAgent,
    });
  } else {
    // Emitir inmediatamente si no hay transacción activa
    emitEntityEvent(operation, {
      entity,
      recordId,
      oldData,
      newData,
      userId: ctx.userId,
      username: ctx.username,
      ip: ctx.ip,
      endpoint: ctx.endpoint,
      userAgent: ctx.userAgent,
    });
  }

  return result;
}

/**
 * Wrapper para transacciones. Mantiene consistencia entre PG y eventos.
 * @param {function} fn - Callback que recibe el client de pg y retorna una Promise
 */
async function transaction(fn) {
  const client = await pool.connect();
  client._pendingEvents = []; // Buffer de eventos para COMMIT atómico

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');

    // Emitir eventos acumulados solo si COMMIT tuvo éxito
    for (const ev of client._pendingEvents) {
      emitEntityEvent(ev.operation, {
        entity: ev.entity,
        recordId: ev.recordId,
        oldData: ev.oldData,
        newData: ev.newData,
        userId: ev.userId,
        username: ev.username,
        ip: ev.ip,
        endpoint: ev.endpoint,
        userAgent: ev.userAgent,
      });
    }

    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    // Eventos acumulados se descartan automáticamente (no se emiten)
    throw err;
  } finally {
    delete client._pendingEvents;
    client.release();
  }
}

module.exports = {
  query,
  transaction,
  getRequestContext,
  asyncLocalStorage,
  detectOperation,
  extractEntity,
  extractRecordId,
};
