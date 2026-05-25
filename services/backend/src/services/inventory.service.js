const { Product, Category } = require('../models/product.model');
const { getOrSet, invalidate, invalidatePattern } = require('./cache.service');

const CACHE_TTL = {
  PRODUCT: 300,
  PRODUCTS_LIST: 60,
  CATEGORIES: 300,
};

const InventoryService = {
  async getProduct(id) {
    return getOrSet(
      `product:${id}`,
      () => Product.findById(id),
      CACHE_TTL.PRODUCT
    );
  },

  async createProduct(data) {
    const product = await Product.create(data);
    await invalidatePattern('products:list:*');
    return product;
  },

  async updateProduct(id, data) {
    const product = await Product.update(id, data);
    if (product) {
      await invalidate(`product:${id}`);
      await invalidatePattern('products:list:*');
    }
    return product;
  },

  async deleteProduct(id) {
    const result = await Product.delete(id);
    await invalidate(`product:${id}`);
    await invalidatePattern('products:list:*');
    return result;
  },

  async listProducts(limit, offset, filters) {
    const filterKey = JSON.stringify(filters || {});
    const cacheKey = `products:list:${limit}:${offset}:${filterKey}`;
    return getOrSet(
      cacheKey,
      () => Product.list(limit, offset, filters),
      CACHE_TTL.PRODUCTS_LIST
    );
  },

  async listCategories() {
    return getOrSet(
      'categories:list',
      () => Category.list(),
      CACHE_TTL.CATEGORIES
    );
  },

  async createCategory(data) {
    const category = await Category.create(data);
    await invalidate('categories:list');
    return category;
  },

  async getCategory(id) {
    return getOrSet(
      `category:${id}`,
      () => Category.findById(id),
      CACHE_TTL.CATEGORIES
    );
  },

  async updateCategory(id, data) {
    const category = await Category.update(id, data);
    if (category) {
      await invalidate(`category:${id}`);
      await invalidate('categories:list');
    }
    return category;
  },

  async deleteCategory(id) {
    const result = await Category.remove(id);
    await invalidate(`category:${id}`);
    await invalidate('categories:list');
    return result;
  },

  async invalidateProductCache(id) {
    await invalidate(`product:${id}`);
    await invalidatePattern('products:list:*');
  },

  async getAllProducts() {
    return getOrSet(
      'products:all',
      () => Product.getAll(),
      CACHE_TTL.PRODUCTS_LIST // Use a relevant TTL, or define a new one if needed
    );
  },
};

module.exports = InventoryService;
