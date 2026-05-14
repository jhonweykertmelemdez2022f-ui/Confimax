/**
 * HELPER DE CONEXIÓN SIMPLIFICADO PARA CONFIMAX
 * 
 * Uso:
 *   const { connectMongo, connectRedis, connectPostgres } = require('./config/connection-helper');
 *   
 *   // Conectar a MongoDB
 *   await connectMongo();
 *   
 *   // Conectar a Redis
 *   const redis = await connectRedis();
 *   
 *   // Conectar a PostgreSQL (Prisma)
 *   await connectPostgres();
 */

import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';

// ==========================================
// CONFIGURACIÓN CENTRALIZADA
// ==========================================

const CONFIG = {
  postgres: {
    // Prisma usa DATABASE_URL del .env automáticamente
    // Solo necesitamos instanciar el cliente
  },
  
  mongo: {
    host: 'localhost',
    port: 27017,
    username: 'confimax',
    password: 'mongo_secure_2024',
    database: 'confimax_logs',
    authSource: 'admin'
  },
  
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'redis_secure_2024',
    db: 0,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  }
};

// ==========================================
// POSTGRESQL - PRISMA
// ==========================================

let prismaInstance = null;

export function connectPostgres() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error']
    });
    console.log('✅ Prisma Client inicializado (PostgreSQL)');
  }
  return prismaInstance;
}

export function getPrisma() {
  if (!prismaInstance) {
    return connectPostgres();
  }
  return prismaInstance;
}

// ==========================================
// MONGODB - MONGOOSE
// ==========================================

let mongoConnection = null;

export async function connectMongo() {
  if (mongoConnection) {
    console.log('🟡 MongoDB ya conectado');
    return mongoConnection;
  }

  const { host, port, username, password, database, authSource } = CONFIG.mongo;
  const uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;

  try {
    mongoConnection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB conectado:', database);
    console.log('   Host:', host + ':' + port);
    
    // Manejar eventos
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB desconectado');
      mongoConnection = null;
    });

    return mongoConnection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    throw error;
  }
}

export function getMongoConnection() {
  return mongoConnection;
}

// ==========================================
// REDIS - IOREDIS
// ==========================================

let redisInstance = null;

export function connectRedis() {
  if (redisInstance) {
    console.log('🟡 Retornando instancia Redis existente');
    return redisInstance;
  }

  redisInstance = new Redis(CONFIG.redis);

  redisInstance.on('connect', () => {
    console.log('✅ Redis conectado');
    console.log('   Host:', CONFIG.redis.host + ':' + CONFIG.redis.port);
    console.log('   DB:', CONFIG.redis.db);
  });

  redisInstance.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  redisInstance.on('close', () => {
    console.log('🟡 Redis desconectado');
    redisInstance = null;
  });

  return redisInstance;
}

export function getRedis() {
  if (!redisInstance) {
    return connectRedis();
  }
  return redisInstance;
}

// ==========================================
// CONEXIÓN TOTAL (TODAS LAS BASES)
// ==========================================

export async function connectAll() {
  console.log('🚀 Iniciando conexiones a bases de datos...\n');
  
  try {
    // PostgreSQL (Prisma)
    connectPostgres();
    
    // MongoDB
    await connectMongo();
    
    // Redis
    connectRedis();
    
    console.log('\n✅ Todas las bases de datos conectadas!\n');
    return {
      prisma: prismaInstance,
      mongo: mongoConnection,
      redis: redisInstance
    };
  } catch (error) {
    console.error('\n❌ Error conectando bases de datos:', error.message);
    throw error;
  }
}

// ==========================================
// CIERRE LIMPIO
// ==========================================

export async function disconnectAll() {
  console.log('\n🔌 Cerrando conexiones...\n');
  
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    console.log('✅ Prisma desconectado');
    prismaInstance = null;
  }
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('✅ MongoDB desconectado');
    mongoConnection = null;
  }
  
  if (redisInstance) {
    redisInstance.disconnect();
    console.log('✅ Redis desconectado');
    redisInstance = null;
  }
  
  console.log('\n👋 Todas las conexiones cerradas\n');
}

// ==========================================
// TEST DE CONEXIÓN
// ==========================================

export async function testConnections() {
  console.log('🧪 Probando conexiones...\n');
  
  const results = {
    postgres: false,
    mongo: false,
    redis: false
  };
  
  try {
    // Test PostgreSQL
    const prisma = connectPostgres();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL: Conectado');
    results.postgres = true;
  } catch (err) {
    console.error('❌ PostgreSQL:', err.message);
  }
  
  try {
    // Test MongoDB
    await connectMongo();
    console.log('✅ MongoDB: Conectado');
    results.mongo = true;
  } catch (err) {
    console.error('❌ MongoDB:', err.message);
  }
  
  try {
    // Test Redis
    const redis = connectRedis();
    await redis.ping();
    console.log('✅ Redis: Conectado (PONG recibido)');
    results.redis = true;
  } catch (err) {
    console.error('❌ Redis:', err.message);
  }
  
  console.log('\n📊 Resultados:');
  console.log('   PostgreSQL:', results.postgres ? '✅' : '❌');
  console.log('   MongoDB:', results.mongo ? '✅' : '❌');
  console.log('   Redis:', results.redis ? '✅' : '❌');
  
  return results;
}

// Export default para importación simple
export default {
  connectPostgres,
  connectMongo,
  connectRedis,
  connectAll,
  disconnectAll,
  testConnections,
  getPrisma,
  getMongoConnection,
  getRedis
};
