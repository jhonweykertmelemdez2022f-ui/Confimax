const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

router.post('/sales/created', webhookController.handleSaleCreated);
router.post('/inventory/low-stock', webhookController.handleLowStock);
router.post('/customers/created', webhookController.handleCustomerCreated);
router.post('/test', webhookController.handleTest);
router.get('/health', webhookController.healthCheck);

module.exports = router;