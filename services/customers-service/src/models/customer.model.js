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

const Customer = {
  async findById(id) {
    const result = await pool.query(
      `SELECT c.*, 
        COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]') as addresses
       FROM customers.customers c
       LEFT JOIN customers.addresses a ON a.customer_id = c.id
       WHERE c.id = $1 AND c.is_active = true
       GROUP BY c.id`,
      [id]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM customers.customers WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0];
  },

  async findByTaxId(tax_id) {
    const result = await pool.query(
      'SELECT * FROM customers.customers WHERE tax_id = $1 AND is_active = true',
      [tax_id]
    );
    return result.rows[0];
  },

  async search(query, limit = 20) {
    const result = await pool.query(
      `SELECT * FROM customers.customers 
       WHERE (name ILIKE $1 OR tax_id ILIKE $1 OR email ILIKE $1) AND is_active = true 
       ORDER BY name 
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  },

  async create(customerData) {
    const { name, email, phone, tax_id, notes } = customerData;
    const result = await pool.query(
      `INSERT INTO customers.customers (name, email, phone, tax_id, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, phone, tax_id || null, notes || null]
    );
    return result.rows[0];
  },

  async update(id, customerData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(customerData)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE customers.customers SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} AND is_active = true 
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query(
      'UPDATE customers.customers SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
  },

  async list(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT c.* 
       FROM customers.customers c 
       WHERE c.is_active = true 
       ORDER BY c.name 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },
};

module.exports = {
  pool,
  Customer,
};
