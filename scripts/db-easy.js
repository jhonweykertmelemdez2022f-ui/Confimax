#!/usr/bin/env node
/**
 * CONEXIÓN SIMPLIFICADA A BASES DE DATOS
 * Este script se ejecuta desde web/ automáticamente
 * 
 * Uso:
 *   node ../scripts/db-easy.js              # Desde web/
 *   node scripts/db-easy.js                 # Desde Farm/
 */

import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';

// Colores para output
const c = {
  ok: '\x1b[32m✅\x1b[0m',
  err: '\x1b[31m❌\x1b[0m',
  warn: '\x1b[33m⚠️\x1b[0m',
  info: '\x1b[36mℹ️\x1b[0m',
  reset: '\x1b[0m'
};

console.log('\n═══════════════════════════════════════════');
console.log('🔗 CONEXIÓN FÁCIL A BASES DE DATOS');
console.log('═══════════════════════════════════════════\n');

// ==========================================
// 1. POSTGRESQL (Prisma)
// ==========================================
console.log('🐘 Probando PostgreSQL...');
let prisma = null;
let pgOk = false;

try {
  prisma = new PrismaClient();
  
  // Test simple
  const count = await prisma.user.count();
  console.log(`${c.ok} PostgreSQL conectado`);
  console.log(`   Usuarios en DB: ${count}`);
  pgOk = true;
} catch (err) {
  console.log(`${c.err} PostgreSQL: ${err.message}`);
}

// ==========================================
// 2. MONGODB (Mongoose)
// ==========================================
console.log('\n📗 Probando MongoDB...');
let mongoOk = false;

try {
  await mongoose.connect('mongodb://confimax:mongo_secure_2024@localhost:27017/confimax_logs?authSource=admin', {
    serverSelectionTimeoutMS: 5000
  });
  
  console.log(`${c.ok} MongoDB conectado`);
  console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  console.log(`   Database: ${mongoose.connection.name}`);
  mongoOk = true;
} catch (err) {
  console.log(`${c.err} MongoDB: ${err.message}`);
}

// ==========================================
// 3. REDIS (ioredis)
// ==========================================
console.log('\n🔴 Probando Redis...');
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'redis_secure_2024',
  retryStrategy: null
});

let redisOk = false;

try {
  const pong = await redis.ping();
  console.log(`${c.ok} Redis conectado (${pong})`);
  
  // Test de almacenamiento
  await redis.set('test:connection', 'OK');
  const testVal = await redis.get('test:connection');
  console.log(`   Test almacenamiento: ${testVal}`);
  
  redisOk = true;
} catch (err) {
  console.log(`${c.err} Redis: ${err.message}`);
} finally {
  redis.disconnect();
}

// ==========================================
// RESUMEN
// ==========================================
console.log('\n═══════════════════════════════════════════');
console.log('📊 RESULTADO');
console.log('──────────────────────────────');
console.log(`PostgreSQL: ${pgOk ? c.ok : c.err}`);
console.log(`MongoDB:    ${mongoOk ? c.ok : c.err}`);
console.log(`Redis:      ${redisOk ? c.ok : c.err}`);
console.log('──────────────────────────────');

const allOk = pgOk && mongoOk && redisOk;
if (allOk) {
  console.log('🎉 TODAS LAS BASES DE DATOS CONECTADAS');
} else {
  console.log(`${c.warn} ALGUNAS CONEXIONES FALLARON`);
}
console.log('═══════════════════════════════════════════\n');

// Cerrar conexiones limpiamente
if (prisma) await prisma.$disconnect();
if (mongoose.connection.readyState !== 0) await mongoose.connection.close();

process.exit(allOk ? 0 : 1);
