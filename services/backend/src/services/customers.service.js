const { Customer, Credit } = require('../models/customer.model');

const CustomersService = {
  async getCustomer(id) {
    return Customer.findById(id);
  },

  async createCustomer(data) {
    return Customer.create(data);
  },

  async updateCustomer(id, data) {
    return Customer.update(id, data);
  },

  async deleteCustomer(id) {
    return Customer.delete(id);
  },

  async listCustomers(limit, offset, q) {
    return Customer.list(limit, offset, q);
  },

  async getCustomerCredits(customerId) {
    return Credit.findByCustomer(customerId);
  },

  async createCredit(data) {
    return Credit.create(data);
  },
};

module.exports = CustomersService;
