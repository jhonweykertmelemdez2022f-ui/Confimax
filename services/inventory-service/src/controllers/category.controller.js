const InventoryService = require('../services/inventory.service');

const categoryController = {
  async getCategory(req, res, next) {
    try {
      const categories = await InventoryService.getCategories();
      
      const category = categories.find(c => c.id === req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await InventoryService.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  },

  async getCategoryTree(req, res, next) {
    try {
      const tree = await InventoryService.getCategoryTree();
      res.json(tree);
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const category = await InventoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await InventoryService.updateCategory(id, req.body);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await InventoryService.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = categoryController;
