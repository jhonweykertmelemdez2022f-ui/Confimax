const SalesService = require('../services/sales.service');

const paymentController = {
  async createPayment(req, res, next) {
    try { res.status(201).json(await SalesService.createPayment(req.body)); }
    catch (e) { next(e); }
  },
  async updatePaymentStatus(req, res, next) {
    try { res.json(await SalesService.updatePaymentStatus(req.params.id, req.body.status)); }
    catch (e) { next(e); }
  },
  async getOrderPayments(req, res, next) {
    try { res.json(await SalesService.getOrderPayments(req.params.id)); }
    catch (e) { next(e); }
  },
};

module.exports = paymentController;
