const { query } = require('../database/queryWrapper');

const Customer = {
  async findById(id) {
    const { rows } = await query('SELECT * FROM customers WHERE id = $1', [id]);
    return rows[0];
  },

  async create(data) {
    const { name, tax_id, email, phone, notes } = data;
    const { rows } = await query(
      'INSERT INTO customers (name, tax_id, email, phone, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, tax_id || null, email || null, phone || null, notes || null]
    );
    return rows[0];
  },

  async update(id, data) {
    const fields = []; const values = []; let idx = 1;
    const allowedFields = ['name', 'tax_id', 'email', 'phone', 'notes', 'is_active'];
    
    allowedFields.forEach((f) => {
      if (data[f] !== undefined) { 
        fields.push(`${f} = $${idx++}`); 
        values.push(data[f]); 
      }
    });
    
    if (!fields.length) return this.findById(id);
    
    values.push(id);
    const { rows } = await query(`UPDATE customers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return rows[0];
  },

  async delete(id) {
    await query('UPDATE customers SET is_active = false WHERE id = $1', [id]);
  },

  async list(limit = 50, offset = 0, q) {
    let sql = 'SELECT * FROM customers WHERE is_active = true';
    const vals = [];
    if (q) { sql += ` AND (name ILIKE $${vals.length + 1} OR tax_id ILIKE $${vals.length + 1} OR email ILIKE $${vals.length + 1})`; vals.push(`%${q}%`); }
    sql += ` ORDER BY name LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`;
    vals.push(limit, offset);
    const { rows } = await query(sql, vals);
    return rows;
  },
};

const Credit = {
  async findByCustomer(customerId) {
    const { rows } = await query('SELECT * FROM credits WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
    return rows;
  },

  async create(data) {
    const { customer_id, sale_id, amount, balance, currency = 'VES', payment_due_date, notes } = data;
    const { rows } = await query(
      'INSERT INTO credits (customer_id, sale_id, amount, balance, currency, payment_due_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [customer_id, sale_id, amount, balance, currency, payment_due_date, notes]
    );
    return rows[0];
  },
};

module.exports = { Customer, Credit };
