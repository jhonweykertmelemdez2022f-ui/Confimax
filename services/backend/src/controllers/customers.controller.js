const CustomersService = require('../services/customers.service');

const customersController = {
  async listCustomers(req, res, next) {
    try {
      const { limit = 50, offset = 0, q } = req.query;
      const customers = await CustomersService.listCustomers(parseInt(limit), parseInt(offset), q);
      res.json(customers);
    } catch (e) { next(e); }
  },

  async getCustomer(req, res, next) {
    try {
      const customer = await CustomersService.getCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      res.json(customer);
    } catch (e) { next(e); }
  },

  async createCustomer(req, res, next) {
    try {
      const customer = await CustomersService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (e) { next(e); }
  },

  async updateCustomer(req, res, next) {
    try {
      const customer = await CustomersService.updateCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      res.json(customer);
    } catch (e) { next(e); }
  },

  async deleteCustomer(req, res, next) {
    try {
      await CustomersService.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (e) { next(e); }
  },

  async getCustomerCredits(req, res, next) {
    try { res.json(await CustomersService.getCustomerCredits(req.params.id)); }
    catch (e) { next(e); }
  },

  async createCredit(req, res, next) {
    try {
      const credit = await CustomersService.createCredit(req.body);
      res.status(201).json(credit);
    } catch (e) { next(e); }
  },
};

module.exports = customersController;
