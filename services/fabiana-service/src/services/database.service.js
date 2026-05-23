const { Pool } = require('pg');
const config = require('../config');

let pool;

const initPool = () => {
  if (pool) {
    return pool;
  }

  console.log('[FABIANA DB] Inicializando conexión a PostgreSQL...');
  console.log('[FABIANA DB] Configuración:', {
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    hasUrl: !!config.db.url
  });

  if (config.db.url) {
    pool = new Pool({
      connectionString: config.db.url,
      ssl: config.db.ssl
    });
  } else {
    pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: config.db.ssl
    });
  }

  pool.on('error', (err) => {
    console.error('[FABIANA DB] Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool;
};

const getDbPool = () => {
  if (!pool) {
    initPool();
  }
  return pool;
};

const query = async (text, params) => {
  const dbPool = getDbPool();
  console.log('[FABIANA DB] Ejecutando consulta:', text);
  const result = await dbPool.query(text, params);
  console.log('[FABIANA DB] Resultado:', result.rows.length, 'filas');
  return result;
};

const getDataByRole = async (role) => {
  console.log('[FABIANA DB] Obteniendo datos para rol:', role);
  const dbPool = getDbPool();
  const data = {};

  try {
    // Siempre obtener productos (todos los roles pueden ver productos)
    console.log('[FABIANA DB] Consultando productos...');
    const productsResult = await dbPool.query('SELECT id, name, sku, unit_price as price, stock_quantity FROM products ORDER BY name LIMIT 20');
    data.products = productsResult.rows;
    console.log('[FABIANA DB] Productos encontrados:', data.products.length);

    if (role === 'admin' || role === 'vendedor') {
      // Obtener clientes (solo admin y vendedor)
      console.log('[FABIANA DB] Consultando clientes...');
      const customersResult = await dbPool.query('SELECT id, name, email, phone FROM customers ORDER BY name LIMIT 20');
      data.customers = customersResult.rows;
      console.log('[FABIANA DB] Clientes encontrados:', data.customers.length);

      // Obtener ventas (solo admin y vendedor)
      console.log('[FABIANA DB] Consultando ventas...');
      const salesResult = await dbPool.query('SELECT s.id, s.total, s.created_at, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id ORDER BY s.created_at DESC LIMIT 20');
      data.sales = salesResult.rows;
      console.log('[FABIANA DB] Ventas encontradas:', data.sales.length);
    }

    if (role === 'admin') {
      // Obtener usuarios (solo admin)
      console.log('[FABIANA DB] Consultando usuarios...');
      const usersResult = await dbPool.query('SELECT id, username, email, role FROM users ORDER BY username LIMIT 20');
      data.users = usersResult.rows;
      console.log('[FABIANA DB] Usuarios encontrados:', data.users.length);
    }

    return data;
  } catch (error) {
    console.error('[FABIANA DB] Error getting data by role:', error);
    throw error;
  }
};

module.exports = {
  initPool,
  getDbPool,
  query,
  getDataByRole
};