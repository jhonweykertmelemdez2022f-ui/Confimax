const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authorize } = require('../middleware/auth.middleware');

router.get('/', authorize('admin'), auditController.getLogs);
router.get('/user/:userId', authorize('admin'), auditController.getUserActivity);

module.exports = router;
