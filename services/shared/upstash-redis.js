/**
 * ============================================================
 * UPSTASH REDIS - Módulo Compartido
 * ============================================================
 * Conexión centralizada a Upstash Redis para todos los servicios.
 * Soporta URL de Upstash (rediss://) y configuración manual.
 *
 * Uso:
 *   const { connectUpstash, getUpstashClient, upstash } = require('../shared/upstash-redis');
 *   await connectUpstash();
 *   await upstash.set('key', { value: 123 }, 3600);
 */

const { createClient } = require('redis');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const getConfig = () => ({
  url: process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || null,
  host: process.env.UPSTASH_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.UPSTASH_REDIS_PORT || process.env.REDIS_PORT || '6379', 10),
  password: process.env.UPSTASH_REDIS_PASSWORD || process.env.REDIS_PASSWORD || '',
  token: process.env.UPSTASH_REDIS_TOKEN || null,
  tls: process.env.UPSTASH_REDIS_TLS === 'true' || (process.env.UPSTASH_REDIS_URL || '').startsWith('rediss://'),
});

// ==========================================
// SINGLETON
// ==========================================

let upstashClient = null;
let isConnecting = false;

// ==========================================
// CONEXIÓN
// ==========================================

async function connectUpstash() {
  if (upstashClient && upstashClient.isOpen) {
    console.log('[UPSTASH-REDIS] Reutilizando cliente');
    return upstashClient;
  }

  if (isConnecting) {
    console.log('[UPSTASH-REDIS] Conexión en progreso, esperando...');
    while (isConnecting) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return upstashClient;
  }

  isConnecting = true;

  try {
    const cfg = getConfig();
    let redisOptions;

    const socketOptions = {
      connectTimeout: 4000,
      reconnectStrategy: false,
    };

    if (cfg.url) {
      redisOptions = {
        url: cfg.url,
        socket: socketOptions,
      };
    } else {
      redisOptions = {
        socket: {
          host: cfg.host,
          port: cfg.port,
          ...socketOptions,
        },
      };
      if (cfg.password) {
        redisOptions.password = cfg.password;
      }
    }

    if (cfg.token) {
      redisOptions.token = cfg.token;
    }

    upstashClient = createClient(redisOptions);

    upstashClient.on('error', (err) => {
      console.error('[UPSTASH-REDIS] Error:', err.message);
    });

    upstashClient.on('connect', () => {
      console.log('[UPSTASH-REDIS] Conectado');
    });

    upstashClient.on('disconnect', () => {
      console.log('[UPSTASH-REDIS] Desconectado');
      upstashClient = null;
    });

    await upstashClient.connect();
    return upstashClient;
  } catch (error) {
    console.error('[UPSTASH-REDIS] Error:', error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
}

function getUpstashClient() {
  if (!upstashClient) {
    throw new Error('[UPSTASH-REDIS] Cliente no inicializado. Ejecuta connectUpstash() primero.');
  }
  return upstashClient;
}

async function closeUpstash() {
  if (upstashClient) {
    await upstashClient.disconnect();
    upstashClient = null;
    console.log('[UPSTASH-REDIS] Cliente cerrado');
  }
}

// ==========================================
// HELPERS (API de alto nivel)
// ==========================================

const upstash = {
  async get(key) {
    const client = getUpstashClient();
    const data = await client.get(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return data;
    }
  },

  async set(key, value, ttl = 3600) {
    const client = getUpstashClient();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await client.setEx(key, ttl, serialized);
  },

  async del(key) {
    const client = getUpstashClient();
    await client.del(key);
  },

  async exists(key) {
    const client = getUpstashClient();
    return await client.exists(key);
  },

  async publish(channel, message) {
    const client = getUpstashClient();
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    await client.publish(channel, payload);
    console.log(`[UPSTASH-REDIS] Publicado en ${channel}`);
  },

  async subscribe(channel, callback) {
    const client = getUpstashClient();
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        callback(parsed);
      } catch {
        callback(message);
      }
    });
    console.log(`[UPSTASH-REDIS] Suscrito a ${channel}`);
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

  async ping() {
    const client = getUpstashClient();
    return await client.ping();
  },
};

// ==========================================
// HEALTH CHECK
// ==========================================

async function checkUpstashHealth() {
  try {
    const client = getUpstashClient();
    const pong = await client.ping();
    return { status: 'connected', connected: true, pong };
  } catch (err) {
    return { status: 'error', connected: false, error: err.message };
  }
}

module.exports = {
  connectUpstash,
  getUpstashClient,
  closeUpstash,
  upstash,
  checkUpstashHealth,
};
