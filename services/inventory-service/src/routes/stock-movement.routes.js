const express = require('express');
const { body, param, validationResult } = require('express-validator');
const stockMovementController = require('../controllers/stock-movement.controller');
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
  stockMovementController.listMovements
);

router.get(
  '/product/:productId',
  [
    param('productId').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  stockMovementController.getMovementsByProduct
);

router.get(
  '/stats/:productId',
  [
    param('productId').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  stockMovementController.getStats
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  stockMovementController.getMovement
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'vendor'),
  [
    body('product_id').isUUID().withMessage('Valid product UUID required'),
    body('location').trim().notEmpty().withMessage('Location required'),
    body('quantity').isInt().withMessage('Valid quantity required'),
    body('movement_type').isIn(['in', 'out', 'adjustment', 'transfer']).withMessage('Invalid movement type'),
  ],
  validateRequest,
  stockMovementController.createMovement
);

module.exports = router;
