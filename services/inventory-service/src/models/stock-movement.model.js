const { Pool } = require('pg');
const config = require('../config');

const poolConfig = config.db.url
  ? {
      connectionString: config.db.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

if (config.db.ssl) {
  poolConfig.ssl = config.db.ssl;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const StockMovement = {
  async findById(id) {
    const result = await pool.query(
      `SELECT sm.*, p.name as product_name, p.sku
       FROM inventory.stock_movements sm
       JOIN inventory.products p ON sm.product_id = p.id
       WHERE sm.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async listByProduct(productId) {
    const result = await pool.query(
      `SELECT sm.*, p.name as product_name, p.sku
       FROM inventory.stock_movements sm
       JOIN inventory.products p ON sm.product_id = p.id
       WHERE sm.product_id = $1
       ORDER BY sm.created_at DESC`,
      [productId]
    );
    return result.rows;
  },

  async listAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT sm.*, p.name as product_name, p.sku
       FROM inventory.stock_movements sm
       JOIN inventory.products p ON sm.product_id = p.id
       ORDER BY sm.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async create(movementData) {
    const { product_id, location, quantity, movement_type, reference_id, reference_type, notes, created_by } = movementData;
    const result = await pool.query(
      `INSERT INTO inventory.stock_movements 
       (product_id, location, quantity, movement_type, reference_id, reference_type, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [product_id, location, quantity, movement_type, reference_id || null, reference_type || null, notes || null, created_by || null]
    );
    return result.rows[0];
  },

  async getStats(productId) {
    const result = await pool.query(
      `SELECT 
        movement_type,
        SUM(quantity) as total
       FROM inventory.stock_movements
       WHERE product_id = $1
       GROUP BY movement_type`,
      [productId]
    );
    return result.rows;
  },
};

module.exports = {
  pool,
  StockMovement,
};
