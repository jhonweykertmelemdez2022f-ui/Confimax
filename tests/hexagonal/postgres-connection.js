/**
 * PostgreSQL Connection Module - Tests Hexagonales
 * 
 * Usa la librería moderna 'postgres' en lugar de 'pg'
 * Configuración centralizada usando DATABASE_URL
 * 
 * Uso:
 *   const { getPostgres, closePostgres } = require('./postgres-connection');
 *   const sql = getPostgres();
 *   await sql`SELECT 1`;
 *   await closePostgres();
 */

const postgres = require('postgres');

// Singleton para la conexión
let sqlInstance = null;

/**
 * Obtiene o crea la instancia de conexión PostgreSQL
 * @returns {import('postgres').Sql} Instancia de postgres
 */
function getPostgres() {
  if (sqlInstance) {
    return sqlInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL no está definido en las variables de entorno');
  }

  // Configuración de conexión
  const options = {
    // Timeout para conexiones cloud (Supabase)
    connection: {
      timeout: 10000,
    },
    // Máximo de conexiones
    max: 10,
    // Idle timeout
    idle_timeout: 20000,
    // SSL para Supabase (automático si la URL incluye sslmode=require)
    ssl: connectionString.includes('sslmode=require') || connectionString.includes('supabase')
      ? { rejectUnauthorized: false }
      : undefined,
  };

  sqlInstance = postgres(connectionString, options);

  console.log('✅ PostgreSQL connection initialized (postgres library)');
  console.log(`   Database: ${connectionString.split('/')[3]?.split('?')[0] || 'unknown'}`);

  return sqlInstance;
}

/**
 * Cierra la conexión PostgreSQL
 */
async function closePostgres() {
  if (sqlInstance) {
    await sqlInstance.end();
    sqlInstance = null;
    console.log('✅ PostgreSQL connection closed');
  }
}

/**
 * Verifica la conexión a PostgreSQL
 */
async function checkPostgresConnection() {
  try {
    const sql = getPostgres();
    const result = await sql`SELECT 1 as connected`;
    return { connected: true, result };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

module.exports = {
  getPostgres,
  closePostgres,
  checkPostgresConnection,
};
