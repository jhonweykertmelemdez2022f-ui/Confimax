const { Sale } = require('../models/sale.model');
const { getOrSet, invalidate, invalidatePattern } = require('./cache.service');

const CACHE_TTL = {
  SALE: 300,
  SALES_LIST: 60,
  DAILY_SUMMARY: 120,
};

const SalesService = {
  async getSale(id) {
    return getOrSet(
      `sale:${id}`,
      () => Sale.findById(id),
      CACHE_TTL.SALE
    );
  },

  async createSale(data, items) {
    const sale = await Sale.create(data, items);
    if (sale) {
      await invalidatePattern('sales:list:*');
      const today = new Date().toISOString().split('T')[0];
      await invalidate(`sales:summary:${today}`);
    }
    return sale;
  },

  async updateSaleStatus(id, status) {
    const sale = await Sale.updateStatus(id, status);
    if (sale) {
      await invalidate(`sale:${id}`);
      await invalidatePattern('sales:list:*');
    }
    return sale;
  },

  async listSales(limit, offset, filters) {
    const filterKey = JSON.stringify(filters || {});
    const cacheKey = `sales:list:${limit}:${offset}:${filterKey}`;
    return getOrSet(
      cacheKey,
      () => Sale.list(limit, offset, filters),
      CACHE_TTL.SALES_LIST
    );
  },

  async getDailySummary(date) {
    return getOrSet(
      `sales:summary:${date}`,
      () => Sale.dailySummary(date),
      CACHE_TTL.DAILY_SUMMARY
    );
  },

  async invalidateSaleCache(id) {
    await invalidate(`sale:${id}`);
    await invalidatePattern('sales:list:*');
  },
};

module.exports = SalesService;
