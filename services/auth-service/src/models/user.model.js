const sharedPath = process.env.SHARED_MODULES_PATH || '../../../shared';
const { pool } = require(sharedPath + '/database');
const { messageQueue, connectRedis } = require('../services/redis.service');

// Conectar Redis para auditoría
connectRedis();

const Profile = {
  async findByEmail(email) {
    const sql = 'SELECT * FROM public.users WHERE LOWER(email) = LOWER($1) AND active = true';
    messageQueue.publish('audit-logs', {
      action: 'PG_QUERY_ATTEMPT_LOGIN',
      details: { query: sql, email },
      context: { service: 'auth-service', entity: 'Profile' }
    });
    const result = await pool.query(sql, [email]);
    return result.rows[0];
  },

  async findByUsername(username) {
    const sql = 'SELECT * FROM public.users WHERE LOWER(username) = LOWER($1) AND active = true';
    messageQueue.publish('audit-logs', {
      action: 'PG_QUERY_ATTEMPT_LOGIN_USERNAME',
      details: { query: sql, username },
      context: { service: 'auth-service', entity: 'Profile' }
    });
    const result = await pool.query(sql, [username]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, username as name, role, active as is_active, created_at FROM public.users WHERE id = $1 AND active = true',
      [id]
    );
    return result.rows[0];
  },

  async create(profileData) {
    const { username, email, password, role = 'cliente' } = profileData;
    const result = await pool.query(
      `INSERT INTO public.users (username, email, password, role, active) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id, email, username as name, role, created_at`,
      [username, email, password, role]
    );
    return result.rows[0];
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE public.users SET last_login = NOW() WHERE id = $1',
      [id]
    );
  },

  async list(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT id, email, username as name, role, active as is_active, created_at, last_login 
       FROM public.users WHERE active = true 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async deactivate(id) {
    await pool.query(
      'UPDATE public.users SET active = false WHERE id = $1',
      [id]
    );
  },

  async update(id, updateData) {
    const { username, email, role } = updateData;
    const result = await pool.query(
      `UPDATE public.users 
       SET username = COALESCE($1, username), 
           email = COALESCE($2, email), 
           role = COALESCE($3, role)
       WHERE id = $4 AND active = true
       RETURNING id, email, username as name, role, created_at`,
      [username, email, role, id]
    );
    return result.rows[0];
  },
};

module.exports = {
  pool,
  Profile,
};
