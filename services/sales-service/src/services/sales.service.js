const { Order, Payment } = require('../models/sale.model');
const PriceService = require('./price.service');
const { cacheService } = require('./redis.service');
const config = require('../config');

const SalesService = {
  async createOrder(orderData) {
    const { items } = orderData;

    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        throw new Error('Invalid item data');
      }
    }

    const order = await Order.create(orderData);
    await cacheService.delPattern('orders:list:*');
    return order;
  },

  async getOrder(id, useCache = true) {
    const cacheKey = `order:${id}`;
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }
    const order = await Order.findById(id);
    if (order && useCache) {
      await cacheService.set(cacheKey, order, 300);
    }
    return order;
  },

  async updateOrderStatus(id, status) {
    const order = await Order.updateStatus(id, status);
    await cacheService.del(`order:${id}`);
    return order;
  },

  async listOrders(limit = 50, offset = 0, filters = {}) {
    return await Order.list(limit, offset, filters);
  },

  async getOrderItems(orderId) {
    return await Order.getOrderItems(orderId);
  },

  async getOrdersByDateRange(startDate, endDate) {
    return await Order.getOrdersByDateRange(startDate, endDate);
  },

  async getDailySales(date) {
    return await Order.getDailySales(date);
  },

  async getSalesSummary(startDate, endDate) {
    const summary = await Order.getSalesSummary(startDate, endDate);
    return {
      ...summary,
      exchange_rates: PriceService.getExchangeRates(),
    };
  },

  // Payments
  async createPayment(paymentData) {
    const payment = await Payment.create(paymentData);
    return payment;
  },

  async updatePaymentStatus(id, status) {
    return await Payment.updateStatus(id, status);
  },

  async getOrderPayments(orderId) {
    return await Payment.findByOrder(orderId);
  },

  calculatePrices(basePrice, currency) {
    return PriceService.calculatePrices(basePrice, currency);
  },

  convertPrice(amount, fromCurrency, toCurrency) {
    return PriceService.convertPrice(amount, fromCurrency, toCurrency);
  },

  getSupportedCurrencies() {
    return config.currencies.supported;
  },
};

module.exports = SalesService;
