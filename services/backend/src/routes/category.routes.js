const express = require('express');
const inventoryController = require('../controllers/inventory.controller');

const router = express.Router();

// Categories
router.get('/', inventoryController.listCategories);
router.post('/', inventoryController.createCategory);

module.exports = router;
