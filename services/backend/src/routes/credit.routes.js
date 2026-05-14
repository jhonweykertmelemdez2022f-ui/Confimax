const express = require('express');
const customersController = require('../controllers/customers.controller');

const router = express.Router();

// Credits
router.post('/', customersController.createCredit);

module.exports = router;
