const CustomersService = require('../services/customers.service');

const customerController = {
  async getCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await CustomersService.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      next(error);
    }
  },

  async searchCustomers(req, res, next) {
    try {
      const { q, limit = 20 } = req.query;
      const customers = await CustomersService.searchCustomers(q, parseInt(limit));
      res.json(customers);
    } catch (error) {
      next(error);
    }
  },

  async createCustomer(req, res, next) {
    try {
      const customer = await CustomersService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  },

  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await CustomersService.updateCustomer(id, req.body);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      next(error);
    }
  },

  async deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;
      await CustomersService.deleteCustomer(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async listCustomers(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const customers = await CustomersService.listCustomers(parseInt(limit), parseInt(offset));
      res.json(customers);
    } catch (error) {
      next(error);
    }
  },

  async getCustomerDebt(req, res, next) {
    try {
      const { id } = req.params;
      const debt = await CustomersService.getCustomerDebt(id);
      res.json({ customer_id: id, total_debt: debt });
    } catch (error) {
      next(error);
    }
  },

  async getCustomerCredits(req, res, next) {
    try {
      const { id } = req.params;
      const credits = await CustomersService.getCustomerCredits(id);
      res.json(credits);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = customerController;
