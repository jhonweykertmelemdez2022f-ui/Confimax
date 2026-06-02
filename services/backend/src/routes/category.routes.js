const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Categories
router.get('/', authenticate, authorize('admin', 'vendor'), inventoryController.listCategories);
router.get('/:id', authenticate, authorize('admin', 'vendor'), inventoryController.getCategory);
router.post('/', authenticate, authorize('admin', 'vendor'), inventoryController.createCategory);
router.patch('/:id', authenticate, authorize('admin', 'vendor'), inventoryController.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), inventoryController.deleteCategory);

module.exports = router;
