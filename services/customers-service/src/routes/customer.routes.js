const express = require('express');
const { body, param, validationResult } = require('express-validator');
const customerController = require('../controllers/customer.controller');
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
  customerController.listCustomers
);

router.get(
  '/search',
  customerController.searchCustomers
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  customerController.getCustomer
);

router.get(
  '/:id/debt',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  customerController.getCustomerDebt
);

router.get(
  '/:id/credits',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  customerController.getCustomerCredits
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('rif').trim().notEmpty().withMessage('RIF required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('credit_limit').optional().isFloat({ min: 0 }).withMessage('Valid credit limit required'),
  ],
  validateRequest,
  customerController.createCustomer
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  customerController.updateCustomer
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  customerController.deleteCustomer
);

module.exports = router;
