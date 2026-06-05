const InventoryService = require('../services/inventory.service');

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
      res.json(stock);
    } catch (e) { next(e); }
  },
  async adjustStockQuantity(req, res, next) {
    try {
      const stock = await InventoryService.adjustStockQuantity(req.params.id, req.body.quantity);
      if (!stock) return res.status(404).json({ message: 'Stock not found' });
      res.json(stock);
    } catch (e) { next(e); }
  },
  async deleteStock(req, res, next) {
    try { await InventoryService.deleteStock(req.params.id); res.status(204).send(); }
    catch (e) { next(e); }
  },
};

module.exports = stockController;
