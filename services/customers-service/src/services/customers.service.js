const { Customer } = require('../models/customer.model');
const { cacheService } = require('./redis.service');
const config = require('../config');

const normalizeData = (data) => {
  const normalized = { ...data };
  if (normalized.rif !== undefined && normalized.tax_id === undefined) {
    normalized.tax_id = normalized.rif;
  }
  return normalized;
};

const addRifAlias = (customer) => {
  if (!customer) return customer;
  return {
    ...customer,
    rif: customer.tax_id,
  };
};

const CustomersService = {
  async getCustomer(id, useCache = true) {
    const cacheKey = `customer:${id}`;
    
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return addRifAlias(cached);
    }

    const customer = await Customer.findById(id);
    
    if (customer && useCache) {
      await cacheService.set(cacheKey, customer, 300);
    }

    return addRifAlias(customer);
  },

  async getCustomerByRif(rif) {
    const customer = await Customer.findByTaxId(rif);
    return addRifAlias(customer);
  },

  async searchCustomers(query, limit = 20) {
    const customers = await Customer.search(query, limit);
    return customers.map(addRifAlias);
  },

  async createCustomer(customerData) {
    const normalized = normalizeData(customerData);
    
    if (normalized.tax_id) {
      const existing = await Customer.findByTaxId(normalized.tax_id);
      if (existing) {
        throw new Error('RIF already exists');
      }
    }

    if (normalized.email) {
      const existingEmail = await Customer.findByEmail(normalized.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    const customer = await Customer.create(normalized);
    
    await cacheService.delPattern('customers:list:*');
    
    return addRifAlias(customer);
  },

  async updateCustomer(id, customerData) {
    const normalized = normalizeData(customerData);
    const customer = await Customer.update(id, normalized);
    
    await cacheService.del(`customer:${id}`);
    await cacheService.delPattern('customers:list:*');
    
    return addRifAlias(customer);
  },

  async deleteCustomer(id) {
    await Customer.delete(id);
    
    await cacheService.del(`customer:${id}`);
    await cacheService.delPattern('customers:list:*');
  },

  async listCustomers(limit = 50, offset = 0) {
    const customers = await Customer.list(limit, offset);
    return customers.map(addRifAlias);
  },
};

module.exports = CustomersService;
