const express = require('express');
const salesController = require('../controllers/sales.controller');
const { authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/summary/daily', authorize('admin', 'vendor'), salesController.getDailySummary);
router.get('/:id', authorize('admin', 'vendor'), salesController.getSale);
router.get('/', authorize('admin', 'vendor'), salesController.listSales);
router.post('/', authorize('admin', 'vendor'), salesController.createSale);
router.patch('/:id/status', authorize('admin', 'vendor'), salesController.updateSaleStatus);

module.exports = router;
