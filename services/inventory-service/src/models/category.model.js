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

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    const isSupabase = (config.db.url || config.db.host || '').includes('supabase.co');
    console.log(`✅ Inventory DB: ${isSupabase ? 'Supabase' : 'PostgreSQL Local'}`);
  }
});

class Category {
  static async findAll() {
    try {
      const result = await pool.query(
        'SELECT * FROM inventory.categories ORDER BY name ASC'
      );
      return result.rows;
    } catch (err) {
      console.error('[Category.findAll] Error:', err.message);
      // Si falla por columnas que no existen, intentar sin filtro
      try {
        const result = await pool.query(
          'SELECT * FROM inventory.categories'
        );
        return result.rows;
      } catch (err2) {
        console.error('[Category.findAll] Fallback error:', err2.message);
        // Si la tabla no existe o falla, devolver array vacío
        return [];
      }
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM inventory.categories WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('[Category.findById] Error:', err.message);
      return null;
    }
  }

  static async create(data) {
    try {
      const { name, description } = data;
      // Intentar con active primero, si falla, intentar sin él
      try {
        const result = await pool.query(
          'INSERT INTO inventory.categories (name, description, active) VALUES ($1, $2, true) RETURNING *',
          [name, description]
        );
        return result.rows[0];
      } catch (err) {
        console.log('[Category.create] Intentando sin columna active...');
        // Intentar sin la columna active
        const result = await pool.query(
          'INSERT INTO inventory.categories (name, description) VALUES ($1, $2) RETURNING *',
          [name, description]
        );
        return result.rows[0];
      }
    } catch (err) {
      console.error('[Category.create] Error:', err.message);
      throw err;
    }
  }

  static async update(id, data) {
    try {
      const { name, description } = data;
      const result = await pool.query(
        'UPDATE inventory.categories SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [name, description, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('[Category.update] Error:', err.message);
      throw err;
    }
  }

  static async delete(id) {
    try {
      // Intentar con active primero, si falla, intentar borrar directamente
      try {
        await pool.query(
          'UPDATE inventory.categories SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [id]
        );
      } catch (err) {
        console.log('[Category.delete] Intentando DELETE directo...');
        await pool.query(
          'DELETE FROM inventory.categories WHERE id = $1',
          [id]
        );
      }
    } catch (err) {
      console.error('[Category.delete] Error:', err.message);
      throw err;
    }
  }
}

module.exports = Category;
