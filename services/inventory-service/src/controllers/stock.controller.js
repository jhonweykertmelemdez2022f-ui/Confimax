const InventoryService = require('../services/inventory.service');
const axios = require('axios');

// Helper para enviar notificación de stock bajo
const notifyStockLow = async (req, stock) => {
  try {
    const notificationsUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';
    const authHeader = req.headers.authorization;
    
    // Obtener información del producto para el nombre y estado
    const product = await InventoryService.getProduct(stock.product_id);
    
    // Solo notificar si el producto existe y está activo
    if (!product || product.is_active === false) {
      return;
    }
    
    await axios.post(`${notificationsUrl}/`, {
      type: 'stock_low',
      title: 'Alerta: Stock Bajo',
      message: `El producto "${product ? product.name : stock.product_id}" tiene stock bajo (${stock.quantity} unidades).`,
      user_id: req.user ? req.user.id : '00000000-0000-0000-0000-000000000000'
    }, {
      headers: { 'Authorization': authHeader }
    });
  } catch (err) {
    console.error('[INVENTORY] Error enviando notificación de stock bajo:', err.message);
  }
};

const stockController = {
  async getStock(req, res, next) {
    try {
      const stock = await InventoryService.getStock(req.params.id);
      if (!stock) return res.status(404).json({ message: 'Stock not found' });
      res.json(stock);
    } catch (e) { next(e); }
  },
  async getStockByProduct(req, res, next) {
    try { res.json(await InventoryService.getStockByProduct(req.params.productId)); }
    catch (e) { next(e); }
  },
  async getStockByLocation(req, res, next) {
    try { res.json(await InventoryService.getStockByLocation(decodeURIComponent(req.params.location))); }
    catch (e) { next(e); }
  },
  async listAllStock(req, res, next) {
    try { res.json(await InventoryService.listAllStock()); }
    catch (e) { next(e); }
  },
  async getLowStock(req, res, next) {
    try { 
      const threshold = req.query.threshold ? parseInt(req.query.threshold, 10) : null;
      res.json(await InventoryService.getLowStock(threshold)); 
    }
    catch (e) { next(e); }
  },
  async createStock(req, res, next) {
    try { res.status(201).json(await InventoryService.createStock(req.body)); }
    catch (e) { next(e); }
  },
  async updateStock(req, res, next) {
    try {
      const stock = await InventoryService.updateStock(req.params.id, req.body);
      if (!stock) return res.status(404).json({ message: 'Stock not found' });
      
      // Enviar notificación si el stock es bajo
      if (stock.quantity <= (stock.min_quantity || 10)) {
        await notifyStockLow(req, stock);
      }
      
      res.json(stock);
    } catch (e) { next(e); }
  },
  async adjustStockQuantity(req, res, next) {
    try {
      const stock = await InventoryService.adjustStockQuantity(req.params.id, req.body.quantity);
      if (!stock) return res.status(404).json({ message: 'Stock not found' });
      
      // Enviar notificación si el stock es bajo después del ajuste
      if (stock.quantity <= (stock.min_quantity || 10)) {
        await notifyStockLow(req, stock);
      }
      
      res.json(stock);
    } catch (e) { next(e); }
  },
  async deleteStock(req, res, next) {
    try { await InventoryService.deleteStock(req.params.id); res.status(204).send(); }
    catch (e) { next(e); }
  },
};

module.exports = stockController;
