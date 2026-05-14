/**
 * ============================================================
 * CLOUD CONNECTIONS MODULE - CONFIMAX
 * ============================================================
 * Módulo centralizado para conectar con servicios cloud:
 * - Supabase (PostgreSQL)
 * - MongoDB Atlas
 * - Upstash (Redis)
 *
 * Uso:
 *   const { connectSupabase, connectAtlas, connectUpstash } = require('../config/cloud-connections');
 *   const pool = connectSupabase();
 *   await connectAtlas();
 *   const redis = await connectUpstash();
 */

const { Pool } = require('pg');
const mongoose = require('mongoose');
const { createClient } = require('redis');

// ==========================================
// CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
// ==========================================

const CONFIG = {
  // SUPABASE - PostgreSQL
  supabase: {
    // DATABASE_URL tiene prioridad (formato Supabase)
    url: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || null,
    host: process.env.SUPABASE_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.SUPABASE_PORT || process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.SUPABASE_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.SUPABASE_PASSWORD || process.env.POSTGRES_PASSWORD || '',
    database: process.env.SUPABASE_DB || process.env.POSTGRES_DB || 'postgres',
    ssl: process.env.SUPABASE_SSL === 'true' || (process.env.SUPABASE_HOST || '').includes('supabase.co')
      ? { rejectUnauthorized: false }
      : false,
  },

  // MONGODB ATLAS
  atlas: {
    uri: process.env.ATLAS_URI || process.env.MONGODB_URI || process.env.MONGO_URL || null,
    host: process.env.ATLAS_HOST || process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.ATLAS_PORT || process.env.MONGO_PORT || '27017', 10),
    user: process.env.ATLAS_USER || process.env.MONGO_USER || '',
    password: process.env.ATLAS_PASSWORD || process.env.MONGO_PASSWORD || '',
    database: process.env.ATLAS_DB || process.env.MONGO_DB || 'confimax_logs',
    authSource: process.env.ATLAS_AUTH_SOURCE || 'admin',
    // Opciones avanzadas Atlas
    retryWrites: process.env.ATLAS_RETRY_WRITES !== 'false',
    w: process.env.ATLAS_W || 'majority',
  },

  // UPSTASH - Redis
  upstash: {
    url: process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || null,
    host: process.env.UPSTASH_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.UPSTASH_REDIS_PORT || process.env.REDIS_PORT || '6379', 10),
    password: process.env.UPSTASH_REDIS_PASSWORD || process.env.REDIS_PASSWORD || '',
    token: process.env.UPSTASH_REDIS_TOKEN || null,
    tls: process.env.UPSTASH_REDIS_TLS === 'true' || (process.env.UPSTASH_REDIS_URL || '').startsWith('rediss://'),
  },
};

// ==========================================
// INSTANCIAS ÚNICAS (SINGLETON)
// ==========================================

let supabasePool = null;
let atlasConnection = null;
let upstashClient = null;

// ==========================================
// SUPABASE - PostgreSQL
// ==========================================

function connectSupabase() {
  if (supabasePool) {
    console.log('[SUPABASE] Reutilizando pool existente');
    return supabasePool;
  }

  const cfg = CONFIG.supabase;

  const poolConfig = cfg.url
    ? {
        connectionString: cfg.url,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
      }
    : {
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
      };

  if (cfg.ssl) {
    poolConfig.ssl = cfg.ssl;
  }

  supabasePool = new Pool(poolConfig);

  supabasePool.on('connect', () => {
    console.log('[SUPABASE] Conectado a PostgreSQL');
  });

  supabasePool.on('error', (err) => {
    console.error('[SUPABASE] Error inesperado en cliente idle:', err.message);
  });

  console.log('[SUPABASE] Pool inicializado');
  return supabasePool;
}

function getSupabasePool() {
  if (!supabasePool) {
    return connectSupabase();
  }
  return supabasePool;
}

async function closeSupabase() {
  if (supabasePool) {
    await supabasePool.end();
    supabasePool = null;
    console.log('[SUPABASE] Pool cerrado');
  }
}

// ==========================================
// MONGODB ATLAS
// ==========================================

async function connectAtlas() {
  if (atlasConnection && mongoose.connection.readyState === 1) {
    console.log('[ATLAS] MongoDB ya conectado');
    return atlasConnection;
  }

  const cfg = CONFIG.atlas;

  let uri;
  if (cfg.uri) {
    uri = cfg.uri;
  } else {
    const credentials = cfg.user && cfg.password
      ? `${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}@`
      : '';
    uri = `mongodb://${credentials}${cfg.host}:${cfg.port}/${cfg.database}?authSource=${cfg.authSource}`;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_CONN_TIMEOUT || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
    };

    // Si es URI de Atlas (mongodb+srv), añadir opciones recomendadas
    if (uri.includes('mongodb+srv')) {
      options.retryWrites = cfg.retryWrites;
      options.w = cfg.w;
    }

    atlasConnection = await mongoose.connect(uri, options);

    console.log('[ATLAS] MongoDB Atlas conectado');
    console.log(`[ATLAS] Base de datos: ${cfg.database}`);

    mongoose.connection.on('error', (err) => {
      console.error('[ATLAS] Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[ATLAS] MongoDB desconectado');
      atlasConnection = null;
    });

    return atlasConnection;
  } catch (error) {
    console.error('[ATLAS] Error conectando a MongoDB Atlas:', error.message);
    throw error;
  }
}

function getAtlasConnection() {
  return atlasConnection;
}

async function closeAtlas() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    atlasConnection = null;
    console.log('[ATLAS] Conexión cerrada');
  }
}

// ==========================================
// UPSTASH - Redis
// ==========================================

async function connectUpstash() {
  if (upstashClient && upstashClient.isOpen) {
    console.log('[UPSTASH] Reutilizando cliente Redis existente');
    return upstashClient;
  }

  const cfg = CONFIG.upstash;

  let redisOptions;

  if (cfg.url) {
    // Upstash URL (rediss:// o redis://)
    redisOptions = { url: cfg.url };
  } else {
    redisOptions = {
      socket: {
        host: cfg.host,
        port: cfg.port,
      },
    };

    if (cfg.password) {
      redisOptions.password = cfg.password;
    }
  }

  // Upstash REST Token (opcional, para usar REST API)
  if (cfg.token) {
    redisOptions.token = cfg.token;
  }

  upstashClient = createClient(redisOptions);

  upstashClient.on('error', (err) => {
    console.error('[UPSTASH] Redis Client Error:', err.message);
  });

  upstashClient.on('connect', () => {
    console.log('[UPSTASH] Conectado a Redis/Upstash');
  });

  upstashClient.on('disconnect', () => {
    console.log('[UPSTASH] Redis desconectado');
    upstashClient = null;
  });

  await upstashClient.connect();
  return upstashClient;
}

function getUpstashClient() {
  if (!upstashClient) {
    throw new Error('[UPSTASH] Cliente no inicializado. Llama a connectUpstash() primero.');
  }
  return upstashClient;
}

async function closeUpstash() {
  if (upstashClient) {
    await upstashClient.disconnect();
    upstashClient = null;
    console.log('[UPSTASH] Cliente cerrado');
  }
}

// ==========================================
// HELPERS DE UPSTASH (Mismo API que redis.service)
// ==========================================

const upstashHelpers = {
  async get(key) {
    const client = getUpstashClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttl = 3600) {
    const client = getUpstashClient();
    await client.setEx(key, ttl, JSON.stringify(value));
  },

  async del(key) {
    const client = getUpstashClient();
    await client.del(key);
  },

  async publish(channel, message) {
    const client = getUpstashClient();
    await client.publish(channel, JSON.stringify(message));
    console.log(`[UPSTASH] Mensaje publicado en ${channel}: ${message.action || 'N/A'}`);
  },

  async subscribe(channel, callback) {
    const client = getUpstashClient();
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        callback(parsed);
      } catch (e) {
        callback(message);
      }
    });
    console.log(`[UPSTASH] Suscrito a canal: ${channel}`);
    return subscriber;
  },

  async incr(key) {
    const client = getUpstashClient();
    return await client.incr(key);
  },

  async expire(key, ttl) {
    const client = getUpstashClient();
    await client.expire(key, ttl);
  },
};

// ==========================================
// CONEXIÓN TOTAL (TODAS LAS BASES CLOUD)
// ==========================================

async function connectAllCloud() {
  console.log('\n🚀 Iniciando conexiones a servicios cloud...\n');

  const results = {
    supabase: false,
    atlas: false,
    upstash: false,
  };

  try {
    connectSupabase();
    await supabasePool.query('SELECT 1');
    console.log('✅ [SUPABASE] PostgreSQL conectado y verificado');
    results.supabase = true;
  } catch (err) {
    console.error('❌ [SUPABASE] Error:', err.message);
  }

  try {
    await connectAtlas();
    results.atlas = true;
  } catch (err) {
    console.error('❌ [ATLAS] Error:', err.message);
  }

  try {
    await connectUpstash();
    await upstashClient.ping();
    console.log('✅ [UPSTASH] Redis conectado y verificado (PONG)');
    results.upstash = true;
  } catch (err) {
    console.error('❌ [UPSTASH] Error:', err.message);
  }

  console.log('\n📊 Resultados Cloud Connections:');
  console.log('   Supabase (PostgreSQL):', results.supabase ? '✅' : '❌');
  console.log('   Atlas (MongoDB):', results.atlas ? '✅' : '❌');
  console.log('   Upstash (Redis):', results.upstash ? '✅' : '❌');

  return results;
}

// ==========================================
// CIERRE LIMPIO
// ==========================================

async function disconnectAllCloud() {
  console.log('\n🔌 Cerrando conexiones cloud...\n');

  await closeSupabase();
  await closeAtlas();
  await closeUpstash();

  console.log('👋 Todas las conexiones cloud cerradas\n');
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Conexiones
  connectSupabase,
  connectAtlas,
  connectUpstash,
  connectAllCloud,

  // Getters
  getSupabasePool,
  getAtlasConnection,
  getUpstashClient,

  // Cierre
  closeSupabase,
  closeAtlas,
  closeUpstash,
  disconnectAllCloud,

  // Helpers Upstash
  upstash: upstashHelpers,

  // Config (para inspección/debug)
  CONFIG,
};
