#!/usr/bin/env node
/**
 * SCRIPT DE PRUEBA DE CONEXIÓN A BASES DE DATOS
 * 
 * Uso:
 *   node scripts/test-db.js
 * 
 * Este script prueba la conexión a PostgreSQL, MongoDB y Redis
 */

import { connectAll, testConnections, disconnectAll } from '../config/connection-helper.js';

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 TEST DE CONEXIÓN A BASES DE DATOS');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // Probar todas las conexiones
    const results = await testConnections();
    
    const allOk = results.postgres && results.mongo && results.redis;
    
    console.log('\n═══════════════════════════════════════════');
    if (allOk) {
      console.log('✅ TODAS LAS BASES DE DATOS CONECTADAS');
    } else {
      console.log('⚠️ ALGUNAS CONEXIONES FALLARON');
    }
    console.log('═══════════════════════════════════════════\n');
    
    // Cerrar conexiones
    await disconnectAll();
    
    process.exit(allOk ? 0 : 1);
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    process.exit(1);
  }
}

main();
