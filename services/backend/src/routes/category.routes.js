const express = require('express');
const inventoryController = require('../controllers/inventory.controller');

const router = express.Router();

// Categories
router.get('/', inventoryController.listCategories);
router.get('/:id', inventoryController.getCategory);
router.post('/', inventoryController.createCategory);
router.patch('/:id', inventoryController.updateCategory);
router.delete('/:id', inventoryController.deleteCategory);

module.exports = router;
