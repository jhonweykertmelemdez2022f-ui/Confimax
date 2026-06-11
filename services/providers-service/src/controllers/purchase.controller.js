const purchaseService = require('../services/purchase.service');

const recordPurchase = async (req, res, next) => {
  try {
    const providerId = req.params.providerId;
    const data = req.body;
    const created = await purchaseService.recordPurchase(providerId, data, req.user);
    res.status(201).json(created);
  } catch (err) { next(err); }
};

const listPurchases = async (req, res, next) => {
  try {
    const purchases = await purchaseService.listPurchases(req.query);
    res.json(purchases);
  } catch (err) { next(err); }
};

const getExpiringPurchases = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const purchases = await purchaseService.getExpiringPurchases(days);
    res.json(purchases);
  } catch (err) { next(err); }
};

module.exports = { recordPurchase, listPurchases, getExpiringPurchases };
