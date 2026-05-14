/**
 * ============================================================
 * EVENT EMITTER CENTRALIZADO
 * ============================================================
 * EventEmitter nativo de Node.js para desacoplar operaciones
 * de escritura en PostgreSQL de la auditoría en MongoDB.
 *
 * Eventos emitidos:
 *   entity.created   → { entity, operation: 'CREATE', recordId, newData, userId, username, ip, endpoint }
 *   entity.updated   → { entity, operation: 'UPDATE', recordId, oldData, newData, userId, username, ip, endpoint }
 *   entity.deleted   → { entity, operation: 'DELETE', recordId, oldData, userId, username, ip, endpoint }
 */

const { EventEmitter } = require('events');

const appEvents = new EventEmitter();

// Evitar memory leaks en listeners durante desarrollo
appEvents.setMaxListeners(20);

/**
 * Helper para emitir eventos de entidad con metadata del request
 * @param {string} operation - 'CREATE' | 'UPDATE' | 'DELETE'
 * @param {object} payload
 */
function emitEntityEvent(operation, payload) {
  const eventNameMap = {
    CREATE: 'entity.created',
    UPDATE: 'entity.updated',
    DELETE: 'entity.deleted',
  };

  const eventName = eventNameMap[operation];
  if (!eventName) {
    console.warn(`[EVENTS] Operación desconocida: ${operation}`);
    return;
  }

  appEvents.emit(eventName, payload);
}

module.exports = {
  appEvents,
  emitEntityEvent,
};
