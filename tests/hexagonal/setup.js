/**
 * Setup para Tests de Arquitectura Hexagonal
 * Se ejecuta antes de cada archivo de test
 * 
 * Configurado para Docker con:
 *   - PostgreSQL: Supabase (cloud)
 *   - Redis: Upstash (cloud)
 *   - MongoDB: MongoDB Atlas (cloud)
 *   - Tailscale: Para acceso seguro (opcional)
 */

// Silenciar logs durante tests (opcional)
if (process.env.SILENT_TESTS === 'true') {
  console.log = jest.fn();
  console.warn = jest.fn();
}

// Configuración global de timeouts para conexiones a BD (30s para cloud)
jest.setTimeout(30000);

// Helpers globales para tests
global.testUtils = {
  /**
   * Genera un UUID válido para tests
   */
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Crea un mock de repositorio PostgreSQL
   */
  createMockPGRepository: () => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }),

  /**
   * Crea un mock de cliente Redis
   */
  createMockRedisClient: () => ({
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  }),

  /**
   * Crea un mock de colección MongoDB
   */
  createMockMongoCollection: () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn()
  }),

  /**
   * Obtiene la URL de conexión a PostgreSQL (DATABASE_URL)
   */
  getPostgresConfig: () => ({
    url: process.env.DATABASE_URL || 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres?sslmode=require'
  }),

  /**
   * Obtiene la URL de conexión a Redis (Upstash o local)
   */
  getRedisConfig: () => ({
    url: process.env.REDIS_URL || 'rediss://default:gQAAAAAAAdIgAAIgcDFhNDRkNmE3OTg5YjA0MDBlODE4MzQxMGY5NGVjNmU0Mg@good-iguana-119328.upstash.io:6379'
  }),

  /**
   * Obtiene la URL de conexión a MongoDB (Atlas o local)
   */
  getMongoConfig: () => ({
    uri: process.env.MONGO_URL || 'mongodb://jak:jema2019@ac-s1gj562-shard-00-00.tedq2nv.mongodb.net:27017,ac-s1gj562-shard-00-01.tedq2nv.mongodb.net:27017,ac-s1gj562-shard-00-02.tedq2nv.mongodb.net:27017/confimax_notifications?ssl=true&replicaSet=atlas-mrqwtn-shard-0&authSource=admin&appName=Confimax',
    dbName: process.env.MONGO_DB || 'confimax_notifications'
  }),

  /**
   * Obtiene la URL de un servicio
   */
  getServiceUrl: (serviceName) => {
    const urls = {
      auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002',
      sales: process.env.SALES_SERVICE_URL || 'http://sales-service:3003',
      customers: process.env.CUSTOMERS_SERVICE_URL || 'http://customers-service:3004',
      notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3005',
      backend: process.env.BACKEND_URL || 'http://backend:3006'
    };
    return urls[serviceName] || urls.backend;
  }
};

// Mensaje de inicio
console.log('🧪 Setup de Tests Hexagonales completado');
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres?sslmode=require';
console.log(`📦 PostgreSQL: ${dbUrl.split('@')[1]?.split('/')[0] || 'db.tlrliqbgtdplwdvbxqxv.supabase.co'}`);
console.log(`📊 Database: ${dbUrl.split('/')[3]?.split('?')[0] || 'postgres'} (Schemas: auth, inventory, sales, customers)`);
console.log(`🔴 Redis: ${process.env.REDIS_URL?.split('@')[1]?.split('/')[0] || 'good-iguana-119328.upstash.io:6379'}`);
console.log(`🍃 MongoDB: ${process.env.MONGO_URL?.split('@')[1]?.split('/')[0] || 'confimax.tedq2nv.mongodb.net'}`);
console.log(`🔗 Backend: ${process.env.BACKEND_URL || 'http://backend:3006'}`);
if (process.env.TS_AUTHKEY) {
  console.log(`🔒 Tailscale: Habilitado (${process.env.TS_HOSTNAME || 'confimax-hexagonal-tests'})`);
}
