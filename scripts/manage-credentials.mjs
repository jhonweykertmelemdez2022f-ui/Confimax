#!/usr/bin/env node
/**
 * GESTIÓN SEGURA DE CREDENCIALES
 * 
 * Este script permite modificar contraseñas de forma segura:
 * - Lee contraseñas actuales del .env
 * - Valida conexión antes de cambiar
 * - Actualiza TODOS los archivos automáticamente
 * - Crea backup de configuración anterior
 * 
 * Uso:
 *   node scripts/manage-credentials.mjs status      # Ver estado actual
 *   node scripts/manage-credentials.mjs postgres   # Cambiar solo PostgreSQL
 *   node scripts/manage-credentials.mjs mongo        # Cambiar solo MongoDB
 *   node scripts/manage-credentials.mjs redis        # Cambiar solo Redis
 *   node scripts/manage-credentials.mjs all          # Cambiar todas
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Colores para output
const c = {
  ok: '✅',
  err: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// ==========================================
// LECTOR INTERACTIVO
// ==========================================
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askSecure(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Ocultar input
  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (stringToWrite.includes('\n')) {
      rl.output.write(stringToWrite);
    } else {
      rl.output.write('*');
    }
  };
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.output.write('\n');
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ==========================================
// LEER .ENV ACTUAL
// ==========================================
async function readEnvFile() {
  const envPath = path.join(ROOT_DIR, '.env');
  
  try {
    const content = await fs.readFile(envPath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        env[match[1]] = match[2];
      }
    }
    
    return env;
  } catch (err) {
    throw new Error(`No se pudo leer .env: ${err.message}`);
  }
}

// ==========================================
// VERIFICAR CONEXIONES
// ==========================================
async function testConnection(type, env) {
  console.log(`\n${c.info} Probando ${type}...`);
  
  try {
    switch (type) {
      case 'postgres': {
        const prisma = new PrismaClient();
        await prisma.$connect();
        await prisma.$disconnect();
        return true;
      }
        
      case 'mongo': {
        const mongoUri = `mongodb://${env.MONGO_INITDB_ROOT_USERNAME || 'confimax'}:${env.MONGO_PASSWORD}@localhost:27018/confimax_logs?authSource=admin`;
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        await mongoose.connection.close();
        return true;
      }
        
      case 'redis': {
        const redis = new Redis({
          host: 'localhost',
          port: 6379,
          password: env.REDIS_PASSWORD,
          retryStrategy: null
        });
        await redis.ping();
        redis.disconnect();
        return true;
      }
        
      default:
        return false;
    }
  } catch (err) {
    console.log(`${c.err} ${type}: ${err.message}`);
    return false;
  }
}

// ==========================================
// CREAR BACKUP
// ==========================================
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT_DIR, 'backups', `env-${timestamp}`);
  
  await fs.mkdir(backupDir, { recursive: true });
  
  // Backup de .env
  await fs.copyFile(
    path.join(ROOT_DIR, '.env'),
    path.join(backupDir, '.env.backup')
  );
  
  // Backup de archivos de servicio
  const filesToBackup = [
    'web/src/services/cache.service.mjs',
    'web/scripts/db-test.mjs',
    'web/scripts/demo-logs-cache.mjs'
  ];
  
  for (const file of filesToBackup) {
    try {
      const src = path.join(ROOT_DIR, file);
      const dest = path.join(backupDir, file.replace(/\//g, '_'));
      await fs.copyFile(src, dest);
    } catch (err) {
      // Archivo puede no existir
    }
  }
  
  console.log(`${c.ok} Backup creado: ${backupDir}`);
  return backupDir;
}

// ==========================================
// ACTUALIZAR ARCHIVOS
// ==========================================
async function updateEnvFile(updates) {
  const envPath = path.join(ROOT_DIR, '.env');
  let content = await fs.readFile(envPath, 'utf8');
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  
  await fs.writeFile(envPath, content);
}

async function updateServiceFiles(env) {
  const updates = [];
  
  // 1. Actualizar cache.service.mjs
  const cachePath = path.join(ROOT_DIR, 'web/src/services/cache.service.mjs');
  try {
    let cacheContent = await fs.readFile(cachePath, 'utf8');
    cacheContent = cacheContent.replace(
      /password: '[^']*'/,
      `password: '${env.REDIS_PASSWORD}'`
    );
    await fs.writeFile(cachePath, cacheContent);
    updates.push('web/src/services/cache.service.mjs');
  } catch (err) {
    console.log(`${c.warn} No se pudo actualizar cache.service.mjs`);
  }
  
  // 2. Actualizar scripts de MongoDB
  const mongoUser = env.MONGO_INITDB_ROOT_USERNAME || 'confimax';
  const mongoPass = env.MONGO_PASSWORD;
  const mongoUri = `mongodb://${mongoUser}:${mongoPass}@localhost:27018/confimax_logs?authSource=admin`;
  
  const mongoScripts = [
    'web/scripts/db-test.mjs',
    'web/scripts/demo-logs-cache.mjs',
    'web/src/services/logger.service.mjs'
  ];
  
  for (const scriptPath of mongoScripts) {
    try {
      const fullPath = path.join(ROOT_DIR, scriptPath);
      let content = await fs.readFile(fullPath, 'utf8');
      
      // Reemplazar URI de MongoDB
      content = content.replace(
        /mongodb:\/\/[^:]+:[^@]+@localhost:27018/,
        `mongodb://${mongoUser}:${mongoPass}@localhost:27018`
      );
      
      await fs.writeFile(fullPath, content);
      updates.push(scriptPath);
    } catch (err) {
      // Script puede no existir
    }
  }
  
  return updates;
}

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
async function changePassword(type, env) {
  console.log(`\n${c.cyan}═══════════════════════════════════════════`);
  console.log(`  Cambiando contraseña de ${type.toUpperCase()}`);
  console.log(`═══════════════════════════════════════════${c.reset}\n`);
  
  // Obtener contraseña actual
  let currentKey, currentValue;
  switch (type) {
    case 'postgres':
      currentKey = 'POSTGRES_PASSWORD';
      currentValue = env.POSTGRES_PASSWORD;
      break;
    case 'mongo':
      currentKey = 'MONGO_PASSWORD';
      currentValue = env.MONGO_PASSWORD;
      break;
    case 'redis':
      currentKey = 'REDIS_PASSWORD';
      currentValue = env.REDIS_PASSWORD;
      break;
    default:
      throw new Error(`Tipo desconocido: ${type}`);
  }
  
  console.log(`Contraseña actual: ${c.yellow}${currentValue}${c.reset}`);
  
  // Pedir nueva contraseña
  const newPassword = await askSecure(`Nueva contraseña (dejar vacío para cancelar): `);
  
  if (!newPassword) {
    console.log(`\n${c.warn} Cancelado`);
    return false;
  }
  
  if (newPassword.length < 8) {
    console.log(`\n${c.err} La contraseña debe tener al menos 8 caracteres`);
    return false;
  }
  
  // Confirmar
  const confirm = await askQuestion(`\n¿Confirmar cambio? (escribe "SI" para confirmar): `);
  if (confirm !== 'SI') {
    console.log(`${c.warn} Cancelado`);
    return false;
  }
  
  // Crear backup
  const backupDir = await createBackup();
  
  // Actualizar .env
  await updateEnvFile({ [currentKey]: newPassword });
  console.log(`${c.ok} .env actualizado`);
  
  // Actualizar archivos de servicio
  env[currentKey] = newPassword;
  const updatedFiles = await updateServiceFiles(env);
  console.log(`${c.ok} Archivos actualizados: ${updatedFiles.length}`);
  
  // Verificar conexión
  console.log(`\n${c.info} Verificando conexión con nueva contraseña...`);
  const connected = await testConnection(type, env);
  
  if (connected) {
    console.log(`\n${c.ok} ${type.toUpperCase()} actualizado correctamente`);
    console.log(`${c.info} Backup guardado en: ${backupDir}`);
    return true;
  } else {
    console.log(`\n${c.err} ERROR: No se pudo conectar con la nueva contraseña`);
    console.log(`${c.warn} Debes reiniciar los contenedores de Docker:`);
    console.log(`  docker compose down`);
    console.log(`  docker compose up -d`);
    return false;
  }
}

// ==========================================
// MODO STATUS
// ==========================================
async function showStatus() {
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 ESTADO DE CONEXIONES');
  console.log('═══════════════════════════════════════════\n');
  
  const env = await readEnvFile();
  
  console.log(`${c.cyan}Configuración actual:${c.reset}`);
  console.log(`  PostgreSQL: ${env.POSTGRES_USER} / ${'*'.repeat(env.POSTGRES_PASSWORD?.length || 0)}`);
  console.log(`  MongoDB:    ${env.MONGO_INITDB_ROOT_USERNAME || 'confimax'} / ${'*'.repeat(env.MONGO_PASSWORD?.length || 0)}`);
  console.log(`  Redis:      (no user) / ${'*'.repeat(env.REDIS_PASSWORD?.length || 0)}`);
  console.log(`  pgAdmin:    ${env.PGADMIN_EMAIL} / ${'*'.repeat(env.PGADMIN_PASSWORD?.length || 0)}`);
  
  console.log(`\n${c.cyan}Probando conexiones...${c.reset}\n`);
  
  const pg = await testConnection('postgres', env);
  const mongo = await testConnection('mongo', env);
  const redis = await testConnection('redis', env);
  
  console.log('\n──────────────────────────────');
  console.log(`PostgreSQL: ${pg ? c.ok : c.err}`);
  console.log(`MongoDB:    ${mongo ? c.ok : c.err}`);
  console.log(`Redis:      ${redis ? c.ok : c.err}`);
  console.log('──────────────────────────────');
  
  if (pg && mongo && redis) {
    console.log(`\n${c.ok} Todas las conexiones funcionan`);
  } else {
    console.log(`\n${c.err} Algunas conexiones fallan`);
    console.log(`${c.info} Verifica que los contenedores estén corriendo:`);
    console.log(`  docker compose ps`);
  }
  
  console.log();
}

// ==========================================
// AYUDA
// ==========================================
function showHelp() {
  console.log(`
${c.cyan}Gestión Segura de Credenciales - Confimax${c.reset}

Uso: node scripts/manage-credentials.mjs [comando]

Comandos:
  status      Muestra estado de conexiones actuales
  postgres    Cambiar contraseña de PostgreSQL
  mongo       Cambiar contraseña de MongoDB
  redis       Cambiar contraseña de Redis
  all         Cambiar todas las contraseñas
  help        Muestra esta ayuda

Ejemplos:
  node scripts/manage-credentials.mjs status
  node scripts/manage-credentials.mjs postgres

${c.yellow}⚠️  IMPORTANTE:${c.reset}
  - Este script solo modifica archivos de configuración
  - Para aplicar cambios en contenedores Docker, debes:
    1. Detener: docker compose down
    2. Eliminar volúmenes: docker volume rm farm_postgres-data farm_mongo-data farm_redis-data
    3. Recrear: docker compose up -d
  ${c.red}⚠️  Eliminar volúmenes borra todos los datos${c.reset}
`);
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  const command = process.argv[2] || 'status';
  
  switch (command) {
    case 'status':
      await showStatus();
      break;
      
    case 'postgres':
    case 'mongo':
    case 'redis': {
      const env = await readEnvFile();
      await changePassword(command, env);
      break;
    }
      
    case 'all': {
      const env = await readEnvFile();
      console.log(`\n${c.cyan}═══════════════════════════════════════════`);
      console.log(`  CAMBIO DE TODAS LAS CONTRASEÑAS`);
      console.log(`═══════════════════════════════════════════${c.reset}`);
      
      await changePassword('postgres', env);
      await changePassword('mongo', env);
      await changePassword('redis', env);
      
      console.log(`\n${c.cyan}═══════════════════════════════════════════`);
      console.log(`${c.ok} Todas las contraseñas actualizadas`);
      console.log(`${c.warn} Recuerda reiniciar los contenedores Docker`);
      console.log(`═══════════════════════════════════════════${c.reset}\n`);
      break;
    }
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log(`${c.err} Comando desconocido: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n${c.err} Error:`, err.message);
  process.exit(1);
});
