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

// Añadir SSL si está configurado
if (config.db.ssl) {
  poolConfig.ssl = config.db.ssl;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    const isSupabase = (config.db.url || config.db.host || '').includes('supabase.co');
    console.log(`✅ Inventory DB: ${isSupabase ? 'Supabase' : 'PostgreSQL Local'}`);
  }
});

const Product = {
  async findById(id) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );
    return result.rows[0];
  },

  async findBySku(sku) {
    const result = await pool.query(
      'SELECT * FROM inventory.products WHERE sku = $1 AND is_active = true',
      [sku]
    );
    return result.rows[0];
  },

  async searchByName(query, limit = 20) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.name ILIKE $1 AND p.is_active = true 
       ORDER BY p.name 
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  },

  async searchABC(prefix, limit = 20) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.name ILIKE $1 AND p.is_active = true 
       ORDER BY p.name 
       LIMIT $2`,
      [`${prefix}%`, limit]
    );
    return result.rows;
  },

  async create(productData) {
    const {
      name, sku, description, category_id,
      price, cost, is_active, expiration_date
    } = productData;

    const result = await pool.query(
      `INSERT INTO inventory.products 
       (name, sku, description, category_id, price, cost, is_active, expiration_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        name, sku, description, category_id, price, cost, 
        is_active !== undefined ? is_active : true, 
        expiration_date || null
      ]
    );
    return result.rows[0];
  },

  async update(id, productData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(productData)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE inventory.products SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} AND is_active = true 
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query(
      'UPDATE inventory.products SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
  },

  async list(limit = 50, offset = 0, filters = {}) {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM inventory.products p 
      LEFT JOIN inventory.categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    const values = [];
    let paramCount = 1;

    if (filters.category_id) {
      query += ` AND p.category_id = $${paramCount}`;
      values.push(filters.category_id);
      paramCount++;
    }

    query += ` ORDER BY p.name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  async getTotalStock(productId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) as total_stock
       FROM inventory.stock
       WHERE product_id = $1`,
      [productId]
    );
    return result.rows[0]?.total_stock || 0;
  },

  async getExpiring(daysAhead = 30) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.is_active = true 
         AND p.expiration_date IS NOT NULL 
         AND p.expiration_date >= CURRENT_DATE 
         AND p.expiration_date <= CURRENT_DATE + CAST($1 AS INTEGER)
       ORDER BY p.expiration_date ASC`,
      [daysAhead]
    );
    return result.rows;
  },
};

module.exports = {
  pool,
  Product,
};
