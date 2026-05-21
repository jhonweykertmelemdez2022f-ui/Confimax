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
