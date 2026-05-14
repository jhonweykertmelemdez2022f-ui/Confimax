#!/usr/bin/env node
/**
 * CONEXIÓN RÁPIDA Y EJEMPLOS DE USO
 * 
 * Uso:
 *   node scripts/quick-connect.js [postgres|mongo|redis|all]
 * 
 * Ejemplos:
 *   node scripts/quick-connect.js postgres    # Solo PostgreSQL
 *   node scripts/quick-connect.js mongo       # Solo MongoDB
 *   node scripts/quick-connect.js redis       # Solo Redis
 *   node scripts/quick-connect.js all         # Todas (default)
 */

import {
  connectPostgres,
  connectMongo,
  connectRedis,
  getPrisma,
  getRedis
} from '../config/connection-helper.js';

const target = process.argv[2] || 'all';

async function testPostgres() {
  console.log('\n🐘 POSTGRESQL (Prisma)');
  console.log('──────────────────────────────');
  
  try {
    const prisma = connectPostgres();
    
    // Contar registros
    const users = await prisma.user.count();
    const products = await prisma.product.count();
    const sales = await prisma.sale.count();
    
    console.log('✅ Conectado');
    console.log(`   Usuarios: ${users}`);
    console.log(`   Productos: ${products}`);
    console.log(`   Ventas: ${sales}`);
    
    // Ejemplo de consulta
    const product = await prisma.product.findFirst({
      where: { deletedAt: null },
      include: { category: true }
    });
    
    if (product) {
      console.log(`   📦 Ejemplo: ${product.name} ($${product.unitPrice})`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function testMongo() {
  console.log('\n📗 MONGODB (Mongoose)');
  console.log('──────────────────────────────');
  
  try {
    await connectMongo();
    
    // Verificar estado
    const state = {
      0: '❌ Desconectado',
      1: '🟡 Conectando',
      2: '✅ Conectado',
      3: '🔴 Desconectando'
    };
    
    const mongoose = await import('mongoose');
    console.log('✅ Conectado');
    console.log('   Estado:', state[mongoose.default.connection.readyState]);
    console.log('   Host:', mongoose.default.connection.host + ':' + mongoose.default.connection.port);
    console.log('   Database:', mongoose.default.connection.name);
    
    // Intentar insertar un log de prueba
    const Log = mongoose.default.model('Log', new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    }));
    
    await Log.create({ message: 'Test connection' });
    const count = await Log.countDocuments();
    console.log(`   📝 Logs en DB: ${count}`);
    
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function testRedis() {
  console.log('\n🔴 REDIS (ioredis)');
  console.log('──────────────────────────────');
  
  try {
    const redis = connectRedis();
    
    // Test PING
    const pong = await redis.ping();
    console.log('✅ Conectado');
    console.log('   Respuesta:', pong);
    
    // Guardar y recuperar valor
    await redis.set('test:key', 'Hello Confimax!');
    const value = await redis.get('test:key');
    console.log('   💾 Test almacenamiento:', value);
    
    // Info de memoria
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory:(\d+)/);
    if (usedMemory) {
      const mb = (parseInt(usedMemory[1]) / 1024 / 1024).toFixed(2);
      console.log(`   💾 Memoria usada: ${mb} MB`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🔗 CONEXIÓN RÁPIDA A BASES DE DATOS');
  console.log('═══════════════════════════════════════════');
  
  const results = {};
  
  if (target === 'all' || target === 'postgres') {
    results.postgres = await testPostgres();
  }
  
  if (target === 'all' || target === 'mongo') {
    results.mongo = await testMongo();
  }
  
  if (target === 'all' || target === 'redis') {
    results.redis = await testRedis();
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('──────────────────────────────');
  
  Object.entries(results).forEach(([db, ok]) => {
    console.log(`   ${db.toUpperCase()}: ${ok ? '✅ OK' : '❌ FALLÓ'}`);
  });
  
  const allOk = Object.values(results).every(r => r);
  
  console.log('──────────────────────────────');
  if (allOk) {
    console.log('✅ TODAS LAS CONEXIONES FUNCIONAN');
  } else {
    console.log('⚠️ ALGUNAS CONEXIONES FALLARON');
    process.exit(1);
  }
  console.log('═══════════════════════════════════════════\n');
  
  // Cerrar Redis limpiamente
  if (results.redis) {
    const redis = getRedis();
    redis.disconnect();
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
