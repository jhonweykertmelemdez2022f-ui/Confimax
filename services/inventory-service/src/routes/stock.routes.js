const express = require('express');
const { body, param, validationResult } = require('express-validator');
const stockController = require('../controllers/stock.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get(
  '/',
  stockController.listAllStock
);

router.get(
  '/low-stock',
  authenticate,
  authorize('admin', 'manager'),
  stockController.getLowStock
);

router.get(
  '/product/:productId',
  [
    param('productId').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  stockController.getStockByProduct
);

router.get(
  '/location/:location',
  stockController.getStockByLocation
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  stockController.getStock
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('product_id').isUUID().withMessage('Valid product UUID required'),
    body('location').trim().notEmpty().withMessage('Location required'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Valid quantity required'),
  ],
  validateRequest,
  stockController.createStock
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  stockController.updateStock
);

router.patch(
  '/:id/adjust',
  authenticate,
  authorize('admin', 'manager', 'vendor'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
    body('quantity').isInt().withMessage('Valid quantity required'),
  ],
  validateRequest,
  stockController.adjustStockQuantity
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  stockController.deleteStock
);

module.exports = router;
