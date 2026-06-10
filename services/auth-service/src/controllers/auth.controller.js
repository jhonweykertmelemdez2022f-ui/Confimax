const AuthService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');
const { Profile } = require('../models/user.model');
const axios = require('axios');

const sendAudit = async (req, operation, entity, recordId, newData = null, oldData = null) => {
  try {
    const notificationsUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';
    await axios.post(`${notificationsUrl}/api/audit`, {
      entity,
      operation,
      recordId,
      newData,
      oldData,
      userId: req.user?.id || req.user?.sub,
      username: req.user?.username || req.user?.email || req.body?.email,
      ip: req.ip,
      endpoint: req.originalUrl,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('[AUTH] Failed to send audit log:', err.message);
  }
};

const authController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      await sendAudit(req, 'CREATE', 'User', result?.user?.id, result?.user);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const requestIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';
      const result = await AuthService.login({ ...req.body, ip: requestIp });
      await sendAudit(req, 'LOGIN', 'User', result?.user?.id, result?.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const result = await AuthService.refreshAccessToken(req.body.refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.body.refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const user = req.user;
      await AuthService.changePassword(user.id, req.body.oldPassword, req.body.newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentUser(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const user = await AuthService.validateToken(token);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      const users = await AuthService.listUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const oldUser = await Profile.findById(req.params.id);
      const result = await AuthService.updateUser(req.params.id, req.body);
      await sendAudit(req, 'UPDATE', 'User', req.params.id, result, oldUser);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const oldUser = await Profile.findById(req.params.id);
      const result = await AuthService.deleteUser(req.params.id);
      if (oldUser) await sendAudit(req, 'DELETE', 'User', req.params.id, null, oldUser);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
