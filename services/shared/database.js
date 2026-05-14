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
  // Si existe DATABASE_URL, usarla directamente (formato de Supabase)
  if (process.env.DATABASE_URL) {
    const config = {
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
    };

    // Supabase requiere SSL
    if (isSupabase() || process.env.DATABASE_URL.includes('supabase.co')) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }

    return config;
  }

  // Configuración manual (local o externo)
  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'confimax',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'confimax',
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  };

  // Añadir SSL para conexiones externas (incluyendo Supabase)
  if (isSupabase() || process.env.POSTGRES_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: false,
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
