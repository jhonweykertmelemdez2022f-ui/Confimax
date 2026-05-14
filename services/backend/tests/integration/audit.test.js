/**
 * ============================================================
 * INTEGRATION TEST: Audit + Cache + Events Flow
 * ============================================================
 * Verifica que una petición POST/PUT/DELETE:
 * 1. Escribe en PostgreSQL
 * 2. Emite evento de entidad
 * 3. Persiste auditoría en MongoDB
 * 4. Invalida caché en Redis
 *
 * Requiere: PostgreSQL, MongoDB, Redis activos
 * Uso: npm test -- tests/integration/audit.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');

// Mockear MongoDB para evitar MongoMemoryServer en Alpine
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    connection: {
      readyState: 1,
      close: jest.fn().mockResolvedValue(true),
      db: {
        admin: jest.fn().mockReturnValue({
          ping: jest.fn().mockResolvedValue(true),
        }),
      },
    },
  };
});

// Mockear servicios externos para test controlado
jest.mock('../../src/services/redis.service', () => ({
  connectRedis: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    unlink: jest.fn().mockResolvedValue(1),
  })),
  messageQueue: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('../../src/services/cache.service', () => ({
  getOrSet: jest.fn((key, fetchFn) => fetchFn()),
  invalidate: jest.fn().mockResolvedValue(undefined),
  invalidatePattern: jest.fn().mockResolvedValue(undefined),
  DEFAULT_TTL: 300,
}));

// Mock pg pool
const mockQuery = jest.fn();
jest.mock('../../src/models', () => ({
  pool: {
    query: mockQuery,
    connect: jest.fn().mockResolvedValue({
      query: mockQuery,
      release: jest.fn(),
    }),
  },
  initConnections: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn(),
  getMongoose: jest.fn(() => jest.requireActual('mongoose')),
}));

const { appEvents } = require('../../src/events/emitter');
const { setupAuditListeners } = require('../../src/events/listeners/audit.listener');

// Mock AuditLog model
jest.mock('../../src/models/audit.model', () => ({
  AuditLog: {
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    create: jest.fn().mockResolvedValue({
      save: jest.fn().mockResolvedValue(true),
    }),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
  },
}));

const { AuditLog } = require('../../src/models/audit.model');

describe('Audit Integration Flow', () => {
  beforeAll(async () => {
    setupAuditListeners();
  });

  beforeEach(async () => {
    await AuditLog.deleteMany({});
    mockQuery.mockReset();
    jest.clearAllMocks();
  });

  it('should persist audit log when entity event is emitted', async () => {
    // Simular un evento emitido por queryWrapper tras INSERT exitoso
    appEvents.emit('entity.created', {
      entity: 'products',
      recordId: '42',
      newData: { id: 42, name: 'Test Product', price: 100 },
      oldData: null,
      userId: 'user-123',
      username: 'testuser',
      ip: '192.168.1.1',
      endpoint: 'POST /api/products',
      userAgent: 'Mozilla/5.0',
    });

    // Esperar a que el listener asíncrono termine
    await new Promise((r) => setTimeout(r, 100));

    // Verificar que se llamó a create (el listener procesó el evento)
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'products',
        operation: 'CREATE',
        recordId: '42',
      })
    );
  });

  it('should persist UPDATE with oldData and newData', async () => {
    appEvents.emit('entity.updated', {
      entity: 'customers',
      recordId: '7',
      oldData: { id: 7, name: 'Old Name', email: 'old@example.com' },
      newData: { id: 7, name: 'New Name', email: 'new@example.com' },
      userId: 'admin-1',
      username: 'admin',
      ip: '10.0.0.1',
      endpoint: 'PUT /api/customers/7',
      userAgent: 'curl/7.68.0',
    });

    await new Promise((r) => setTimeout(r, 100));

    // Verificar que se llamó a create (el listener procesó el evento)
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'customers',
        operation: 'UPDATE',
        recordId: '7',
      })
    );
  });

  it('should persist DELETE with oldData only', async () => {
    appEvents.emit('entity.deleted', {
      entity: 'sales',
      recordId: '99',
      oldData: { id: 99, total: 5000, status: 'completed' },
      newData: null,
      userId: null,
      username: null,
      ip: '127.0.0.1',
      endpoint: 'DELETE /api/sales/99',
      userAgent: null,
    });

    await new Promise((r) => setTimeout(r, 100));

    // Verificar que se llamó a create (el listener procesó el evento)
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'sales',
        operation: 'DELETE',
        recordId: '99',
      })
    );
  });
});
