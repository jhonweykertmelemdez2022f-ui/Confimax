const sharedPath = process.env.SHARED_MODULES_PATH || '../../../shared';
const { pool } = require(sharedPath + '/database');
const { messageQueue, connectRedis } = require('../services/redis.service');

// Conectar Redis para auditoría
connectRedis();

const Profile = {
  async findByEmail(email) {
    const sql = 'SELECT * FROM public.profiles WHERE email = $1 AND is_active = true';
    messageQueue.publish('audit-logs', {
      action: 'PG_QUERY_ATTEMPT_LOGIN',
      details: { query: sql, email },
      context: { service: 'auth-service', entity: 'Profile' }
    });
    const result = await pool.query(sql, [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, name, role, phone, created_at FROM public.profiles WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0];
  },

  async create(profileData) {
    const { email, name, password, role = 'user', phone } = profileData;
    const result = await pool.query(
      `INSERT INTO public.profiles (email, name, role, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role, phone, created_at`,
      [email, name, role, phone || null]
    );
    return result.rows[0];
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE public.profiles SET last_login_at = NOW() WHERE id = $1',
      [id]
    );
  },

  async list(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT id, email, name, role, phone, created_at, last_login_at 
       FROM public.profiles WHERE is_active = true 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async deactivate(id) {
    await pool.query(
      'UPDATE public.profiles SET is_active = false WHERE id = $1',
      [id]
    );
  },
};

module.exports = {
  pool,
  Profile,
};
