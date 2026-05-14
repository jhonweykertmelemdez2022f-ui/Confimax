const express = require('express');
const { body, param, validationResult } = require('express-validator');
const categoryController = require('../controllers/category.controller');
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
  categoryController.getCategories
);

router.get(
  '/tree',
  categoryController.getCategoryTree
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  categoryController.getCategory
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name required'),
  ],
  validateRequest,
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
    body('name').optional().trim().notEmpty().withMessage('Name required'),
  ],
  validateRequest,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Valid UUID required'),
  ],
  validateRequest,
  categoryController.deleteCategory
);

module.exports = router;
