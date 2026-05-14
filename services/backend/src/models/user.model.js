const { query } = require('../database/queryWrapper');

const User = {
  async findById(id) {
    const { rows } = await query(
      'SELECT id, username, email, role, active, last_login, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  },

  async findByUsername(username) {
    const { rows } = await query('SELECT * FROM users WHERE username = $1 AND active = true', [username]);
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1 AND active = true', [email]);
    return rows[0];
  },

  async create(data) {
    const { username, email, password, role } = data;
    const { rows } = await query(
      'INSERT INTO users (username, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, username, email, role, created_at',
      [username, email, password, role]
    );
    return rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    ['username', 'email', 'role', 'active'].forEach((f) => {
      if (data[f] !== undefined) { fields.push(`${f} = $${idx++}`); values.push(data[f]); }
    });
    if (!fields.length) return null;
    values.push(id);
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role, active, updated_at`,
      values
    );
    return rows[0];
  },

  async updateLastLogin(id) {
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
  },

  async list(limit = 50, offset = 0) {
    const { rows } = await query(
      'SELECT id, username, email, role, active, last_login, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return rows;
  },
};

module.exports = { User };
