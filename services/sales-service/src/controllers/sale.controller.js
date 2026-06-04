const SalesService = require('../services/sales.service');
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
    console.error('[SALES] Failed to send audit log:', err.message);
  }
};

const saleController = {
  async createOrder(req, res, next) {
    try { 
      const order = await SalesService.createOrder(req.body);
      await sendAudit(req, 'CREATE', 'Sale', order.id, order);
      res.status(201).json(order); 
    }
    catch (e) { next(e); }
  },
  async createCustomerOrder(req, res, next) {
    try { 
      // Force user_id to be the logged in user
      const customerId = req.user?.id || req.user?.sub || req.user?.userId;
      if (!customerId) return res.status(401).json({ message: 'User ID missing in token' });
      
      const payload = { 
        ...req.body, 
        user_id: customerId, // Customers from mobile app are users (profiles), not CRM customers
        customer_id: null    // So we leave customer_id null to avoid Foreign Key violations
      };
      const order = await SalesService.createOrder(payload);
      await sendAudit(req, 'CREATE', 'CustomerSale', order.id, order);
      res.status(201).json(order); 
    }
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
      const id = req.params.id;
      const oldOrder = await SalesService.getOrder(id, false);
      const order = await SalesService.updateOrderStatus(id, req.body.status);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      await sendAudit(req, 'UPDATE', 'Sale', order.id, order, oldOrder);
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
