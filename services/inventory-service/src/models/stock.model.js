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

const Stock = {
  async findById(id) {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.sku
       FROM inventory.stock s
       JOIN inventory.products p ON s.product_id = p.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByProductAndLocation(productId, location) {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.sku
       FROM inventory.stock s
       JOIN inventory.products p ON s.product_id = p.id
       WHERE s.product_id = $1 AND s.location = $2`,
      [productId, location]
    );
    return result.rows[0];
  },

  async listByProduct(productId) {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.sku
       FROM inventory.stock s
       JOIN inventory.products p ON s.product_id = p.id
       WHERE s.product_id = $1`,
      [productId]
    );
    return result.rows;
  },

  async listByLocation(location) {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.sku
       FROM inventory.stock s
       JOIN inventory.products p ON s.product_id = p.id
       WHERE s.location = $1`,
      [location]
    );
    return result.rows;
  },

  async listAll() {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.sku
       FROM inventory.stock s
       JOIN inventory.products p ON s.product_id = p.id
       ORDER BY s.location, p.name`
    );
    return result.rows;
  },

  async getLowStock() {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.sku
       FROM inventory.stock s
       JOIN inventory.products p ON s.product_id = p.id
       WHERE s.quantity <= s.min_quantity`
    );
    return result.rows;
  },

  async create(stockData) {
    const { product_id, location, quantity, min_quantity, max_quantity } = stockData;
    const result = await pool.query(
      `INSERT INTO inventory.stock (product_id, location, quantity, min_quantity, max_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_id, location, quantity || 0, min_quantity || 10, max_quantity || null]
    );
    return result.rows[0];
  },

  async update(id, stockData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(stockData)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE inventory.stock SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async adjustQuantity(id, quantity) {
    const result = await pool.query(
      `UPDATE inventory.stock
       SET quantity = quantity + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM inventory.stock WHERE id = $1', [id]);
  },
};

module.exports = {
  pool,
  Stock,
};
