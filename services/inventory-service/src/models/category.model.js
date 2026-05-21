const { pool } = require('../config/database');

class Category {
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM inventory.categories WHERE is_active = true ORDER BY name ASC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM inventory.categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create(data) {
    const { name, description } = data;
    const result = await pool.query(
      'INSERT INTO inventory.categories (name, description, is_active) VALUES ($1, $2, true) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, description } = data;
    const result = await pool.query(
      'UPDATE inventory.categories SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query(
      'UPDATE inventory.categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }
}

module.exports = Category;
