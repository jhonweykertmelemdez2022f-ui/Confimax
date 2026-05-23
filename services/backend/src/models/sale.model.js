const { query, transaction } = require('../database/queryWrapper');

const VALID_STATUSES_SPANISH = ['pendiente', 'entregado', 'cancelado'];
const VALID_STATUSES_ENGLISH = ['pending', 'delivered', 'cancelled'];
const VALID_TRANSITIONS_SPANISH = {
  'pendiente': ['entregado', 'cancelado'],
  'entregado': [],
  'cancelado': []
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

const Sale = {
  async findById(id) {
    const { rows } = await query(
      'SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = $1',
      [id]
    );
    if (!rows[0]) return null;
    rows[0].status = englishToSpanish(rows[0].status);
    const items = await query(
      'SELECT si.*, p.name as product_name FROM sale_items si LEFT JOIN products p ON si.product_id = p.id WHERE si.sale_id = $1',
      [id]
    );
    rows[0].items = items.rows;
    return rows[0];
  },

  async create(data, items) {
    return transaction(async (client) => {
      const { customer_id, vendor_id, subtotal, iva, total, currency = 'VES', notes } = data;
      const status = spanishToEnglish('pendiente');
      const { rows } = await query(
        'INSERT INTO sales (customer_id, vendor_id, subtotal, iva, total, currency, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
        [customer_id, vendor_id, subtotal, iva, total, currency, status, notes],
        client
      );
      const sale = rows[0];
      sale.status = englishToSpanish(sale.status);
      if (items && items.length) {
        for (const it of items) {
          await query(
            'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5)',
            [sale.id, it.product_id, it.quantity, it.unit_price, it.total],
            client
          );
        }
      }
      return sale;
    });
  },

  async updateStatus(id, newStatus, userId = null) {
    return transaction(async (client) => {
      const newStatusSpanish = englishToSpanish(newStatus);
      const newStatusEnglish = spanishToEnglish(newStatus);

      // 1. Get current sale
      const { rows: currentRows } = await query(
        'SELECT * FROM sales WHERE id = $1',
        [id],
        client
      );
      if (!currentRows[0]) {
        throw new Error('Orden no encontrada');
      }
      const currentSale = currentRows[0];
      const currentStatusSpanish = englishToSpanish(currentSale.status);

      // 2. Validate status and transition
      if (!VALID_STATUSES_SPANISH.includes(newStatusSpanish)) {
        throw new Error('Estado inválido');
      }
      if (!VALID_TRANSITIONS_SPANISH[currentStatusSpanish].includes(newStatusSpanish)) {
        throw new Error('Esta orden ya fue finalizada y no puede modificarse.');
      }

      // 3. Get sale items with product info
      const { rows: itemsRows } = await query(
        'SELECT si.*, p.stock_quantity, p.name as product_name FROM sale_items si LEFT JOIN products p ON si.product_id = p.id WHERE si.sale_id = $1',
        [id],
        client
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
          await query(
            'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
            [item.quantity, item.product_id],
            client
          );
        }
        // TODO: Add cash balance logic here when cash table exists
      }

      // 5. Update sale status (use English for DB!)
      const { rows: updatedRows } = await query(
        'UPDATE sales SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newStatusEnglish, id],
        client
      );

      // 6. Log status change (TODO: Add audit log or status history table later)
      console.log(`[ORDER STATUS] Order ${id} changed from ${currentStatusSpanish} to ${newStatusSpanish} by user ${userId}`);

      const updatedSale = updatedRows[0];
      updatedSale.status = englishToSpanish(updatedSale.status);
      return updatedSale;
    });
  },

  async list(limit = 50, offset = 0, filters = {}) {
    let sql = 'SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1';
    const vals = [];
    if (filters.customer_id) { sql += ` AND s.customer_id = $${vals.length + 1}`; vals.push(filters.customer_id); }
    if (filters.status) { 
      sql += ` AND s.status = $${vals.length + 1}`; 
      vals.push(spanishToEnglish(filters.status)); 
    }
    if (filters.start_date) { sql += ` AND s.created_at >= $${vals.length + 1}`; vals.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND s.created_at <= $${vals.length + 1}`; vals.push(filters.end_date); }
    sql += ` ORDER BY s.created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`;
    vals.push(limit, offset);
    const { rows } = await query(sql, vals);
    return rows.map(row => ({ ...row, status: englishToSpanish(row.status) }));
  },

  async dailySummary(date) {
    const { rows } = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total FROM sales WHERE DATE(created_at) = $1 AND status = 'delivered'`,
      [date]
    );
    return { date, count: parseInt(rows[0].count), total: parseFloat(rows[0].total) };
  },
};

module.exports = { Sale };
