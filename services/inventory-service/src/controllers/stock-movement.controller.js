const InventoryService = require('../services/inventory.service');

const stockMovementController = {
  async getMovement(req, res, next) {
    try {
      const { id } = req.params;
      const movement = await InventoryService.getStockMovement(id);
      if (!movement) {
        return res.status(404).json({ message: 'Stock movement not found' });
      }
      res.json(movement);
    } catch (error) {
      next(error);
    }
  },

  async getMovementsByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const movements = await InventoryService.getStockMovementsByProduct(productId);
      res.json(movements);
    } catch (error) {
      next(error);
    }
  },

  async listMovements(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const movements = await InventoryService.listStockMovements(parseInt(limit), parseInt(offset));
      res.json(movements);
    } catch (error) {
      next(error);
    }
  },

  async createMovement(req, res, next) {
    try {
      const movement = await InventoryService.createStockMovement(req.body);
      res.status(201).json(movement);
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const { productId } = req.params;
      const stats = await InventoryService.getStockMovementStats(productId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = stockMovementController;
