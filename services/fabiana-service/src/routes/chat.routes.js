const express = require('express');
const chatController = require('../controllers/chat.controller');
const dbService = require('../services/database.service');
const pdfService = require('../services/pdf.service');

const router = express.Router();

router.post('/chat', chatController.chat);

router.get('/products/pdf', async (req, res) => {
  try {
    console.log('[FABIANA] Generando PDF de productos...');
    const data = await dbService.getDataByRole('cliente');
    const products = data.products || [];
    
    const pdfBuffer = await pdfService.generateProductsPDF(products);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=productos-confimax.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[FABIANA] Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

module.exports = router;
