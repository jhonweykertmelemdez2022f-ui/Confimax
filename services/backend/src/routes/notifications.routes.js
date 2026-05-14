const express = require('express');
const notificationsController = require('../controllers/notifications.controller');

const router = express.Router();

router.get('/', notificationsController.list);
router.post('/', notificationsController.create);
router.patch('/:id/read', notificationsController.markRead);
router.post('/read-all', notificationsController.markAllRead);
router.delete('/:id', notificationsController.deleteNotification);
router.get('/unread/:user_id', notificationsController.unreadCount);

module.exports = router;
