const AuthService = require('../services/auth.service');
const AuditService = require('../services/audit.service');

const authController = {
  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body);
      await AuditService.logRegister(user.id, user.username, req.ip, req.headers['user-agent']);
      res.status(201).json(user);
    } catch (e) { next(e); }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      await AuditService.logLogin(result.user.id, result.user.username, req.ip, req.headers['user-agent']);
      res.json(result);
    } catch (e) {
      await AuditService.logLogin(null, req.body.username, req.ip, req.headers['user-agent'], 'failed', e.message);
      next(e);
    }
  },

  async me(req, res, next) {
    try {
      const user = await AuthService.me(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (e) { next(e); }
  },

  async listUsers(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const users = await AuthService.listUsers(parseInt(limit), parseInt(offset));
      res.json(users);
    } catch (e) { next(e); }
  },

  async updateUser(req, res, next) {
    try {
      const user = await AuthService.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await AuditService.log({
        operation: 'UPDATE',
        userId: req.user?.id,
        username: req.user?.username,
        entity: 'user',
        recordId: req.params.id,
        newData: req.body,
        ipAddress: req.ip,
      });
      res.json(user);
    } catch (e) { next(e); }
  },

  async deleteUser(req, res, next) {
    try {
      const user = await AuthService.deleteUser(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found or already inactive' });
      await AuditService.log({
        operation: 'DELETE',
        userId: req.user?.id,
        username: req.user?.username,
        entity: 'user',
        recordId: req.params.id,
        ipAddress: req.ip,
        details: 'User deactivated'
      });
      res.json({ message: 'User deactivated successfully', user });
    } catch (e) { next(e); }
  },

  async createUser(req, res, next) {
    try {
      const user = await AuthService.createUser(req.body);
      await AuditService.log({
        operation: 'CREATE',
        userId: req.user?.id,
        username: req.user?.username,
        entity: 'user',
        recordId: user.id,
        newData: req.body,
        ipAddress: req.ip,
      });
      res.status(201).json(user);
    } catch (e) { next(e); }
  },
};

module.exports = authController;
