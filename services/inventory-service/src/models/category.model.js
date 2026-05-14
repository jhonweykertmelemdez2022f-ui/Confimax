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

const Category = {
  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM inventory.categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByName(name) {
    const result = await pool.query(
      'SELECT * FROM inventory.categories WHERE name = $1',
      [name]
    );
    return result.rows[0];
  },

  async create(categoryData) {
    const { name, description, parent_id } = categoryData;
    const result = await pool.query(
      `INSERT INTO inventory.categories (name, description, parent_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description, parent_id || null]
    );
    return result.rows[0];
  },

  async update(id, categoryData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(categoryData)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE inventory.categories SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query(
      'DELETE FROM inventory.categories WHERE id = $1',
      [id]
    );
  },

  async list() {
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM inventory.products p WHERE p.category_id = c.id AND p.is_active = true) as product_count
       FROM inventory.categories c 
       ORDER BY c.name`
    );
    return result.rows;
  },

  async getTree() {
    const result = await pool.query(
      `WITH RECURSIVE category_tree AS (
        SELECT id, name, description, parent_id, 0 as level
        FROM inventory.categories 
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT c.id, c.name, c.description, c.parent_id, ct.level + 1
        FROM inventory.categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree ORDER BY level, name`
    );
    return result.rows;
  },
};

module.exports = {
  pool,
  Category,
};
