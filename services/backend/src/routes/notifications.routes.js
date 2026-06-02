const express = require('express');
const notificationsController = require('../controllers/notifications.controller');
const { authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authorize('admin', 'vendor'), notificationsController.list);
router.post('/', authorize('admin', 'vendor'), notificationsController.create);
router.patch('/:id/read', authorize('admin', 'vendor', 'customer'), notificationsController.markRead);
router.post('/read-all', authorize('admin', 'vendor', 'customer'), notificationsController.markAllRead);
router.delete('/:id', authorize('admin'), notificationsController.deleteNotification);
router.get('/unread/:user_id', authorize('admin'), notificationsController.unreadCount);

module.exports = router;
