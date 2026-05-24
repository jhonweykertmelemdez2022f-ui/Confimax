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

  async findById(id, includeInactive = false) {
    const result = await pool.query(
      `SELECT id, email, username, role, active, created_at, last_login, permissions 
       FROM public.users WHERE id = $1 ${!includeInactive ? 'AND active = true' : ''}`,
      [id]
    );
    return result.rows[0];
  },

  async create(profileData) {
    const { username, email, password, role = 'customer', active = true } = profileData;
    const result = await pool.query(
      `INSERT INTO public.users (username, email, password, role, active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, username, role, active, created_at, last_login, permissions`,
      [username, email, password, role, active]
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
      `SELECT id, email, username, role, active, created_at, last_login, permissions 
       FROM public.users 
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
    const { username, email, role, active } = updateData;
    const result = await pool.query(
      `UPDATE public.users 
       SET username = COALESCE($1, username), 
           email = COALESCE($2, email), 
           role = COALESCE($3, role),
           active = COALESCE($4, active)
       WHERE id = $5
       RETURNING id, email, username, role, active, created_at, last_login, permissions`,
      [username, email, role, active, id]
    );
    return result.rows[0];
  },
};

module.exports = {
  pool,
  Profile,
};
