const CustomersService = require('../services/customers.service');

const creditController = {
  async createCredit(req, res, next) {
    try {
      const credit = await CustomersService.createCredit(req.body);
      res.status(201).json(credit);
    } catch (error) {
      next(error);
    }
  },

  async getCredit(req, res, next) {
    try {
      const { id } = req.params;
      const credit = await CustomersService.getCredit(id);
      
      if (!credit) {
        return res.status(404).json({ message: 'Credit not found' });
      }
      
      res.json(credit);
    } catch (error) {
      next(error);
    }
  },

  async addPayment(req, res, next) {
    try {
      const { id } = req.params;
      const credit = await CustomersService.addPayment(id, req.body);
      res.json(credit);
    } catch (error) {
      next(error);
    }
  },

  async listCredits(req, res, next) {
    try {
      const { limit = 50, offset = 0, customer_id, status, overdue } = req.query;
      const filters = { customer_id, status, overdue: overdue === 'true' };
      
      const credits = await CustomersService.listCredits(parseInt(limit), parseInt(offset), filters);
      res.json(credits);
    } catch (error) {
      next(error);
    }
  },

  async getExpiringCredits(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const credits = await CustomersService.getExpiringCredits(parseInt(days));
      res.json(credits);
    } catch (error) {
      next(error);
    }
  },

  async getOverdueCredits(req, res, next) {
    try {
      const credits = await CustomersService.getOverdueCredits();
      res.json(credits);
    } catch (error) {
      next(error);
    }
  },

  async getTotalReceivable(req, res, next) {
    try {
      const summary = await CustomersService.getTotalReceivable();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = creditController;
