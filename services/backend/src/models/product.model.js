const { query } = require('../database/queryWrapper');

const Product = {
  async findById(id) {
    const { rows } = await query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [id]
    );
    return rows[0];
  },

  async findBySku(sku) {
    const { rows } = await query('SELECT * FROM products WHERE sku = $1', [sku]);
    return rows[0];
  },

  async create(data) {
    const { name, sku, barcode, description, category_id, unit_price, cost_price, min_stock_level, expiration_date, image_url } = data;
    const { rows } = await query(
      'INSERT INTO products (name, sku, barcode, description, category_id, unit_price, cost_price, min_stock_level, expiration_date, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, sku, barcode, description, category_id, unit_price, cost_price, min_stock_level, expiration_date, image_url]
    );
    return rows[0];
  },

  async update(id, data) {
    const fields = []; const values = []; let idx = 1;
    ['name','sku','barcode','description','category_id','unit_price','cost_price','stock_quantity','min_stock_level','expiration_date','image_url','active'].forEach((f) => {
      if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); values.push(data[f]); }
    });
    if (!fields.length) return null;
    values.push(id);
    const { rows } = await query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return rows[0];
  },

  async delete(id) {
    await query('DELETE FROM products WHERE id = $1', [id]);
  },

  async list(limit = 50, offset = 0, filters = {}) {
    let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const vals = [];
    if (filters.category_id) { sql += ` AND p.category_id = $${vals.length + 1}`; vals.push(filters.category_id); }
    if (filters.active !== undefined) { sql += ` AND p.active = $${vals.length + 1}`; vals.push(filters.active); }
    sql += ` ORDER BY p.created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`;
    vals.push(limit, offset);
    const { rows } = await query(sql, vals);
    return rows;
  },
};

const Category = {
  async list() {
    const { rows } = await query('SELECT * FROM categories WHERE active = true ORDER BY name');
    return rows;
  },

  async create(data) {
    const { name, description, parent_id } = data;
    const { rows } = await query('INSERT INTO categories (name, description, parent_id) VALUES ($1,$2,$3) RETURNING *', [name, description, parent_id]);
    return rows[0];
  },
};

module.exports = { Product, Category };
