const express = require('express');
const customersController = require('../controllers/customers.controller');

const router = express.Router();

// Customers
router.get('/', customersController.listCustomers);
router.get('/:id', customersController.getCustomer);
router.post('/', customersController.createCustomer);
router.patch('/:id', customersController.updateCustomer);
router.delete('/:id', customersController.deleteCustomer);
router.get('/:id/credits', customersController.getCustomerCredits);

module.exports = router;
