const express = require('express');
const { body, param, validationResult } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('type').isIn(['stock_low', 'stock_expiring', 'credit_expiring', 'credit_overdue', 'system']).withMessage('Invalid type'),
    body('title').trim().notEmpty().withMessage('Title required'),
    body('message').trim().notEmpty().withMessage('Message required'),
    body('user_id').notEmpty().withMessage('user_id required'),
  ],
  validateRequest,
  notificationController.createNotification
);

router.get(
  '/user/:user_id',
  notificationController.getNotifications
);

router.get(
  '/user/:user_id/count',
  notificationController.getUnreadCount
);

router.patch(
  '/:id/read',
  notificationController.markAsRead
);

router.post(
  '/read-all',
  authenticate,
  authorize('admin', 'manager'),
  notificationController.markAllAsRead
);

router.delete(
  '/:id',
  notificationController.deleteNotification
);

router.get(
  '/settings/:user_id',
  notificationController.getSettings
);

router.put(
  '/settings/:user_id',
  authenticate,
  notificationController.updateSettings
);

module.exports = router;
