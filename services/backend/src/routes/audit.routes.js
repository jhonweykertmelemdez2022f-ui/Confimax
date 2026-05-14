const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');

router.get('/', auditController.getLogs);
router.get('/user/:userId', auditController.getUserActivity);

module.exports = router;
