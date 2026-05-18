const AuthService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');

const authController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
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
      const result = await AuthService.updateUser(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const result = await AuthService.deleteUser(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
