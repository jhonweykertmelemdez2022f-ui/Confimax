const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Products
router.get('/', inventoryController.listProducts);
router.get('/:id', inventoryController.getProduct);
router.post('/', authorize('admin', 'vendor'), inventoryController.createProduct);
router.patch('/:id', authorize('admin', 'vendor'), inventoryController.updateProduct);
router.delete('/:id', authorize('admin'), inventoryController.deleteProduct);

module.exports = router;
