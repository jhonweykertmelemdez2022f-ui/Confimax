const InventoryService = require('../services/inventory.service');

const inventoryController = {
  async listProducts(req, res, next) {
    try {
      const { limit = 50, offset = 0, category_id, active } = req.query;
      const filters = {};
      if (category_id) filters.category_id = category_id;
      if (active !== undefined) filters.active = active === 'true';
      const products = await InventoryService.listProducts(parseInt(limit), parseInt(offset), filters);
      res.json(products);
    } catch (e) { next(e); }
  },

  async getProduct(req, res, next) {
    try {
      const product = await InventoryService.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (e) { next(e); }
  },

  async createProduct(req, res, next) {
    try {
      const product = await InventoryService.createProduct(req.body);
      res.status(201).json(product);
    } catch (e) { next(e); }
  },

  async updateProduct(req, res, next) {
    try {
      const product = await InventoryService.updateProduct(req.params.id, req.body);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (e) { next(e); }
  },

  async deleteProduct(req, res, next) {
    try {
      await InventoryService.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (e) { next(e); }
  },

  async listCategories(req, res, next) {
    try { res.json(await InventoryService.listCategories()); }
    catch (e) { next(e); }
  },

  async createCategory(req, res, next) {
    try { res.status(201).json(await InventoryService.createCategory(req.body)); }
    catch (e) { next(e); }
  },
};

module.exports = inventoryController;
