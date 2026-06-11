const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const purchaseController = require('../controllers/purchase.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.post('/suppliers/:providerId', authenticate, authorize('admin','manager'), [
  param('providerId').isUUID().withMessage('Valid UUID required'),
  body('total').isFloat().withMessage('total required'),
  body('tax').optional().isFloat(),
  body('due_date').optional().isISO8601().withMessage('valid date required')
], validateRequest, purchaseController.recordPurchase);

router.get('/', authenticate, authorize('admin','manager'), [query('limit').optional().isInt()], validateRequest, purchaseController.listPurchases);

router.get('/expiring', authenticate, authorize('admin','manager'), [query('days').optional().isInt()], validateRequest, purchaseController.getExpiringPurchases);

module.exports = router;
