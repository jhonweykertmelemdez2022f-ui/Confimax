const express = require('express');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.post('/chat', chatController.chat);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

module.exports = router;
