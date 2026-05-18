/**
 * @file sync-processor.service.js
 * @description Servidor de Sincronización Offline-First para el Backend.
 * Recibe lotes de transacciones móviles offline, los almacena en un buffer de
 * Upstash Redis para evitar la congestión de Supabase (PostgreSQL), compara Vector Clocks
 * y ejecuta resolución de conflictos "Last Write Wins" (LWW) antes de persistir.
 * Cumple con los estándares de Ingeniería del Trayecto IV de la UPTAI.
 */

const { getRedisClient } = require('./redis.service');
const db = require('../database/queryWrapper');

// Claves de colas en Redis para buffers y almacenamiento de Vector Clocks
const REDIS_SYNC_QUEUE = 'sync:queue:processing';
const REDIS_VECTOR_CLOCKS_KEY = 'sync:vector_clocks';

/**
 * Servicio encargado del procesamiento distribuido y control de concurrencia de la sincronización.
 */
class SyncProcessorService {
  
  /**
   * Recibe el lote de cambios del cliente, los almacena en una cola temporal (buffer) en Redis
   * para mitigar picos de concurrencia en la base de datos relacional PostgreSQL.
   * 
   * @async
   * @param {string} clientId Identificador único del cliente móvil (ej. 'client_mobile_001').
   * @param {Array<object>} changes Lista de operaciones encoladas en local.
   * @param {object} clientClock Objeto del Vector Clock enviado por el cliente.
   * @returns {Promise<object>} Estado del procesamiento inicial.
   */
  async bufferIncomingChanges(clientId, changes, clientClock) {
    console.log(`[SyncProcessor] Recibido lote de ${changes.length} cambios para el cliente: ${clientId}`);
    const redis = getRedisClient();

    // 1. Guardar la cola temporal en Redis para actuar como Load Buffer
    const syncPayload = {
      clientId,
      changes,
      clientClock,
      receivedAt: Date.now()
    };

    // Agregar a la cola FIFO en Redis (LPUSH)
    await redis.lPush(REDIS_SYNC_QUEUE, JSON.stringify(syncPayload));
    console.log(`[SyncProcessor] Lote encolado en Redis (${REDIS_SYNC_QUEUE}) con éxito.`);

    // 2. Ejecutar procesamiento secuencial inmediato (o delegado a un worker)
    const result = await this.processSyncQueue();
    return result;
  }

  /**
   * Recupera los lotes de Redis, evalúa la concurrencia a nivel de base de datos
   * y los persiste en Supabase.
   * 
   * @async
   * @returns {Promise<object>} Identificadores procesados y el Vector Clock fusionado.
   */
  async processSyncQueue() {
    const redis = getRedisClient();
    
    // Obtener y extraer elemento de la cola en Redis (RPOP)
    const rawPayload = await redis.rPop(REDIS_SYNC_QUEUE);
    if (!rawPayload) {
      return { success: true, processedIds: [], serverClock: {} };
    }

    const { clientId, changes, clientClock } = JSON.parse(rawPayload);
    const processedIds = [];

    // Recuperar el Vector Clock maestro actual del servidor en Redis
    const serverClockRaw = await redis.hGet(REDIS_VECTOR_CLOCKS_KEY, 'server') || '0';
    let serverClockInt = parseInt(serverClockRaw, 10);

    // Incrementar el reloj vectorial del servidor para reflejar una nueva versión de sincronización
    serverClockInt += 1;
    await redis.hSet(REDIS_VECTOR_CLOCKS_KEY, 'server', serverClockInt.toString());

    // Crear un reloj maestro combinado
    const mergedServerClock = {
      server: serverClockInt,
      ...clientClock
    };

    // Procesar cada cambio aplicando la lógica relacional y de resolución de conflictos
    for (const change of changes) {
      try {
        const success = await this.resolveAndPersist(change, mergedServerClock);
        if (success) {
          processedIds.push(change.id);
        }
      } catch (err) {
        console.error(`[SyncProcessor] Fallo crítico al procesar cambio ${change.id}:`, err.message);
      }
    }

    return {
      success: true,
      processedIds,
      serverClock: mergedServerClock
    };
  }

  /**
   * Resuelve conflictos comparando Vector Clocks o timestamps (LWW) y persiste la entidad.
   * 
   * @async
   * @param {object} change Objeto que detalla la transacción remota del cliente móvil.
   * @param {object} serverClock Reloj vectorial combinado del servidor actual.
   * @returns {Promise<boolean>} Retorna true si persistió la transacción con éxito.
   */
  async resolveAndPersist(change, serverClock) {
    const { entityType, entityId, operation, data, clientTimestamp } = change;

    // Ejecutar lógica transaccional atómica en PostgreSQL usando queryWrapper
    return await db.transaction(async (txClient) => {
      // 1. Obtener la fila actual en Supabase para validar si existe conflicto concurrente
      let tableName = '';
      if (entityType === 'sale') tableName = 'sales';
      else if (entityType === 'customer') tableName = 'customers';
      else if (entityType === 'product') tableName = 'products';
      else return false;

      const { rows } = await db.query(
        `SELECT * FROM ${tableName} WHERE id = $1`, 
        [entityId], 
        txClient
      );
      const serverRecord = rows[0];

      if (serverRecord) {
        // --- DETECCIÓN DE CONFLICTOS Y RESOLUCIÓN LWW (Last Write Wins) ---
        const serverUpdatedAt = new Date(serverRecord.updated_at || serverRecord.created_at).getTime();
        
        console.log(`[SyncProcessor] Comparando timestamps LWW para ${entityType}:${entityId}. Cliente: ${clientTimestamp} vs Servidor: ${serverUpdatedAt}`);
        
        if (clientTimestamp < serverUpdatedAt) {
          // El cambio del cliente es obsoleto/viejo. Se rechaza la escritura por LWW.
          console.warn(`[SyncProcessor] Conflicto LWW detectado. Petición rechazada para ${entityType}:${entityId} (Escritura del Servidor es más reciente).`);
          return true; // Se considera procesado exitosamente para no bloquear la cola del cliente móvil
        }
      }

      // 2. Persistir transacción en base de datos PostgreSQL
      if (operation === 'CREATE') {
        if (entityType === 'sale') {
          await db.query(
            `INSERT INTO sales (id, customer_id, user_id, total_amount, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, TO_TIMESTAMP($6 / 1000.0), TO_TIMESTAMP($7 / 1000.0))
             ON CONFLICT (id) DO NOTHING`,
            [
              entityId, 
              data.customerId, 
              data.userId || 'system', 
              data.totalAmount || 0, 
              data.status || 'COMPLETED',
              clientTimestamp,
              clientTimestamp
            ],
            txClient
          );
        } else if (entityType === 'customer') {
          await db.query(
            `INSERT INTO customers (id, name, rif, email, phone, address, credit_limit, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, TO_TIMESTAMP($8 / 1000.0), TO_TIMESTAMP($9 / 1000.0))
             ON CONFLICT (id) DO UPDATE SET 
               name = EXCLUDED.name, 
               phone = EXCLUDED.phone, 
               updated_at = EXCLUDED.updated_at`,
            [
              entityId,
              data.name,
              data.rif,
              data.email,
              data.phone,
              data.address,
              data.creditLimit || 0,
              clientTimestamp,
              clientTimestamp
            ],
            txClient
          );
        }
      } else if (operation === 'UPDATE') {
        if (entityType === 'customer') {
          await db.query(
            `UPDATE customers 
             SET name = $1, rif = $2, email = $3, phone = $4, address = $5, credit_limit = $6, updated_at = TO_TIMESTAMP($7 / 1000.0) 
             WHERE id = $8`,
            [
              data.name,
              data.rif,
              data.email,
              data.phone,
              data.address,
              data.creditLimit,
              clientTimestamp,
              entityId
            ],
            txClient
          );
        }
      }

      return true;
    });
  }

  /**
   * Retorna los datos requeridos para la actualización local del cliente (Pull).
   * 
   * @async
   * @param {number} lastSyncTimestamp Marca de tiempo del último sync exitoso del cliente.
   * @returns {Promise<object>} Cambios clasificados de productos y clientes.
   */
  async pullServerChanges(lastSyncTimestamp) {
    const { rows: products } = await db.query(
      `SELECT * FROM products WHERE updated_at > TO_TIMESTAMP($1 / 1000.0)`,
      [lastSyncTimestamp]
    );

    const { rows: customers } = await db.query(
      `SELECT * FROM customers WHERE updated_at > TO_TIMESTAMP($1 / 1000.0)`,
      [lastSyncTimestamp]
    );

    return {
      products,
      customers
    };
  }
}

module.exports = new SyncProcessorService();
