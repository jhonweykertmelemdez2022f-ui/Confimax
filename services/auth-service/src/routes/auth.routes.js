const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service', db: 'connected' });
});

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'vendor', 'manager']).withMessage('Invalid role'),
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validateRequest,
  authController.login
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token required'),
  ],
  validateRequest,
  authController.refreshToken
);

router.post(
  '/logout',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token required'),
  ],
  validateRequest,
  authController.logout
);

router.post(
  '/change-password',
  [
    body('oldPassword').notEmpty().withMessage('Old password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validateRequest,
  authController.changePassword
);

router.get(
  '/me',
  authController.getCurrentUser
);

module.exports = router;
