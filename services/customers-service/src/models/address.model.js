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

const Address = {
  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM customers.addresses WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByCustomer(customerId) {
    const result = await pool.query(
      'SELECT * FROM customers.addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC',
      [customerId]
    );
    return result.rows;
  },

  async create(addressData) {
    const { customer_id, type, name, address_line1, address_line2, city, state, postal_code, country, is_default } = addressData;
    const result = await pool.query(
      `INSERT INTO customers.addresses 
       (customer_id, type, name, address_line1, address_line2, city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [customer_id, type || 'shipping', name || null, address_line1, address_line2 || null, city, state || null, postal_code || null, country || 'España', is_default || false]
    );
    return result.rows[0];
  },

  async update(id, addressData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(addressData)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE customers.addresses SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM customers.addresses WHERE id = $1', [id]);
  },
};

module.exports = {
  pool,
  Address,
};
