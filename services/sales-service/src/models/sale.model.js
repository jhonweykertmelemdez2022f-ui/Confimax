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

const VALID_STATUSES_SPANISH = ['pendiente', 'entregado', 'cancelado'];
const VALID_STATUSES_ENGLISH = ['pending', 'delivered', 'cancelled'];
const VALID_TRANSITIONS_SPANISH = {
  'pendiente': ['entregado', 'cancelado'],
  'entregado': [],
  'cancelado': []
};
const VALID_TRANSITIONS_ENGLISH = {
  'pending': ['delivered', 'cancelled'],
  'delivered': [],
  'cancelled': []
};

const spanishToEnglish = (status) => {
  const map = {
    'pendiente': 'pending',
    'entregado': 'delivered',
    'cancelado': 'cancelled',
    'pending': 'pending',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'confirmed': 'delivered',
    'processing': 'pending',
    'shipped': 'delivered',
    'refunded': 'cancelled'
  };
  return map[status] || 'pending';
};

const englishToSpanish = (status) => {
  const map = {
    'pending': 'pendiente',
    'delivered': 'entregado',
    'cancelled': 'cancelado',
    'canceled': 'cancelado',
    'confirmed': 'entregado',
    'processing': 'pendiente',
    'shipped': 'entregado',
    'refunded': 'cancelado'
  };
  return map[status] || status;
};

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
      order.status = englishToSpanish(order.status);
      order.items = await this.getOrderItems(id);
      order.payments = await this.getOrderPayments(id);
    }
    return order;
  },

  async create(orderData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { customer_id, user_id, items, notes, shipping_address_id, billing_address_id } = orderData;
      const status = spanishToEnglish(orderData.status) || 'pending';

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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newStatusSpanish = englishToSpanish(status);
      const newStatusEnglish = spanishToEnglish(status);
      
      // 1. Get current order
      const { rows: currentRows } = await client.query(
        'SELECT * FROM sales.orders WHERE id = $1',
        [id]
      );
      if (!currentRows[0]) {
        throw new Error('Orden no encontrada');
      }
      const currentOrder = currentRows[0];
      const currentStatusSpanish = englishToSpanish(currentOrder.status);
      const currentStatusEnglish = spanishToEnglish(currentOrder.status);

      // 2. Validate status and transition
      if (!VALID_STATUSES_SPANISH.includes(newStatusSpanish)) {
        throw new Error('Estado inválido');
      }
      if (!VALID_TRANSITIONS_SPANISH[currentStatusSpanish].includes(newStatusSpanish)) {
        throw new Error('Esta orden ya fue finalizada y no puede modificarse.');
      }

      // 3. Get order items with product info from inventory
      const { rows: itemsRows } = await client.query(
        `SELECT oi.*, p.stock_quantity, p.name as product_name 
         FROM sales.order_items oi 
         LEFT JOIN inventory.products p ON oi.product_id = p.id 
         WHERE oi.order_id = $1`,
        [id]
      );

      // 4. Handle side effects
      if (currentStatusSpanish === 'pendiente' && newStatusSpanish === 'entregado') {
        // Check stock
        for (const item of itemsRows) {
          if (item.quantity > item.stock_quantity) {
            throw new Error(`Stock insuficiente para el producto "${item.product_name}": disponible ${item.stock_quantity}, requerido ${item.quantity}`);
          }
        }
        // Discount inventory
        for (const item of itemsRows) {
          await client.query(
            'UPDATE inventory.products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
            [item.quantity, item.product_id]
          );
        }
      }

      // 5. Update order status (use English for DB!)
      const completedAt = newStatusSpanish === 'entregado' ? new Date() : null;
      const { rows: updatedRows } = await client.query(
        `UPDATE sales.orders 
         SET status = $1, updated_at = NOW(), 
             completed_at = COALESCE($2, completed_at)
         WHERE id = $3 RETURNING *`,
        [newStatusEnglish, completedAt, id]
      );

      await client.query('COMMIT');
      
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
      values.push(spanishToEnglish(filters.status));
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
    return result.rows.map(row => ({ ...row, status: englishToSpanish(row.status) }));
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
