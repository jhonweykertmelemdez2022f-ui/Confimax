const SalesService = require('../services/sales.service');

const salesController = {
  async listSales(req, res, next) {
    try {
      const { limit = 50, offset = 0, customer_id, status, start_date, end_date } = req.query;
      const filters = { customer_id, status, start_date, end_date };
      const sales = await SalesService.listSales(parseInt(limit), parseInt(offset), filters);
      res.json(sales);
    } catch (e) { next(e); }
  },

  async getSale(req, res, next) {
    try {
      const sale = await SalesService.getSale(req.params.id);
      if (!sale) return res.status(404).json({ message: 'Sale not found' });
      res.json(sale);
    } catch (e) { next(e); }
  },

  async createSale(req, res, next) {
    try {
      const { items, ...data } = req.body;
      const sale = await SalesService.createSale(data, items);
      res.status(201).json(sale);
    } catch (e) { next(e); }
  },

  async updateSaleStatus(req, res, next) {
    try {
      const sale = await SalesService.updateSaleStatus(req.params.id, req.body.status);
      if (!sale) return res.status(404).json({ message: 'Sale not found' });
      res.json(sale);
    } catch (e) { next(e); }
  },

  async getDailySummary(req, res, next) {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ message: 'date required' });
      res.json(await SalesService.getDailySummary(date));
    } catch (e) { next(e); }
  },
};

module.exports = salesController;
