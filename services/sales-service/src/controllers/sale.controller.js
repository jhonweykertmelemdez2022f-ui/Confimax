const SalesService = require('../services/sales.service');

const saleController = {
  async createOrder(req, res, next) {
    try { res.status(201).json(await SalesService.createOrder(req.body)); }
    catch (e) { next(e); }
  },
  async getOrder(req, res, next) {
    try {
      const order = await SalesService.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json(order);
    } catch (e) { next(e); }
  },
  async updateOrderStatus(req, res, next) {
    try {
      const order = await SalesService.updateOrderStatus(req.params.id, req.body.status);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json(order);
    } catch (e) { next(e); }
  },
  async listOrders(req, res, next) {
    try {
      const { limit = 50, offset = 0, customer_id, user_id, status, start_date, end_date } = req.query;
      res.json(await SalesService.listOrders(parseInt(limit), parseInt(offset), { customer_id, user_id, status, start_date, end_date }));
    } catch (e) { next(e); }
  },
  async getOrderItems(req, res, next) {
    try { res.json(await SalesService.getOrderItems(req.params.id)); }
    catch (e) { next(e); }
  },
  async getSalesByDateRange(req, res, next) {
    try { res.json(await SalesService.getOrdersByDateRange(req.query.start_date, req.query.end_date)); }
    catch (e) { next(e); }
  },
  async getDailySales(req, res, next) {
    try { res.json(await SalesService.getDailySales(req.query.date)); }
    catch (e) { next(e); }
  },
  async getSalesSummary(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) return res.status(400).json({ message: 'start_date and end_date required' });
      res.json(await SalesService.getSalesSummary(start_date, end_date));
    } catch (e) { next(e); }
  },
  async getExchangeRates(req, res, next) {
    try { res.json(SalesService.getSupportedCurrencies()); }
    catch (e) { next(e); }
  },
  async convertPrice(req, res, next) {
    try {
      const { amount, from, to } = req.query;
      if (!amount || !from || !to) return res.status(400).json({ message: 'amount, from, and to required' });
      res.json({ amount: SalesService.convertPrice(parseFloat(amount), from, to), from, to });
    } catch (e) { next(e); }
  },
};

module.exports = saleController;
