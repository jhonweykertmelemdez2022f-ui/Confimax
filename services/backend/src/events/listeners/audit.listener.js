/**
 * ============================================================
 * AUDIT LISTENER
 * ============================================================
 * Suscriptor de eventos de entidad que persiste logs de auditoría
 * en MongoDB de forma asíncrona y no bloqueante.
 *
 * Principios:
 * - Si PostgreSQL falló, el evento no se emite → no hay auditoría huérfana.
 * - Si MongoDB falla, se loguea el error pero no se afecta la operación principal.
 */

const { AuditLog } = require('../../models/audit.model');
const { appEvents } = require('../emitter');

function setupAuditListeners() {
  appEvents.on('entity.created', async (payload) => {
    await persistAudit('CREATE', payload);
  });

  appEvents.on('entity.updated', async (payload) => {
    await persistAudit('UPDATE', payload);
  });

  appEvents.on('entity.deleted', async (payload) => {
    await persistAudit('DELETE', payload);
  });

  console.log('[AUDIT-LISTENER] Listeners registrados');
}

async function persistAudit(operation, payload) {
  try {
    const {
      entity,
      recordId,
      oldData,
      newData,
      userId,
      username,
      ip,
      endpoint,
      userAgent,
      status = 'success',
      errorMessage,
    } = payload;

    await AuditLog.create({
      entity,
      operation,
      recordId: recordId ? String(recordId) : null,
      oldData: operation === 'UPDATE' || operation === 'DELETE' ? oldData : undefined,
      newData: operation === 'CREATE' || operation === 'UPDATE' ? newData : undefined,
      userId: userId || null,
      username: username || null,
      ipAddress: ip || null,
      endpoint: endpoint || null,
      userAgent: userAgent || null,
      status,
      errorMessage: errorMessage || null,
    });
  } catch (err) {
    console.error('[AUDIT-LISTENER] Error persistiendo auditoría:', err.message);
  }
}

module.exports = { setupAuditListeners };
