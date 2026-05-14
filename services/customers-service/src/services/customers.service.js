const { Customer } = require('../models/customer.model');
const { Credit } = require('../models/credit.model');
const { cacheService } = require('./redis.service');
const config = require('../config');

const CustomersService = {
  async getCustomer(id, useCache = true) {
    const cacheKey = `customer:${id}`;
    
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    const customer = await Customer.findById(id);
    
    if (customer && useCache) {
      await cacheService.set(cacheKey, customer, 300);
    }

    return customer;
  },

  async getCustomerByRif(rif) {
    return await Customer.findByRif(rif);
  },

  async searchCustomers(query, limit = 20) {
    return await Customer.search(query, limit);
  },

  async createCustomer(customerData) {
    const existing = await Customer.findByRif(customerData.rif);
    if (existing) {
      throw new Error('RIF already exists');
    }

    if (customerData.email) {
      const existingEmail = await Customer.findByEmail(customerData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    const customer = await Customer.create(customerData);
    
    await cacheService.delPattern('customers:list:*');
    
    return customer;
  },

  async updateCustomer(id, customerData) {
    const customer = await Customer.update(id, customerData);
    
    await cacheService.del(`customer:${id}`);
    await cacheService.delPattern('customers:list:*');
    
    return customer;
  },

  async deleteCustomer(id) {
    await Customer.delete(id);
    
    await cacheService.del(`customer:${id}`);
    await cacheService.delPattern('customers:list:*');
  },

  async listCustomers(limit = 50, offset = 0) {
    return await Customer.list(limit, offset);
  },

  async getCustomerDebt(customerId) {
    return await Customer.getTotalDebt(customerId);
  },

  async createCredit(creditData) {
    const customer = await Customer.findById(creditData.customer_id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const currentDebt = await Customer.getTotalDebt(creditData.customer_id);
    const newDebt = parseFloat(currentDebt) + parseFloat(creditData.amount);
    
    if (newDebt > customer.credit_limit) {
      throw new Error('Credit limit exceeded');
    }

    if (!creditData.payment_due_date) {
      const days = config.credit.defaultDays;
      creditData.payment_due_date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const credit = await Credit.create(creditData);
    
    await cacheService.delPattern('customers:list:*');
    
    return credit;
  },

  async getCredit(id) {
    return await Credit.findById(id);
  },

  async getCustomerCredits(customerId) {
    return await Credit.findByCustomerId(customerId);
  },

  async addPayment(creditId, paymentData) {
    const credit = await Credit.addPayment(creditId, paymentData);
    
    await cacheService.delPattern('customers:list:*');
    
    return credit;
  },

  async listCredits(limit = 50, offset = 0, filters = {}) {
    return await Credit.list(limit, offset, filters);
  },

  async getExpiringCredits(days = 7) {
    return await Credit.getExpiringCredits(days);
  },

  async getOverdueCredits() {
    return await Credit.getOverdueCredits();
  },

  async getTotalReceivable() {
    return await Credit.getTotalReceivable();
  },
};

module.exports = CustomersService;
