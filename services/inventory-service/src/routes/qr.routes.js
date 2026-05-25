const express = require('express');
const qrController = require('../controllers/qr.controller');

const router = express.Router();

router.get('/generate', qrController.generateQrCode);

module.exports = router;
