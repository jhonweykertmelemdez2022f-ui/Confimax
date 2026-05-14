const { query, transaction } = require('../database/queryWrapper');

const Sale = {
  async findById(id) {
    const { rows } = await query(
      'SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = $1',
      [id]
    );
    if (!rows[0]) return null;
    const items = await query(
      'SELECT si.*, p.name as product_name FROM sale_items si LEFT JOIN products p ON si.product_id = p.id WHERE si.sale_id = $1',
      [id]
    );
    rows[0].items = items.rows;
    return rows[0];
  },

  async create(data, items) {
    return transaction(async (client) => {
      const { customer_id, vendor_id, subtotal, iva, total, currency = 'VES', status = 'completed', notes } = data;
      const { rows } = await query(
        'INSERT INTO sales (customer_id, vendor_id, subtotal, iva, total, currency, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
        [customer_id, vendor_id, subtotal, iva, total, currency, status, notes],
        client
      );
      const sale = rows[0];
      if (items && items.length) {
        for (const it of items) {
          await query(
            'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5)',
            [sale.id, it.product_id, it.quantity, it.unit_price, it.total],
            client
          );
          await query(
            'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
            [it.quantity, it.product_id],
            client
          );
        }
      }
      return sale;
    });
  },

  async updateStatus(id, status) {
    const { rows } = await query('UPDATE sales SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return rows[0];
  },

  async list(limit = 50, offset = 0, filters = {}) {
    let sql = 'SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1';
    const vals = [];
    if (filters.customer_id) { sql += ` AND s.customer_id = $${vals.length + 1}`; vals.push(filters.customer_id); }
    if (filters.status) { sql += ` AND s.status = $${vals.length + 1}`; vals.push(filters.status); }
    if (filters.start_date) { sql += ` AND s.created_at >= $${vals.length + 1}`; vals.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND s.created_at <= $${vals.length + 1}`; vals.push(filters.end_date); }
    sql += ` ORDER BY s.created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`;
    vals.push(limit, offset);
    const { rows } = await query(sql, vals);
    return rows;
  },

  async dailySummary(date) {
    const { rows } = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total FROM sales WHERE DATE(created_at) = $1 AND status = 'completed'`,
      [date]
    );
    return { date, count: parseInt(rows[0].count), total: parseFloat(rows[0].total) };
  },
};

module.exports = { Sale };
