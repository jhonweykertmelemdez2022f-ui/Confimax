const { Pool } = require('pg');
const config = require('../config');

let pool;

const initPool = () => {
  if (pool) {
    return pool;
  }

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
  return dbPool.query(text, params);
};

const getDataByRole = async (role) => {
  const dbPool = getDbPool();
  const data = {};

  try {
    // Siempre obtener productos (todos los roles pueden ver productos)
    const productsResult = await dbPool.query('SELECT id, name, sku, price, stock_quantity FROM products ORDER BY name LIMIT 20');
    data.products = productsResult.rows;

    if (role === 'admin' || role === 'vendedor') {
      // Obtener clientes (solo admin y vendedor)
      const customersResult = await dbPool.query('SELECT id, name, email, phone FROM customers ORDER BY name LIMIT 20');
      data.customers = customersResult.rows;

      // Obtener ventas (solo admin y vendedor)
      const salesResult = await dbPool.query('SELECT s.id, s.total, s.created_at, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id ORDER BY s.created_at DESC LIMIT 20');
      data.sales = salesResult.rows;
    }

    if (role === 'admin') {
      // Obtener usuarios (solo admin)
      const usersResult = await dbPool.query('SELECT id, username, email, role FROM users ORDER BY username LIMIT 20');
      data.users = usersResult.rows;

      // Obtener auditorías (solo admin)
      const auditResult = await dbPool.query('SELECT a.id, a.operation, a.entity, a.entity_id, a.created_at, u.username as user FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 20');
      data.audits = auditResult.rows;
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