const InventoryService = require('../../src/services/inventory.service');
const { Product, Category } = require('../../src/models/product.model');

jest.mock('../../src/models/product.model', () => ({
  Product: {
    findById: jest.fn(),
    findBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  },
  Category: {
    list: jest.fn(),
    create: jest.fn(),
  },
}));

describe('InventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProduct', () => {
    it('should return product by id', async () => {
      const mockProduct = { id: 1, name: 'Product 1', sku: 'SKU001' };
      Product.findById.mockResolvedValue(mockProduct);

      const result = await InventoryService.getProduct(1);

      expect(result).toEqual(mockProduct);
      expect(Product.findById).toHaveBeenCalledWith(1);
    });

    it('should return null if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      const result = await InventoryService.getProduct(999);

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        sku: 'SKU002',
        unit_price: 100,
      };

      const mockCreated = { id: 2, ...productData };
      Product.create.mockResolvedValue(mockCreated);

      const result = await InventoryService.createProduct(productData);

      expect(result).toEqual(mockCreated);
      expect(Product.create).toHaveBeenCalledWith(productData);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updateData = { name: 'Updated Product', unit_price: 150 };
      const mockUpdated = { id: 1, ...updateData };

      Product.update.mockResolvedValue(mockUpdated);

      const result = await InventoryService.updateProduct(1, updateData);

      expect(result).toEqual(mockUpdated);
      expect(Product.update).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      Product.delete.mockResolvedValue(true);

      await InventoryService.deleteProduct(1);

      expect(Product.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('listProducts', () => {
    it('should list products with filters', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];

      Product.list.mockResolvedValue(mockProducts);

      const result = await InventoryService.listProducts(50, 0, { category_id: 1 });

      expect(result).toEqual(mockProducts);
      expect(Product.list).toHaveBeenCalledWith(50, 0, { category_id: 1 });
    });
  });

  describe('listCategories', () => {
    it('should list all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ];

      Category.list.mockResolvedValue(mockCategories);

      const result = await InventoryService.listCategories();

      expect(result).toEqual(mockCategories);
      expect(Category.list).toHaveBeenCalled();
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const categoryData = { name: 'New Category', description: 'Description' };
      const mockCreated = { id: 1, ...categoryData };

      Category.create.mockResolvedValue(mockCreated);

      const result = await InventoryService.createCategory(categoryData);

      expect(result).toEqual(mockCreated);
      expect(Category.create).toHaveBeenCalledWith(categoryData);
    });
  });
});
