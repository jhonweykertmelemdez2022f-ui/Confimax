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

const Order = {
  async findById(id) {
    const result = await pool.query(
      `SELECT o.*, c.name as customer_name, c.email as customer_email, p.name as user_name
       FROM sales.orders o
       LEFT JOIN customers.customers c ON o.customer_id = c.id
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.id = $1`,
      [id]
    );
    const order = result.rows[0];
    if (order) {
      order.items = await this.getOrderItems(id);
      order.payments = await this.getOrderPayments(id);
    }
    return order;
  },

  async create(orderData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { customer_id, user_id, items, status = 'pending', notes, shipping_address_id, billing_address_id } = orderData;

      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.unit_price;
      }
      const tax = subtotal * config.tax.iva;
      const discount = orderData.discount || 0;
      const total = subtotal + tax - discount;

      const orderNumber = `ORD-${Date.now()}`;
      const orderResult = await client.query(
        `INSERT INTO sales.orders (order_number, customer_id, user_id, status, subtotal, tax, discount, total, notes, shipping_address_id, billing_address_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [orderNumber, customer_id, user_id, status, subtotal, tax, discount, total, notes || null, shipping_address_id || null, billing_address_id || null]
      );

      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO sales.order_items (order_id, product_id, sku, product_name, quantity, unit_price, discount, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [order.id, item.product_id, item.sku, item.product_name, item.quantity, item.unit_price, item.discount || 0, item.quantity * item.unit_price - (item.discount || 0)]
        );
      }

      await client.query('COMMIT');
      return await this.findById(order.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE sales.orders SET status = $1, updated_at = NOW(), 
       completed_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE completed_at END
       WHERE id = $3 RETURNING *`,
      [status, status, id]
    );
    return result.rows[0];
  },

  async list(limit = 50, offset = 0, filters = {}) {
    let query = `
      SELECT o.*, c.name as customer_name, c.email as customer_email, p.name as user_name
      FROM sales.orders o
      LEFT JOIN customers.customers c ON o.customer_id = c.id
      LEFT JOIN public.profiles p ON o.user_id = p.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.customer_id) {
      query += ` AND o.customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters.user_id) {
      query += ` AND o.user_id = $${paramCount}`;
      values.push(filters.user_id);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND o.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.start_date) {
      query += ` AND o.created_at >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query += ` AND o.created_at <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  async getOrderItems(orderId) {
    const result = await pool.query(
      `SELECT oi.*
       FROM sales.order_items oi
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  },

  async getOrderPayments(orderId) {
    const result = await pool.query(
      `SELECT pay.*
       FROM sales.payments pay
       WHERE pay.order_id = $1`,
      [orderId]
    );
    return result.rows;
  },

  async getOrdersByDateRange(startDate, endDate) {
    const result = await pool.query(
      `SELECT o.*, c.name as customer_name, p.name as user_name
       FROM sales.orders o
       LEFT JOIN customers.customers c ON o.customer_id = c.id
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.created_at >= $1 AND o.created_at <= $2
       ORDER BY o.created_at DESC`,
      [startDate, endDate]
    );
    return result.rows;
  },

  async getDailySales(date) {
    const result = await pool.query(
      `SELECT o.*, c.name as customer_name, p.name as user_name
       FROM sales.orders o
       LEFT JOIN customers.customers c ON o.customer_id = c.id
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE DATE(o.created_at) = $1
       ORDER BY o.created_at DESC`,
      [date]
    );
    return result.rows;
  },

  async getSalesSummary(startDate, endDate) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(subtotal) as total_subtotal,
        SUM(tax) as total_tax,
        SUM(discount) as total_discount,
        SUM(total) as total_amount,
        AVG(total) as average_order
       FROM sales.orders
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    );
    return result.rows[0];
  },
};

const Payment = {
  async create(paymentData) {
    const { order_id, payment_method, amount, currency = 'EUR', status = 'pending', transaction_id, metadata } = paymentData;
    const result = await pool.query(
      `INSERT INTO sales.payments (order_id, payment_method, amount, currency, status, transaction_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [order_id, payment_method, amount, currency, status, transaction_id || null, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE sales.payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  async findByOrder(orderId) {
    const result = await pool.query(
      `SELECT * FROM sales.payments WHERE order_id = $1 ORDER BY created_at DESC`,
      [orderId]
    );
    return result.rows;
  },
};

module.exports = {
  pool,
  Order,
  Payment,
};
