/**
 * Módulo compartido de conexión a base de datos
 * Soporta PostgreSQL local y Supabase
 * 
 * Uso:
 *   const { pool, query } = require('../shared/database');
 *   const result = await query('SELECT * FROM products');
 */

const { Pool } = require('pg');

// Detectar si estamos usando Supabase
const isSupabase = () => {
  const host = process.env.POSTGRES_HOST || '';
  return host.includes('supabase.co') || process.env.USE_SUPABASE === 'true';
};

// Construir configuración del pool
const getPoolConfig = () => {
  const POOLER_IP_FALLBACK = '44.225.139.66';
  const DEFAULT_POOLER_HOST = 'aws-1-us-west-2.pooler.supabase.com';

  // Si existe DATABASE_URL, usarla directamente (formato de Supabase)
  if (process.env.DATABASE_URL) {
    let finalUrl = process.env.DATABASE_URL;
    let customHost = null;

    // Detectar si la URL apunta a cualquier dominio de Supabase
    if (finalUrl.includes('supabase.co') || finalUrl.includes('supabase.com')) {
      // Extraer el host real original de la URL
      try {
        const tempUri = finalUrl.replace('postgresql://', 'http://').replace('postgres://', 'http://');
        const parsed = new URL(tempUri);
        customHost = parsed.hostname;
        
        // Reemplazar el host original por la IP física de AWS/Supabase
        finalUrl = finalUrl.replace(customHost, POOLER_IP_FALLBACK);
        
        // Si el host extraído termina en .co, normalizar a .com para asegurar un SNI de TLS válido
        if (customHost.endsWith('.co')) {
          customHost = customHost.replace('.co', '.com');
        }
      } catch (e) {
        customHost = DEFAULT_POOLER_HOST;
        finalUrl = finalUrl.replace('aws-1-us-west-2.pooler.supabase.com', POOLER_IP_FALLBACK);
        finalUrl = finalUrl.replace('aws-1-us-west-2.pooler.supabase.co', POOLER_IP_FALLBACK);
      }
    }

    const config = {
      connectionString: finalUrl,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
    };

    if (isSupabase() || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('supabase.com')) {
      config.ssl = {
        rejectUnauthorized: false,
        servername: customHost || DEFAULT_POOLER_HOST
      };
    }

    return config;
  }

  // Configuración manual (local o externo)
  let rawHost = process.env.POSTGRES_HOST || 'localhost';
  let useSniHost = null;

  if (rawHost.includes('supabase.co') || rawHost.includes('supabase.com')) {
    useSniHost = rawHost;
    if (useSniHost.endsWith('.co')) {
      useSniHost = useSniHost.replace('.co', '.com');
    }
    rawHost = POOLER_IP_FALLBACK;
  }

  const config = {
    host: rawHost,
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'confimax',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'confimax',
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  };

  if (isSupabase() || process.env.POSTGRES_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: false,
      servername: useSniHost || DEFAULT_POOLER_HOST
    };
  }

  return config;
};

// Crear pool
const pool = new Pool(getPoolConfig());

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Error inesperado en cliente idle del pool:', err.message);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Conectado a PostgreSQL: ${isSupabase() ? 'Supabase' : 'Local'}`);
  }
});

/**
 * Ejecutar una query con manejo de errores
 * @param {string} text - Query SQL
 * @param {array} params - Parámetros
 * @returns {Promise} - Resultado de la query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query ejecutada (${duration}ms): ${text.substring(0, 50)}...`);
    }
    return result;
  } catch (err) {
    console.error('Error en query:', err.message);
    console.error('Query:', text);
    throw err;
  }
};

/**
 * Ejecutar una transacción
 * @param {function} callback - Función async que recibe client
 * @returns {Promise} - Resultado de la transacción
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Obtener estado del pool
 */
const getPoolStatus = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    isSupabase: isSupabase(),
  };
};

module.exports = {
  pool,
  query,
  transaction,
  getPoolStatus,
  isSupabase,
};
