/**
 * @file sync-engine.js
 * @description Motor de Sincronización Offline-First Avanzado para el cliente móvil.
 * Implementa Vector Clocks, cola local con WatermelonDB y re-sincronización
 * proactiva escuchando los cambios de red mediante NetInfo.

 */

import NetInfo from '@react-native-community/netinfo';
import { getDatabase } from './database';
import { VectorClock } from './sync';
import axios from 'axios';

// Instancia configurada de cliente HTTP
const api = axios.create({
  baseURL: 'https://api-confimax.bitforges.com/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Clase que gestiona el motor de sincronización bidireccional local.
 */
class OfflineSyncEngine {
  constructor() {
    this.isSyncing = false;
    this.isOnline = false;
    this.unsubscribeNetworkListener = null;
  }

  /**
   * Inicializa el listener de red y realiza una primera sincronización si hay red.
   * @returns {void}
   */
  initialize() {
    console.log('[SyncEngine] Inicializando detector de red y sincronización...');

    // Suscripción al estado de red
    this.unsubscribeNetworkListener = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected;

      console.log(`[SyncEngine] Red detectada: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);

      // Si el dispositivo estaba offline y se conecta, fuerza vaciar la cola inmediatamente
      if (this.isOnline && wasOffline) {
        console.log('[SyncEngine] Transición de red detectada Offline -> Online. Vaciando cola de cambios...');
        this.flushQueue().catch(err => {
          console.error('[SyncEngine] Error al vaciar cola en transición de red:', err);
        });
      }
    });
  }

  /**
   * Libera los recursos del listener de red al desmontar el motor.
   * @returns {void}
   */
  destroy() {
    if (this.unsubscribeNetworkListener) {
      this.unsubscribeNetworkListener();
      console.log('[SyncEngine] Suscripción de red removida con éxito.');
    }
  }

  /**
   * Obtiene la marca de tiempo (timestamp) del cliente.
   * @returns {number} Timestamp actual en milisegundos.
   */
  getClientTimestamp() {
    return Date.now();
  }

  /**
   * Vaciado y procesamiento bidireccional de la cola local contra el backend central.
   * Lee la colección `sync_queue` de WatermelonDB, empaqueta el lote, lo envía,
   * y limpia los elementos procesados con éxito.
   * 
   * @async
   * @returns {Promise<boolean>} Retorna true si el vaciado fue exitoso, false en caso contrario.
   */
  async flushQueue() {
    if (this.isSyncing) {
      console.log('[SyncEngine] Sincronización en curso. Omitiendo intento duplicado.');
      return false;
    }
    if (!this.isOnline) {
      console.warn('[SyncEngine] Dispositivo OFFLINE. Imposible vaciar cola al backend.');
      return false;
    }

    this.isSyncing = true;
    const db = getDatabase();

    try {
      // 1. Leer los registros pendientes en la cola local de sincronización
      const queueCollection = db.get('sync_queue');
      const pendingChanges = await queueCollection.query().fetch();

      if (pendingChanges.length === 0) {
        console.log('[SyncEngine] No existen cambios pendientes en la cola local.');
        this.isSyncing = false;
        // Igual descargamos actualizaciones del servidor para garantizar consistencia
        await this.pullUpdatesFromServer(db);
        return true;
      }

      console.log(`[SyncEngine] Detectados ${pendingChanges.length} cambios pendientes de procesar.`);

      // 2. Cargar el Vector Clock del cliente desde almacenamiento local
      // En este caso, simulamos el estado del reloj incremental
      const localClock = new VectorClock();
      localClock.increment('client_mobile');

      // 3. Serializar y agrupar el lote de operaciones (batch)
      const batchPayload = pendingChanges.map(change => {
        const parsedData = JSON.parse(change.data);
        return {
          id: change.id,
          entityId: change.entityId,
          entityType: change.entityType,
          operation: change.operation,
          data: parsedData,
          clientTimestamp: parsedData.clientTimestamp || this.getClientTimestamp(),
          vectorClock: localClock.clock
        };
      });

      console.log('[SyncEngine] Enviando lote al buffer del backend API Gateway...', batchPayload);

      // 4. Enviar lote de sincronización a través del Gateway
      const response = await api.post('/sync/flush', {
        clientId: 'client_mobile_001',
        changes: batchPayload,
        clientClock: localClock.clock
      });

      if (response.status === 200 && response.data.success) {
        const { processedIds, serverClock } = response.data;
        console.log(`[SyncEngine] Servidor procesó con éxito ${processedIds.length} transacciones.`);

        // 5. Eliminar registros de la cola local que fueron persistidos en el servidor
        await db.write(async () => {
          for (const change of pendingChanges) {
            if (processedIds.includes(change.id)) {
              await change.destroyPermanently();
            }
          }
        });

        // 6. Mezclar el reloj vectorial del servidor con el local
        localClock.merge(serverClock);
        console.log('[SyncEngine] Vector Clock local actualizado y fusionado:', localClock.toJSON());

        // 7. Descargar las últimas actualizaciones remotas (pull)
        await this.pullUpdatesFromServer(db);

        this.isSyncing = false;
        return true;
      } else {
        throw new Error('Respuesta de servidor inválida o fallida durante el sync');
      }
    } catch (error) {
      console.error('[SyncEngine] Error crítico durante la sincronización offline-first:', error);
      this.isSyncing = false;
      return false;
    }
  }

  /**
   * Descarga de actualizaciones desde el servidor para aplicar LWW localmente.
   * @async
   * @param {Database} db Instancia de base de datos local WatermelonDB.
   * @returns {Promise<void>}
   */
  async pullUpdatesFromServer(db) {
    try {
      console.log('[SyncEngine] Iniciando descarga de actualizaciones desde el backend...');
      const response = await api.get('/sync/pull', {
        params: { lastSyncTimestamp: this.getClientTimestamp() - (24 * 60 * 60 * 1000) } // Últimas 24h
      });

      const { products, customers } = response.data;

      await db.write(async () => {
        // Actualizar Productos
        const productsCollection = db.get('products');
        for (const item of products || []) {
          const localItem = await productsCollection.query().fetch().then(list => list.find(p => p.serverId === item.id));

          if (localItem) {
            // LWW (Last Write Wins): Si la versión o el timestamp del servidor es más reciente
            if (item.version > localItem.version || new Date(item.updated_at).getTime() > localItem.lastUpdated) {
              await localItem.update(record => {
                record.name = item.name;
                record.sku = item.sku;
                record.unitPrice = item.unit_price;
                record.stockQuantity = item.stock_quantity;
                record.version = item.version;
                record.synced = true;
              });
            }
          } else {
            await productsCollection.create(record => {
              record.serverId = item.id;
              record.name = item.name;
              record.sku = item.sku;
              record.unitPrice = item.unit_price;
              record.stockQuantity = item.stock_quantity;
              record.version = item.version;
              record.synced = true;
            });
          }
        }
      });

      console.log('[SyncEngine] Descarga y resolución LWW completada de forma óptima.');
    } catch (err) {
      console.error('[SyncEngine] Error al sincronizar actualizaciones remotas:', err);
    }
  }
}

export const SyncEngine = new OfflineSyncEngine();
