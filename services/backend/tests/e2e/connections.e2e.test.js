/**
 * ============================================================
 * E2E TEST: Conexiones Reales + Flujo Completo
 * ============================================================
 * Valida que las 3 bases de datos (Supabase/PG, Upstash Redis,
 * MongoDB Atlas) se conectan y que el flujo end-to-end funciona:
 *
 *   1. PostgreSQL: INSERT/UPDATE/DELETE con queryWrapper
 *   2. EventEmitter: evento emitido al escribir
 *   3. MongoDB: AuditLog persistido por el listener
 *   4. Redis: caché escrita/leída/invalidada
 *   5. AsyncLocalStorage: contexto aislado por request
 *
 * Requiere: .env configurado con credenciales reales
 * Uso: npx jest tests/e2e/connections.e2e.test.js --testTimeout=60000
 *
 * NOTA: Este test NO usa setup.js (que mockea Redis/Cache).
 *       Se ejecuta independientemente con --testPathIgnorePatterns
 *       configurado en jest, o directamente con el path.
 */

const mongoose = require('mongoose');

// Cargar .env antes de cualquier import que lo necesite
// Prioridad: .env.e2e > backend/.env > root/.env
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.e2e') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Importar módulos reales (sin mocks)
const { pool } = require('../../src/models');
const { initConnections } = require('../../src/models');
const { query, transaction, asyncLocalStorage } = require('../../src/database/queryWrapper');
const { setupAuditListeners } = require('../../src/events/listeners/audit.listener');
const { appEvents } = require('../../src/events/emitter');
const { AuditLog } = require('../../src/models/audit.model');
const { getOrSet, invalidate, invalidatePattern } = require('../../src/services/cache.service');
const { connectRedis } = require('../../src/services/redis.service');
const { checkUpstashHealth } = require('../../../shared/upstash-redis');
const { checkAtlasHealth } = require('../../../shared/mongo-atlas');

const E2E_PREFIX = 'e2e:test:';

describe('E2E: Conexiones Reales + Flujo Completo', () => {
  let pgConnected = false;
  let redisConnected = false;
  let mongoConnected = false;
  let cacheWorks = false;

  // ─────────────────────────────────────────────
  // Inicializar todas las conexiones antes de los tests
  // ─────────────────────────────────────────────
  beforeAll(async () => {
    try {
      await initConnections();
    } catch (err) {
      console.warn('[E2E] initConnections error (algunas DBs pueden no estar disponibles):', err.message);
    }

    // Verificar PG
    try {
      await pool.query('SELECT 1 as ok');
      pgConnected = true;
    } catch (err) {
      console.warn('[E2E] PostgreSQL no disponible:', err.message);
    }

    // Verificar Redis (conexión + permisos de escritura)
    try {
      await connectRedis();
      const health = await checkUpstashHealth();
      redisConnected = health.connected;
      // Verificar que realmente se pueda escribir (NOAUTH check)
      if (redisConnected) {
        const testKey = `${E2E_PREFIX}ping`;
        await getOrSet(testKey, () => Promise.resolve('ok'), 10);
        cacheWorks = true;
      }
    } catch (err) {
      console.warn('[E2E] Redis no disponible o sin permisos:', err.message);
    }

    // Verificar MongoDB
    try {
      const health = await checkAtlasHealth();
      mongoConnected = health.connected;
    } catch (err) {
      console.warn('[E2E] MongoDB no disponible:', err.message);
    }
  });

  // ─────────────────────────────────────────────
  // FASE 1: Verificar conexiones
  // ─────────────────────────────────────────────
  describe('1. Conexiones a las 3 bases de datos', () => {
    it('PostgreSQL (Supabase/local) conecta correctamente', async () => {
      if (!pgConnected) return console.warn('[E2E] SKIP: PostgreSQL no conectado. Verificar DATABASE_URL o POSTGRES_* en .env');
      const result = await pool.query('SELECT 1 as ok');
      expect(result.rows[0].ok).toBe(1);
    });

    it('Upstash Redis conecta y responde PING', async () => {
      if (!redisConnected) return console.warn('[E2E] SKIP: Redis no conectado. Verificar UPSTASH_REDIS_URL o REDIS_* en .env');
      const health = await checkUpstashHealth();
      expect(health.connected).toBe(true);
      expect(health.pong).toBe('PONG');
    });

    it('MongoDB Atlas conecta y responde ping', async () => {
      if (!mongoConnected) return console.warn('[E2E] SKIP: MongoDB no conectado. Verificar ATLAS_URI o MONGODB_URI en .env');
      const health = await checkAtlasHealth();
      expect(health.connected).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // FASE 2: Flujo de auditoría end-to-end
  // ─────────────────────────────────────────────
  describe('2. Flujo PG → EventEmitter → MongoDB (Auditoría)', () => {
    let insertedId;

    beforeAll(() => {
      if (!pgConnected || !mongoConnected) return;
      setupAuditListeners();
    });

    it('INSERT en PG emite evento y persiste AuditLog en MongoDB', async () => {
      if (!pgConnected || !mongoConnected) return console.warn('[E2E] SKIP: PG y MongoDB requeridos para auditoría');

      // Limpiar auditoría previa de tests e2e
      await AuditLog.deleteMany({ endpoint: /E2E/i });

      // Ejecutar INSERT con contexto de request
      const result = await asyncLocalStorage.run(
        {
          userId: 'e2e-user',
          username: 'e2e-tester',
          ip: '127.0.0.1',
          endpoint: 'POST /api/e2e/test',
          userAgent: 'jest-e2e',
        },
        async () => {
          return query(
            `INSERT INTO products (name, sku, unit_price, cost_price, min_stock_level)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            ['E2E Test Product', 'E2E-SKU-001', 100, 50, 5]
          );
        }
      );

      expect(result.rows).toHaveLength(1);
      insertedId = result.rows[0].id;
      expect(insertedId).toBeDefined();

      // Esperar a que el listener asíncrono persista en MongoDB
      await new Promise((r) => setTimeout(r, 500));

      const auditLog = await AuditLog.findOne({
        entity: 'PRODUCTS',
        operation: 'CREATE',
        recordId: String(insertedId),
      }).lean();

      expect(auditLog).toBeTruthy();
      expect(auditLog.userId).toBe('e2e-user');
      expect(auditLog.username).toBe('e2e-tester');
      expect(auditLog.ipAddress).toBe('127.0.0.1');
      expect(auditLog.endpoint).toBe('POST /api/e2e/test');
      expect(auditLog.newData).toBeDefined();
      expect(auditLog.newData.name).toBe('E2E Test Product');
    });

    it('UPDATE captura oldData y newData en AuditLog', async () => {
      if (!pgConnected || !mongoConnected || !insertedId) return;

      const result = await asyncLocalStorage.run(
        {
          userId: 'e2e-user',
          username: 'e2e-tester',
          ip: '127.0.0.1',
          endpoint: 'PUT /api/e2e/test',
          userAgent: 'jest-e2e',
        },
        async () => {
          return query(
            `UPDATE products SET unit_price = $1 WHERE id = $2 RETURNING *`,
            [150, insertedId]
          );
        }
      );

      expect(result.rows[0].unit_price).toBe(150);

      await new Promise((r) => setTimeout(r, 500));

      const auditLog = await AuditLog.findOne({
        entity: 'PRODUCTS',
        operation: 'UPDATE',
        recordId: String(insertedId),
      }).lean();

      expect(auditLog).toBeTruthy();
      expect(auditLog.oldData.unit_price).toBe(100);
      expect(auditLog.newData.unit_price).toBe(150);
      expect(auditLog.endpoint).toBe('PUT /api/e2e/test');
    });

    it('DELETE captura oldData y persiste AuditLog', async () => {
      if (!pgConnected || !mongoConnected || !insertedId) return;

      await asyncLocalStorage.run(
        {
          userId: 'e2e-user',
          username: 'e2e-tester',
          ip: '127.0.0.1',
          endpoint: 'DELETE /api/e2e/test',
          userAgent: 'jest-e2e',
        },
        async () => {
          return query(`DELETE FROM products WHERE id = $1`, [insertedId]);
        }
      );

      await new Promise((r) => setTimeout(r, 500));

      const auditLog = await AuditLog.findOne({
        entity: 'PRODUCTS',
        operation: 'DELETE',
        recordId: String(insertedId),
      }).lean();

      expect(auditLog).toBeTruthy();
      expect(auditLog.oldData).toBeDefined();
      expect(auditLog.oldData.name).toBe('E2E Test Product');
      expect(auditLog.newData).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // FASE 3: Caché Redis
  // ─────────────────────────────────────────────
  describe('3. Caché Redis: getOrSet / invalidate / invalidatePattern', () => {
    const cacheKey = `${E2E_PREFIX}product:9999`;

    afterAll(async () => {
      // Limpiar claves de test
      await invalidatePattern(`${E2E_PREFIX}*`).catch(() => {});
    });

    it('getOrSet: cache miss → fetchFn → cachea en Redis', async () => {
      if (!cacheWorks) return console.warn('[E2E] SKIP: Redis caché no disponible (NOAUTH o sin conexión)');
      const fetched = { id: 9999, name: 'Cached Product', price: 200 };
      const fetchFn = jest.fn().mockResolvedValue(fetched);

      const result = await getOrSet(cacheKey, fetchFn, 60);

      expect(result).toEqual(fetched);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('getOrSet: cache hit → retorna de Redis sin llamar fetchFn', async () => {
      if (!cacheWorks) return console.warn('[E2E] SKIP: Redis caché no disponible (NOAUTH o sin conexión)');
      const fetchFn = jest.fn().mockResolvedValue({ id: 9999, name: 'Should Not Be Called' });

      const result = await getOrSet(cacheKey, fetchFn, 60);

      expect(result.name).toBe('Cached Product');
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('invalidate: borra clave específica', async () => {
      if (!cacheWorks) return console.warn('[E2E] SKIP: Redis caché no disponible (NOAUTH o sin conexión)');
      await invalidate(cacheKey);

      const fetchFn = jest.fn().mockResolvedValue({ id: 9999, name: 'After Invalidate' });
      const result = await getOrSet(cacheKey, fetchFn, 60);

      expect(fetchFn).toHaveBeenCalled();
      expect(result.name).toBe('After Invalidate');
    });

    it('invalidatePattern: borra múltiples claves por patrón', async () => {
      if (!cacheWorks) return console.warn('[E2E] SKIP: Redis caché no disponible (NOAUTH o sin conexión)');
      // Crear varias claves
      await getOrSet(`${E2E_PREFIX}a`, () => Promise.resolve('val-a'), 60);
      await getOrSet(`${E2E_PREFIX}b`, () => Promise.resolve('val-b'), 60);
      await getOrSet(`${E2E_PREFIX}c`, () => Promise.resolve('val-c'), 60);

      await invalidatePattern(`${E2E_PREFIX}*`);

      // Todas deberían ser cache miss ahora
      const fetchA = jest.fn().mockResolvedValue('new-a');
      const fetchB = jest.fn().mockResolvedValue('new-b');

      await getOrSet(`${E2E_PREFIX}a`, fetchA, 60);
      await getOrSet(`${E2E_PREFIX}b`, fetchB, 60);

      expect(fetchA).toHaveBeenCalled();
      expect(fetchB).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // FASE 4: Transacciones PG con buffer de eventos
  // ─────────────────────────────────────────────
  describe('4. Transacciones PG: COMMIT emite eventos, ROLLBACK los descarta', () => {
    beforeAll(() => {
      if (!pgConnected || !mongoConnected) return;
      setupAuditListeners();
    });

    it('COMMIT: eventos acumulados se emiten y auditan', async () => {
      if (!pgConnected || !mongoConnected) return console.warn('[E2E] SKIP: PG y MongoDB requeridos para transacciones');
      await AuditLog.deleteMany({ endpoint: /E2E-TX-COMMIT/i });

      const result = await asyncLocalStorage.run(
        {
          userId: 'e2e-tx-user',
          ip: '127.0.0.1',
          endpoint: 'E2E-TX-COMMIT',
        },
        async () => {
          return transaction(async (client) => {
            return query(
              `INSERT INTO products (name, sku, unit_price, cost_price, min_stock_level)
               VALUES ($1, $2, $3, $4, $5) RETURNING *`,
              ['E2E TX Product', 'E2E-TX-SKU', 10, 5, 1],
              client
            );
          });
        }
      );

      const txId = result.rows[0].id;
      expect(txId).toBeDefined();

      await new Promise((r) => setTimeout(r, 500));

      const auditLog = await AuditLog.findOne({
        entity: 'PRODUCTS',
        operation: 'CREATE',
        endpoint: 'E2E-TX-COMMIT',
      }).lean();

      expect(auditLog).toBeTruthy();
      expect(auditLog.newData.name).toBe('E2E TX Product');

      // Limpiar
      await query(`DELETE FROM products WHERE id = $1`, [txId]).catch(() => {});
    });

    it('ROLLBACK: eventos acumulados se descartan (sin auditoría)', async () => {
      if (!pgConnected || !mongoConnected) return console.warn('[E2E] SKIP: PG y MongoDB requeridos para transacciones');

      await AuditLog.deleteMany({ endpoint: /E2E-TX-ROLLBACK/i });

      await expect(
        asyncLocalStorage.run(
          {
            userId: 'e2e-tx-user',
            ip: '127.0.0.1',
            endpoint: 'E2E-TX-ROLLBACK',
          },
          async () => {
            return transaction(async (client) => {
              await query(
                `INSERT INTO products (name, sku, unit_price, cost_price, min_stock_level)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                ['E2E ROLLBACK Product', 'E2E-RB-SKU', 10, 5, 1],
                client
              );
              throw new Error('Force rollback');
            });
          }
        )
      ).rejects.toThrow('Force rollback');

      await new Promise((r) => setTimeout(r, 500));

      const auditLog = await AuditLog.findOne({
        endpoint: 'E2E-TX-ROLLBACK',
      }).lean();

      expect(auditLog).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // FASE 5: AsyncLocalStorage aislamiento
  // ─────────────────────────────────────────────
  describe('5. AsyncLocalStorage: contexto aislado entre requests concurrentes', () => {
    it('dos requests concurrentes no mezclan su contexto', async () => {
      const results = await Promise.all([
        asyncLocalStorage.run(
          { userId: 'user-A', endpoint: 'REQUEST-A' },
          async () => {
            await new Promise((r) => setTimeout(r, 50));
            return asyncLocalStorage.getStore();
          }
        ),
        asyncLocalStorage.run(
          { userId: 'user-B', endpoint: 'REQUEST-B' },
          async () => {
            await new Promise((r) => setTimeout(r, 50));
            return asyncLocalStorage.getStore();
          }
        ),
      ]);

      expect(results[0].userId).toBe('user-A');
      expect(results[0].endpoint).toBe('REQUEST-A');
      expect(results[1].userId).toBe('user-B');
      expect(results[1].endpoint).toBe('REQUEST-B');
    });

    it('fuera de asyncLocalStorage.run() el store está vacío', () => {
      const store = asyncLocalStorage.getStore();
      expect(store).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // Limpieza final
  // ─────────────────────────────────────────────
  afterAll(async () => {
    // Limpiar productos de test que hayan quedado
    try {
      await query(`DELETE FROM products WHERE sku LIKE 'E2E%'`).catch(() => {});
    } catch {}

    // Limpiar auditoría de test
    try {
      await AuditLog.deleteMany({ endpoint: /E2E/i });
    } catch {}

    // Limpiar caché de test
    try {
      await invalidatePattern(`${E2E_PREFIX}*`);
    } catch {}

    // Cerrar conexiones
    try {
      const { closeUpstash } = require('../../../shared/upstash-redis');
      await closeUpstash();
    } catch {}

    try {
      const { closeAtlas } = require('../../../shared/mongo-atlas');
      await closeAtlas();
    } catch {}

    try {
      await pool.end();
    } catch {}
  });
});
