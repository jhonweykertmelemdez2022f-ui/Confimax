const express = require('express');
const reportController = require('../controllers/report.controller');

const router = express.Router();

router.get('/products-pdf', reportController.getProductsPDF);
router.get('/sales-pdf', reportController.getSalesPDF);
router.get('/customers-pdf', reportController.getCustomersPDF);
router.get('/users-pdf', reportController.getUsersPDF);

module.exports = router;