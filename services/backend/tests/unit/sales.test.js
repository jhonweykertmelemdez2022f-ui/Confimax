const SalesService = require('../../src/services/sales.service');
const { Sale } = require('../../src/models/sale.model');

jest.mock('../../src/models/sale.model', () => ({
  Sale: {
    findById: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    list: jest.fn(),
    dailySummary: jest.fn(),
  },
}));

describe('SalesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSale', () => {
    it('should return sale with items', async () => {
      const mockSale = {
        id: 1,
        total: 1000,
        status: 'completed',
        items: [{ product_id: 1, quantity: 2 }],
      };

      Sale.findById.mockResolvedValue(mockSale);

      const result = await SalesService.getSale(1);

      expect(result).toEqual(mockSale);
      expect(Sale.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('createSale', () => {
    it('should create a sale with items', async () => {
      const saleData = {
        customer_id: 1,
        vendor_id: 2,
        total: 500,
      };

      const items = [
        { product_id: 1, quantity: 2, unit_price: 100, total: 200 },
        { product_id: 2, quantity: 3, unit_price: 100, total: 300 },
      ];

      const mockCreated = { id: 1, ...saleData };

      Sale.create.mockResolvedValue(mockCreated);

      const result = await SalesService.createSale(saleData, items);

      expect(result).toEqual(mockCreated);
      expect(Sale.create).toHaveBeenCalledWith(saleData, items);
    });
  });

  describe('updateSaleStatus', () => {
    it('should update sale status', async () => {
      const mockUpdated = { id: 1, status: 'cancelled' };

      Sale.updateStatus.mockResolvedValue(mockUpdated);

      const result = await SalesService.updateSaleStatus(1, 'cancelled');

      expect(result).toEqual(mockUpdated);
      expect(Sale.updateStatus).toHaveBeenCalledWith(1, 'cancelled');
    });
  });

  describe('listSales', () => {
    it('should list sales with filters', async () => {
      const mockSales = [
        { id: 1, total: 1000 },
        { id: 2, total: 2000 },
      ];

      Sale.list.mockResolvedValue(mockSales);

      const result = await SalesService.listSales(50, 0, { status: 'completed' });

      expect(result).toEqual(mockSales);
      expect(Sale.list).toHaveBeenCalledWith(50, 0, { status: 'completed' });
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary', async () => {
      const mockSummary = { date: '2024-01-15', count: 10, total: 5000 };

      Sale.dailySummary.mockResolvedValue(mockSummary);

      const result = await SalesService.getDailySummary('2024-01-15');

      expect(result).toEqual(mockSummary);
      expect(Sale.dailySummary).toHaveBeenCalledWith('2024-01-15');
    });
  });
});
