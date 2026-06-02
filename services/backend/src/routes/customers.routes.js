const express = require('express');
const customersController = require('../controllers/customers.controller');
const { authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Customers
router.get('/', authorize('admin', 'vendor'), customersController.listCustomers);
router.get('/:id', authorize('admin', 'vendor'), customersController.getCustomer);
router.post('/', authorize('admin', 'vendor'), customersController.createCustomer);
router.patch('/:id', authorize('admin', 'vendor'), customersController.updateCustomer);
router.delete('/:id', authorize('admin'), customersController.deleteCustomer);
router.get('/:id/credits', authorize('admin', 'vendor'), customersController.getCustomerCredits);

module.exports = router;
