const CustomersService = require('../services/customers.service');
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
      username: req.user?.username || req.user?.email,
      ip: req.ip,
      endpoint: req.originalUrl,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('[CUSTOMERS] Failed to send audit log:', err.message);
  }
};

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
      await sendAudit(req, 'CREATE', 'Customer', customer.id, customer);
      res.status(201).json(customer); 
    }
    catch (error) {
      next(error);
    }
  },

  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const oldCustomer = await CustomersService.getCustomer(id, false);
      const customer = await CustomersService.updateCustomer(id, req.body);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      await sendAudit(req, 'UPDATE', 'Customer', customer.id, customer, oldCustomer);
      res.json(customer);
    } catch (error) {
      next(error);
    }
  },

  async deleteCustomer(req, res, next) {
    try { 
      const { id } = req.params;
      const oldCustomer = await CustomersService.getCustomer(id, false);
      await CustomersService.deleteCustomer(id); 
      if (oldCustomer) await sendAudit(req, 'DELETE', 'Customer', id, null, oldCustomer);
      res.status(204).send(); 
    }
    catch (error) {
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
