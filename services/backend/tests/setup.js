process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';
process.env.PORT = '3006';

// Mock Redis para tests
jest.mock('../src/services/redis.service', () => ({
  connectRedis: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    unlink: jest.fn().mockResolvedValue(1),
  })),
  messageQueue: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    publish: jest.fn().mockResolvedValue(true),
  },
}));

// Mock del servicio de auditoría para evitar conexiones reales a MongoDB
jest.mock('../src/services/audit.service', () => ({
  log: jest.fn().mockResolvedValue(undefined),
  logLogin: jest.fn().mockResolvedValue(undefined),
  logLogout: jest.fn().mockResolvedValue(undefined),
  logRegister: jest.fn().mockResolvedValue(undefined),
  getLogs: jest.fn().mockResolvedValue([]),
  getUserActivity: jest.fn().mockResolvedValue([]),
}));

// Aumentar timeout para tests de integración
jest.setTimeout(30000);
