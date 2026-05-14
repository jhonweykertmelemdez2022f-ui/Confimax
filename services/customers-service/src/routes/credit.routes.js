const express = require('express');
const { body, param, validationResult } = require('express-validator');
const creditController = require('../controllers/credit.controller');
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
  authenticate,
  authorize('admin', 'manager'),
  creditController.listCredits
);

router.get(
  '/expiring',
  authenticate,
  authorize('admin', 'manager'),
  creditController.getExpiringCredits
);

router.get(
  '/overdue',
  authenticate,
  authorize('admin', 'manager'),
  creditController.getOverdueCredits
);

router.get(
  '/summary',
  authenticate,
  authorize('admin', 'manager'),
  creditController.getTotalReceivable
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  creditController.getCredit
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'vendor'),
  [
    body('customer_id').isUUID().withMessage('Valid customer_id required'),
    body('sale_id').optional().isUUID().withMessage('Valid sale_id required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('currency').optional().isIn(['USD', 'VES', 'COP']).withMessage('Invalid currency'),
    body('payment_due_date').optional().isISO8601().withMessage('Valid date required'),
  ],
  validateRequest,
  creditController.createCredit
);

router.post(
  '/:id/payment',
  authenticate,
  authorize('admin', 'manager'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('payment_method').optional().isIn(['cash', 'transfer', 'check', 'card']).withMessage('Invalid method'),
  ],
  validateRequest,
  creditController.addPayment
);

module.exports = router;
