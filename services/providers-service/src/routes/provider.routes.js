const express = require('express');
const { body, param, validationResult } = require('express-validator');
const providerController = require('../controllers/provider.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/', providerController.listProviders);
router.get('/search', providerController.searchProviders);

router.get('/:id', [param('id').isUUID().withMessage('Valid UUID required')], validateRequest, providerController.getProvider);

router.post('/', authenticate, authorize('admin', 'manager'), [
  body('company_name').trim().notEmpty().withMessage('company_name required'),
  body('contact_name').optional().trim(),
  body('contact_id').optional().trim(),
  body('phone').optional().trim(),
], validateRequest, providerController.createProvider);

router.put('/:id', authenticate, authorize('admin', 'manager'), [param('id').isUUID().withMessage('Valid UUID required')], validateRequest, providerController.updateProvider);

router.delete('/:id', authenticate, authorize('admin'), [param('id').isUUID().withMessage('Valid UUID required')], validateRequest, providerController.deleteProvider);

// Products by provider
router.get('/:id/products', [param('id').isUUID().withMessage('Valid UUID required')], validateRequest, providerController.getProviderProducts);
router.post('/:id/products', authenticate, authorize('admin','manager'), [param('id').isUUID().withMessage('Valid UUID required'), body('name').trim().notEmpty().withMessage('name required'), body('price').isFloat().withMessage('price required')], validateRequest, providerController.addProviderProduct);
router.put('/:id/products/:productId', authenticate, authorize('admin','manager'), [param('id').isUUID(), param('productId').isUUID()], validateRequest, providerController.updateProviderProduct);
router.delete('/:id/products/:productId', authenticate, authorize('admin'), [param('id').isUUID(), param('productId').isUUID()], validateRequest, providerController.deleteProviderProduct);

module.exports = router;
