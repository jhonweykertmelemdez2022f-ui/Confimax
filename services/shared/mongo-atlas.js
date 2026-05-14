/**
 * ============================================================
 * MONGODB ATLAS - Módulo Compartido
 * ============================================================
 * Conexión centralizada a MongoDB Atlas para todos los servicios.
 *
 * Uso:
 *   const { connectAtlas, getAtlasConnection, getMongoose } = require('../shared/mongo-atlas');
 *   await connectAtlas();
 *   const conn = getAtlasConnection();
 */

const mongoose = require('mongoose');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const getConfig = () => ({
  uri: process.env.ATLAS_URI || process.env.MONGODB_URI || process.env.MONGO_URL || null,
  host: process.env.ATLAS_HOST || process.env.MONGO_HOST || 'localhost',
  port: parseInt(process.env.ATLAS_PORT || process.env.MONGO_PORT || '27017', 10),
  user: process.env.ATLAS_USER || process.env.MONGO_USER || '',
  password: process.env.ATLAS_PASSWORD || process.env.MONGO_PASSWORD || '',
  database: process.env.ATLAS_DB || process.env.MONGO_DB || 'confimax_logs',
  authSource: process.env.ATLAS_AUTH_SOURCE || 'admin',
  retryWrites: process.env.ATLAS_RETRY_WRITES !== 'false',
  w: process.env.ATLAS_W || 'majority',
});

// ==========================================
// SINGLETON
// ==========================================

let atlasConnection = null;
let isConnecting = false;

// ==========================================
// CONEXIÓN
// ==========================================

async function connectAtlas() {
  if (atlasConnection && mongoose.connection.readyState === 1) {
    console.log('[MONGO-ATLAS] Ya conectado');
    return atlasConnection;
  }

  if (isConnecting) {
    console.log('[MONGO-ATLAS] Conexión en progreso, esperando...');
    while (isConnecting) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return atlasConnection;
  }

  isConnecting = true;

  try {
    const cfg = getConfig();
    let uri = cfg.uri;

    if (!uri) {
      const credentials = cfg.user && cfg.password
        ? `${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}@`
        : '';
      uri = `mongodb://${credentials}${cfg.host}:${cfg.port}/${cfg.database}?authSource=${cfg.authSource}`;
    }

    const options = {
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_CONN_TIMEOUT || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
    };

    if (uri.includes('mongodb+srv')) {
      options.retryWrites = cfg.retryWrites;
      options.w = cfg.w;
    }

    atlasConnection = await mongoose.connect(uri, options);

    console.log(`[MONGO-ATLAS] Conectado a ${cfg.database}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MONGO-ATLAS] Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[MONGO-ATLAS] Desconectado');
      atlasConnection = null;
    });

    return atlasConnection;
  } catch (error) {
    console.error('[MONGO-ATLAS] Error:', error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
}

function getAtlasConnection() {
  return atlasConnection;
}

function getMongoose() {
  return mongoose;
}

async function closeAtlas() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    atlasConnection = null;
    console.log('[MONGO-ATLAS] Conexión cerrada');
  }
}

// ==========================================
// HEALTH CHECK
// ==========================================

async function checkAtlasHealth() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { status: 'disconnected', connected: false };
    }
    await mongoose.connection.db.admin().ping();
    return { status: 'connected', connected: true };
  } catch (err) {
    return { status: 'error', connected: false, error: err.message };
  }
}

module.exports = {
  connectAtlas,
  getAtlasConnection,
  getMongoose,
  closeAtlas,
  checkAtlasHealth,
};
