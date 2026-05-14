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

const Credit = {
  async findById(id) {
    const result = await pool.query(
      `SELECT cr.*, c.name as customer_name, c.rif as customer_rif
       FROM credits cr
       JOIN customers c ON cr.customer_id = c.id
       WHERE cr.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByCustomerId(customerId) {
    const result = await pool.query(
      `SELECT cr.*, c.name as customer_name, c.rif as customer_rif
       FROM credits cr
       JOIN customers c ON cr.customer_id = c.id
       WHERE cr.customer_id = $1
       ORDER BY cr.created_at DESC`,
      [customerId]
    );
    return result.rows;
  },

  async create(creditData) {
    const { customer_id, sale_id, amount, currency = 'VES', payment_due_date, notes } = creditData;
    const result = await pool.query(
      `INSERT INTO credits (customer_id, sale_id, amount, balance, currency, payment_due_date, notes)
       VALUES ($1, $2, $3, $3, $4, $5, $6)
       RETURNING *`,
      [customer_id, sale_id, amount, currency, payment_due_date, notes]
    );
    return result.rows[0];
  },

  async updateBalance(id, amount, operation = 'subtract') {
    const operator = operation === 'subtract' ? '-' : '+';
    const result = await pool.query(
      `UPDATE credits 
       SET balance = balance ${operator} $1, 
           status = CASE WHEN (balance ${operator} $1) <= 0 THEN 'paid' ELSE status END,
           updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [amount, id]
    );
    return result.rows[0];
  },

  async addPayment(creditId, paymentData) {
    const { amount, payment_method, reference, notes } = paymentData;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const creditResult = await client.query(
        'SELECT * FROM credits WHERE id = $1',
        [creditId]
      );
      const credit = creditResult.rows[0];

      if (!credit) {
        throw new Error('Credit not found');
      }

      if (amount > credit.balance) {
        throw new Error('Payment amount exceeds balance');
      }

      await client.query(
        `INSERT INTO credit_payments (credit_id, amount, payment_method, reference, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [creditId, amount, payment_method, reference, notes]
      );

      const newBalance = credit.balance - amount;
      const newStatus = newBalance <= 0 ? 'paid' : 'active';

      await client.query(
        `UPDATE credits SET balance = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [newBalance, newStatus, creditId]
      );

      await client.query('COMMIT');

      return await this.findById(creditId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async list(limit = 50, offset = 0, filters = {}) {
    let query = `
      SELECT cr.*, c.name as customer_name, c.rif as customer_rif
      FROM credits cr
      JOIN customers c ON cr.customer_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.customer_id) {
      query += ` AND cr.customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND cr.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.overdue) {
      query += ` AND cr.status = 'active' AND cr.payment_due_date < NOW()`;
    }

    query += ` ORDER BY cr.payment_due_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  async getExpiringCredits(days = 7) {
    const result = await pool.query(
      `SELECT cr.*, c.name as customer_name, c.rif as customer_rif, c.email as customer_email
       FROM credits cr
       JOIN customers c ON cr.customer_id = c.id
       WHERE cr.status = 'active' 
         AND cr.payment_due_date <= NOW() + INTERVAL '${days} days'
         AND cr.payment_due_date > NOW()
       ORDER BY cr.payment_due_date ASC`
    );
    return result.rows;
  },

  async getOverdueCredits() {
    const result = await pool.query(
      `SELECT cr.*, c.name as customer_name, c.rif as customer_rif, c.email as customer_email
       FROM credits cr
       JOIN customers c ON cr.customer_id = c.id
       WHERE cr.status = 'active' AND cr.payment_due_date < NOW()
       ORDER BY cr.payment_due_date ASC`
    );
    return result.rows;
  },

  async getTotalReceivable() {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_credits,
        SUM(balance) as total_receivable,
        SUM(CASE WHEN payment_due_date < NOW() THEN balance ELSE 0 END) as total_overdue
       FROM credits 
       WHERE status = 'active'`
    );
    return result.rows[0];
  },
};

module.exports = {
  pool,
  Credit,
};
