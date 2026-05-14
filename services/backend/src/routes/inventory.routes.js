const express = require('express');
const inventoryController = require('../controllers/inventory.controller');

const router = express.Router();

// Products
router.get('/', inventoryController.listProducts);
router.get('/:id', inventoryController.getProduct);
router.post('/', inventoryController.createProduct);
router.patch('/:id', inventoryController.updateProduct);
router.delete('/:id', inventoryController.deleteProduct);

module.exports = router;
