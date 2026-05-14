const express = require('express');
const salesController = require('../controllers/sales.controller');

const router = express.Router();

router.get('/summary/daily', salesController.getDailySummary);
router.get('/:id', salesController.getSale);
router.get('/', salesController.listSales);
router.post('/', salesController.createSale);
router.patch('/:id/status', salesController.updateSaleStatus);

module.exports = router;
