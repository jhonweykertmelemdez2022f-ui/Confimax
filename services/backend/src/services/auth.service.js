const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models/user.model');

const AuthService = {
  async register(data) {
    const { username, email, password, role = 'cliente' } = data;
    const existing = await User.findByUsername(username) || await User.findByEmail(email);
    if (existing) throw new Error('Username or email already exists');
    const hash = await bcrypt.hash(password, config.bcrypt.saltRounds);
    return User.create({ username, email, password: hash, role });
  },

  async login(data) {
    const { username, password } = data;
    const user = await User.findByUsername(username);
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');
    await User.updateLastLogin(user.id);
    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiration });
    return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
  },

  async me(userId) {
    return User.findById(userId);
  },

  async listUsers(limit, offset) {
    return User.list(limit, offset);
  },

  async updateUser(id, data) {
    return User.update(id, data);
  },
};

module.exports = AuthService;
