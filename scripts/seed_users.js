/**
 * Seeder de usuarios para Confimax (Supabase / Postgres Local)
 * 
 * Permite insertar usuarios rápidamente a la base de datos sin
 * tener que hacerlo a mano en la interfaz de la aplicación móvil.
 * 
 * Este script utiliza el esquema 'public' para evitar problemas de permisos
 * en esquemas reservados del sistema en Supabase.
 * 
 * Uso:
 *   node scripts/seed_users.js                  (Crea a 'jackson' y usuarios base)
 *   node scripts/seed_users.js nombre password   (Crea un usuario personalizado)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

let databaseUrl = null;

// Cargar .env manualmente
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let val = parts.slice(1).join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (key === 'DATABASE_URL') {
            databaseUrl = val;
          }
          process.env[key] = val;
        }
      }
    });
    console.log('✅ Configuración cargada desde el .env de la raíz');
  }
} catch (err) {
  console.log('⚠️  Error al leer el archivo .env:', err.message);
}

// Credenciales por defecto extraídas de la URL dura de conexión en setup.md
const defaultUrl = 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres';
const finalUrl = databaseUrl || defaultUrl;

// Extraer credenciales robustamente usando la clase URL
let user = 'postgres';
let password = 'Jackwell2019*2424';
let dbName = 'postgres';
let rawHost = 'db.tlrliqbgtdplwdvbxqxv.supabase.co';
let port = 5432;

try {
  const connectionUri = finalUrl.replace('postgresql://', 'http://').replace('postgres://', 'http://');
  const parsed = new URL(connectionUri);
  user = parsed.username;
  password = parsed.password;
  dbName = parsed.pathname.substring(1).split('?')[0];
  rawHost = parsed.hostname;
  port = parsed.port || 5432;
} catch (e) {
  console.log('⚠️  Error parseando DATABASE_URL, usando fallback');
}

if (user === 'postgres' && rawHost.includes('tlrliqbgtdplwdvbxqxv')) {
  user = 'postgres.tlrliqbgtdplwdvbxqxv';
}

const POOLER_HOST_NAME = 'aws-1-us-west-2.pooler.supabase.com';
const POOLER_IP_FALLBACK = '44.225.139.66';

async function runWithHost(hostToUse, snName) {
  console.log(`🔗 Conectando a Supabase via [${hostToUse}:${port}] (Usuario: ${user}, SNI: ${snName})...`);
  
  const client = new Client({
    host: hostToUse,
    port: port,
    user: user,
    password: password,
    database: dbName,
    ssl: {
      rejectUnauthorized: false,
      servername: snName
    }
  });

  const DEFAULT_PASSWORD_HASH = 'Jackwell2019*2424';
  const usersToSeed = [
    {
      username: 'jackson',
      email: 'jackson@confimax.com',
      password: DEFAULT_PASSWORD_HASH,
      role: 'admin'
    },
    {
      username: 'vendor1',
      email: 'vendor1@confimax.com',
      password: DEFAULT_PASSWORD_HASH,
      role: 'vendor'
    },
    {
      username: 'vendedor',
      email: 'vendedor@confimax.com',
      password: DEFAULT_PASSWORD_HASH,
      role: 'vendor'
    },
    {
      username: 'cliente',
      email: 'cliente@confimax.com',
      password: DEFAULT_PASSWORD_HASH,
      role: 'customer'
    }
  ];

  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const customUser = args[0].toLowerCase();
    const customPass = args[1];
    const customRole = args[2] || 'customer';
    usersToSeed.unshift({
      username: customUser,
      email: `${customUser}@confimax.com`,
      password: customPass,
      role: customRole
    });
    console.log(`👤 Añadido usuario personalizado para crear: ${customUser} con rol: ${customRole}`);
  }

  try {
    await client.connect();
    console.log('✅ Conexión establecida.');

    // Crear la tabla users en el esquema 'public' si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'vendor',
        active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('📋 Tabla "public.users" asegurada.');

    console.log('\n🌾 Sembrando usuarios en public.users...');
    for (const u of usersToSeed) {
      try {
        const query = {
          text: `
            INSERT INTO public.users (username, email, password, role, active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (username) 
            DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role
            RETURNING id, username, email, role;
          `,
          values: [u.username, u.email, u.password, u.role]
        };

        const res = await client.query(query);
        const seededUser = res.rows[0];
        console.log(`   ✨ Usuario [${seededUser.username}] (${seededUser.role}) - ID: ${seededUser.id}`);
      } catch (err) {
        console.error(`   ❌ Error creando a ${u.username}:`, err.message);
      }
    }

    console.log('\n🎉 ¡Sembrado de usuarios completado exitosamente!');
    await client.end();
    return true;
  } catch (error) {
    console.error(`❌ Falló la conexión con el host ${hostToUse}:`, error.message);
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function start() {
  let success = await runWithHost(POOLER_HOST_NAME, POOLER_HOST_NAME);
  if (!success) {
    console.log('\n⚠️  Fallo DNS. Intentando conexión forzada con IP de AWS y SNI...');
    await runWithHost(POOLER_IP_FALLBACK, POOLER_HOST_NAME);
  }
}

start();
