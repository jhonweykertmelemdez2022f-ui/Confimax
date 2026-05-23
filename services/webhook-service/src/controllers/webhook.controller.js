const webhookController = {
  async handleSaleCreated(req, res) {
    try {
      const sale = req.body;
      console.log('[Webhook] Venta creada:', sale.id);
      
      res.status(200).json({ success: true, message: 'Sale created webhook received' });
    } catch (error) {
      console.error('[Webhook Error]:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  },

  async handleLowStock(req, res) {
    try {
      const product = req.body;
      console.log('[Webhook] Stock bajo:', product.sku);
      
      res.status(200).json({ success: true, message: 'Low stock webhook received' });
    } catch (error) {
      console.error('[Webhook Error]:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  },

  async handleCustomerCreated(req, res) {
    try {
      const customer = req.body;
      console.log('[Webhook] Cliente creado:', customer.id);
      
      res.status(200).json({ success: true, message: 'Customer created webhook received' });
    } catch (error) {
      console.error('[Webhook Error]:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  },

  async handleTest(req, res) {
    try {
      console.log('[Webhook] Test webhook received');
      res.status(200).json({ success: true, message: 'Test webhook received successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[Webhook Error]:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  },

  async healthCheck(req, res) {
    res.status(200).json({
      status: 'ok',
      service: 'webhook-service',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = webhookController;