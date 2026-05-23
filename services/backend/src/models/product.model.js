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
    const { 
      name, 
      sku, 
      barcode, 
      description, 
      category_id, 
      category, 
      unit_price, 
      cost_price, 
      stock_quantity, 
      stock,
      min_stock_level, 
      expiration_date, 
      image_url 
    } = data;

    // 1. Resolver category_id dinámicamente si no se provee pero se envía el nombre de la categoría
    let finalCategoryId = category_id || null;
    if (!finalCategoryId && category) {
      try {
        const catRes = await query('SELECT id FROM categories WHERE name ILIKE $1', [category.trim()]);
        if (catRes.rows.length > 0) {
          finalCategoryId = catRes.rows[0].id;
        } else {
          // Crear la categoría si no existe para mantener la integridad referencial
          const newCat = await query(
            'INSERT INTO categories (name, active) VALUES ($1, true) RETURNING id',
            [category.trim()]
          );
          finalCategoryId = newCat.rows[0].id;
        }
      } catch (catErr) {
        console.error('Error al resolver categoría en Product.create:', catErr.message);
      }
    }

    // 2. Establecer valores por defecto seguros para evitar violaciones de NOT NULL en Supabase
    const finalMinStockLevel = (min_stock_level !== undefined && min_stock_level !== null && min_stock_level !== '')
      ? parseInt(min_stock_level, 10)
      : 10;

    const finalStockQuantity = (stock_quantity !== undefined && stock_quantity !== null && stock_quantity !== '')
      ? parseInt(stock_quantity, 10)
      : (stock !== undefined && stock !== null && stock !== '') 
        ? parseInt(stock, 10) 
        : 0;

    const finalCostPrice = (cost_price !== undefined && cost_price !== null && cost_price !== '')
      ? parseFloat(cost_price)
      : (unit_price ? parseFloat(unit_price) * 0.7 : 0.0);

    const insertFields = ['name', 'sku', 'barcode', 'description', 'category_id', 'unit_price', 'cost_price', 'stock_quantity', 'min_stock_level', 'expiration_date'];
    const insertValues = [
      name, 
      sku, 
      barcode || null, 
      description || null, 
      finalCategoryId, 
      unit_price ? parseFloat(unit_price) : 0.0, 
      finalCostPrice, 
      finalStockQuantity,
      finalMinStockLevel, 
      expiration_date || null
    ];

    // Only add image_url if it's provided
    if (image_url) {
      insertFields.push('image_url');
      insertValues.push(image_url);
    }

    const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await query(
      `INSERT INTO products (${insertFields.join(',')}) VALUES (${placeholders}) RETURNING *`,
      insertValues
    );
    return rows[0];
  },

  async update(id, data) {
    const fields = []; 
    const values = []; 
    let idx = 1;
    
    const allowedFields = ['name','sku','barcode','description','category_id','unit_price','cost_price','stock_quantity','min_stock_level','expiration_date','active'];
    
    // Only add image_url if it's explicitly provided and not null/undefined
    if (data.image_url !== undefined) {
      allowedFields.push('image_url');
    }

    allowedFields.forEach((f) => {
      if (data[f] !== undefined) { 
        fields.push(`${f} = $${idx++}`); 
        values.push(data[f]); 
      }
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
