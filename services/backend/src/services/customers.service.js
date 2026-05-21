const { Customer, Credit } = require('../models/customer.model');

const CustomersService = {
  async getCustomer(id) {
    const customer = await Customer.findById(id);
    if (customer) {
      customer.rif = customer.tax_id;
    }
    return customer;
  },

  async createCustomer(data) {
    const normalizedData = { ...data };
    if (normalizedData.rif !== undefined && normalizedData.tax_id === undefined) {
      normalizedData.tax_id = normalizedData.rif;
    }
    const customer = await Customer.create(normalizedData);
    if (customer) {
      customer.rif = customer.tax_id;
    }
    return customer;
  },

  async updateCustomer(id, data) {
    const normalizedData = { ...data };
    if (normalizedData.rif !== undefined && normalizedData.tax_id === undefined) {
      normalizedData.tax_id = normalizedData.rif;
    }
    const customer = await Customer.update(id, normalizedData);
    if (customer) {
      customer.rif = customer.tax_id;
    }
    return customer;
  },

  async deleteCustomer(id) {
    return Customer.delete(id);
  },

  async listCustomers(limit, offset, q) {
    const customers = await Customer.list(limit, offset, q);
    return customers.map(customer => ({
      ...customer,
      rif: customer.tax_id,
    }));
  },

  async getCustomerCredits(customerId) {
    return Credit.findByCustomer(customerId);
  },

  async createCredit(data) {
    return Credit.create(data);
  },
};

module.exports = CustomersService;
