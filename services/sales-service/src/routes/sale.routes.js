const express = require('express');
const { body, param, validationResult, query } = require('express-validator');
const saleController = require('../controllers/sale.controller');
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'vendor'),
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.product_id').isUUID().withMessage('Valid product_id required'),
    body('items.*.sku').trim().notEmpty().withMessage('SKU required'),
    body('items.*.product_name').trim().notEmpty().withMessage('Product name required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
    body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('customer_id').optional().isUUID().withMessage('Valid customer_id required'),
  ],
  validateRequest,
  saleController.createOrder
);

router.post(
  '/customer',
  authenticate,
  authorize('customer'),
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.product_id').isUUID().withMessage('Valid product_id required'),
    body('items.*.sku').trim().notEmpty().withMessage('SKU required'),
    body('items.*.product_name').trim().notEmpty().withMessage('Product name required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
    body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Valid price required'),
  ],
  validateRequest,
  saleController.createCustomerOrder
);

router.get(
  '/',
  saleController.listOrders
);

router.get(
  '/date-range',
  saleController.getSalesByDateRange
);

router.get(
  '/daily',
  saleController.getDailySales
);

router.get(
  '/summary',
  saleController.getSalesSummary
);

router.get(
  '/exchange-rates',
  saleController.getExchangeRates
);

router.get(
  '/convert',
  saleController.convertPrice
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  saleController.getOrder
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'manager', 'vendor', 'vendedor'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
    body('status').isIn(['pendiente', 'entregado', 'cancelado', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  ],
  validateRequest,
  saleController.updateOrderStatus
);

router.get(
  '/:id/items',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  saleController.getOrderItems
);

router.get(
  '/:id/payments',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  paymentController.getOrderPayments
);

router.post(
  '/payments',
  authenticate,
  authorize('admin', 'manager', 'vendor', 'vendedor', 'customer', 'cliente'),
  [
    body('order_id').isUUID().withMessage('Valid order_id required'),
    body('payment_method').isIn(['card', 'cash', 'transfer', 'paypal', 'other']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  ],
  validateRequest,
  paymentController.createPayment
);

router.patch(
  '/payments/:id/status',
  authenticate,
  authorize('admin', 'manager', 'vendor', 'vendedor'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
    body('status').isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
  ],
  validateRequest,
  paymentController.updatePaymentStatus
);

module.exports = router;
