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
      // Obtenemos los datos del token
      const tokenUserId = req.user?.id || req.user?.sub || req.user?.userId;
      if (!tokenUserId) return res.status(401).json({ message: 'User ID missing in token' });
      
      const email = req.user?.email || req.body.email;
      const name = req.user?.username || req.user?.name || 'Cliente App';
      let finalCustomerId = null;

      // Sincronizar con el CRM (customers.customers)
      if (email) {
        try {
          const { pool } = require('../models/sale.model');
          const result = await pool.query('SELECT id FROM customers.customers WHERE email = $1 LIMIT 1', [email]);
          
          if (result.rows[0]) {
            finalCustomerId = result.rows[0].id;
          } else {
            const newCustomer = await pool.query(
              'INSERT INTO customers.customers (name, email) VALUES ($1, $2) RETURNING id',
              [name, email]
            );
            finalCustomerId = newCustomer.rows[0].id;
          }
        } catch (err) {
          console.log('[SALES] Could not sync with CRM:', err.message);
        }
      }

      const payload = { 
        ...req.body, 
        user_id: null,               // No usamos profiles (user_id)
        customer_id: finalCustomerId,// Usamos el ID del CRM
        notes: req.body.notes ? `${req.body.notes} | Cliente Web/App ID: ${tokenUserId}` : `Cliente Web/App ID: ${tokenUserId}`
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
