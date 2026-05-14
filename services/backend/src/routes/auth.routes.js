const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.get('/users', authenticate, authController.listUsers);
router.patch('/users/:id', authenticate, authController.updateUser);

module.exports = router;
