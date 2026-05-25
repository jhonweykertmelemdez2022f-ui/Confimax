const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service-monolith', db: 'connected' });
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.get('/users', authenticate, authController.listUsers);
router.post('/users', authenticate, authController.createUser); // Assuming admin can create users
router.patch('/users/:id', authenticate, authController.updateUser);
router.delete('/users/:id', authenticate, authController.deleteUser);

module.exports = router;
