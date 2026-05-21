const { Product } = require('../models/product.model');
const { Category } = require('../models/category.model');
const { Stock } = require('../models/stock.model');
const { StockMovement } = require('../models/stock-movement.model');
const { cacheService } = require('../services/redis.service');
const config = require('../config');

const InventoryService = {
  // ==================== PRODUCTS ====================
  async getProduct(id, useCache = true) {
    const cacheKey = `product:${id}`;
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }
    const product = await Product.findById(id);
    if (product && useCache) {
      await cacheService.set(cacheKey, product, config.cache.productTTL);
    }
    return product;
  },

  async getProductBySku(sku) {
    return await Product.findBySku(sku);
  },

  async searchProducts(query, limit = 20) {
    return await Product.searchByName(query, limit);
  },

  async searchProductsABC(prefix, limit = 20) {
    return await Product.searchABC(prefix, limit);
  },

  async createProduct(productData) {
    const existingProduct = await Product.findBySku(productData.sku);
    if (existingProduct) {
      throw new Error('SKU  Ya Existe');
    }
    const product = await Product.create(productData);
    await cacheService.delPattern('products:list:*');
    return product;
  },

  async updateProduct(id, productData) {
    const product = await Product.update(id, productData);
    await cacheService.del(`product:${id}`);
    await cacheService.delPattern('products:list:*');
    return product;
  },

  async deleteProduct(id) {
    await Product.delete(id);
    await cacheService.del(`product:${id}`);
    await cacheService.delPattern('products:list:*');
  },

  async listProducts(limit = 50, offset = 0, filters = {}) {
    return await Product.list(limit, offset, filters);
  },

  async getProductTotalStock(productId) {
    return await Product.getTotalStock(productId);
  },

  // ==================== CATEGORIES ====================
  async getCategories() {
    const cacheKey = 'categories:list';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;
    const categories = await Category.list();
    await cacheService.set(cacheKey, categories, config.cache.categoryTTL);
    return categories;
  },

  async getCategoryTree() {
    return await Category.getTree();
  },

  async getCategory(id) {
    return await Category.findById(id);
  },

  async createCategory(categoryData) {
    const existing = await Category.findByName(categoryData.name);
    if (existing) {
      throw new Error('Category name already exists');
    }
    const category = await Category.create(categoryData);
    await cacheService.del('categories:list');
    return category;
  },

  async updateCategory(id, categoryData) {
    const category = await Category.update(id, categoryData);
    await cacheService.del('categories:list');
    return category;
  },

  async deleteCategory(id) {
    await Category.delete(id);
    await cacheService.del('categories:list');
  },

  // ==================== STOCK ====================
  async getStock(id) {
    return await Stock.findById(id);
  },

  async getStockByProduct(productId) {
    return await Stock.listByProduct(productId);
  },

  async getStockByLocation(location) {
    return await Stock.listByLocation(location);
  },

  async listAllStock() {
    return await Stock.listAll();
  },

  async getLowStock() {
    return await Stock.getLowStock();
  },

  async createStock(stockData) {
    const existing = await Stock.findByProductAndLocation(stockData.product_id, stockData.location);
    if (existing) {
      throw new Error('Stock already exists for this product and location');
    }
    return await Stock.create(stockData);
  },

  async updateStock(id, stockData) {
    return await Stock.update(id, stockData);
  },

  async adjustStockQuantity(id, quantity) {
    return await Stock.adjustQuantity(id, quantity);
  },

  async deleteStock(id) {
    await Stock.delete(id);
  },

  // ==================== STOCK MOVEMENTS ====================
  async getStockMovement(id) {
    return await StockMovement.findById(id);
  },

  async getStockMovementsByProduct(productId) {
    return await StockMovement.listByProduct(productId);
  },

  async listStockMovements(limit = 50, offset = 0) {
    return await StockMovement.listAll(limit, offset);
  },

  async createStockMovement(movementData) {
    const client = await StockMovement.pool.connect();
    try {
      await client.query('BEGIN');
      const movement = await StockMovement.create(movementData);
      const stockItem = await Stock.findByProductAndLocation(movementData.product_id, movementData.location);
      if (stockItem) {
        await Stock.adjustQuantity(stockItem.id, movementData.quantity);
      } else if (movementData.quantity > 0) {
        await Stock.create({
          product_id: movementData.product_id,
          location: movementData.location,
          quantity: movementData.quantity,
        });
      }
      await client.query('COMMIT');
      return movement;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getStockMovementStats(productId) {
    return await StockMovement.getStats(productId);
  },

  async getExpiringProducts(daysAhead = 30) {
    return await Product.getExpiring(daysAhead);
  },
};

module.exports = InventoryService;
