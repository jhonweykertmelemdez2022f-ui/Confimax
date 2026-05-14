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

  async invalidateProductCache(id) {
    await invalidate(`product:${id}`);
    await invalidatePattern('products:list:*');
  },
};

module.exports = InventoryService;
