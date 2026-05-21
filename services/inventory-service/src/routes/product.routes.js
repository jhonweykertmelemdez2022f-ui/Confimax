const express = require('express');
const { body, param, validationResult } = require('express-validator');
const productController = require('../controllers/product.controller');
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
  productController.listProducts
);

router.get(
  '/search',
  productController.searchProducts
);

router.get(
  '/search-abc',
  productController.searchProductsABC
);

router.get(
  '/sku/:sku',
  productController.getProductBySku
);

router.get(
  '/alerts/expiring',
  authenticate,
  productController.checkExpiringProducts
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  productController.getProduct
);

router.get(
  '/:id/stock',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  productController.getProductStock
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('sku').trim().notEmpty().withMessage('SKU required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  ],
  validateRequest,
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  productController.updateProduct
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  productController.deleteProduct
);

module.exports = router;
