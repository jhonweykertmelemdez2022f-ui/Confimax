const CustomersService = require('../../src/services/customers.service');
const { Customer, Credit } = require('../../src/models/customer.model');

jest.mock('../../src/models/customer.model', () => ({
  Customer: {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  },
  Credit: {
    findByCustomer: jest.fn(),
    create: jest.fn(),
  },
}));

describe('CustomersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomer', () => {
    it('should return customer by id', async () => {
      const mockCustomer = { id: 1, name: 'Customer 1', rif: 'J-123456789' };
      Customer.findById.mockResolvedValue(mockCustomer);

      const result = await CustomersService.getCustomer(1);

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const customerData = { name: 'New Customer', rif: 'J-987654321' };
      const mockCreated = { id: 1, ...customerData };

      Customer.create.mockResolvedValue(mockCreated);

      const result = await CustomersService.createCustomer(customerData);

      expect(result).toEqual(mockCreated);
    });
  });

  describe('updateCustomer', () => {
    it('should update a customer', async () => {
      const updateData = { name: 'Updated Customer' };
      const mockUpdated = { id: 1, ...updateData };

      Customer.update.mockResolvedValue(mockUpdated);

      const result = await CustomersService.updateCustomer(1, updateData);

      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      Customer.delete.mockResolvedValue(true);

      await CustomersService.deleteCustomer(1);

      expect(Customer.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('listCustomers', () => {
    it('should list customers with search', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A' },
        { id: 2, name: 'Customer B' },
      ];

      Customer.list.mockResolvedValue(mockCustomers);

      const result = await CustomersService.listCustomers(50, 0, 'Customer');

      expect(result).toEqual(mockCustomers);
      expect(Customer.list).toHaveBeenCalledWith(50, 0, 'Customer');
    });
  });

  describe('getCustomerCredits', () => {
    it('should return customer credits', async () => {
      const mockCredits = [
        { id: 1, customer_id: 1, amount: 500 },
        { id: 2, customer_id: 1, amount: 300 },
      ];

      Credit.findByCustomer.mockResolvedValue(mockCredits);

      const result = await CustomersService.getCustomerCredits(1);

      expect(result).toEqual(mockCredits);
    });
  });

  describe('createCredit', () => {
    it('should create a credit record', async () => {
      const creditData = { customer_id: 1, amount: 1000, balance: 1000 };
      const mockCreated = { id: 1, ...creditData };

      Credit.create.mockResolvedValue(mockCreated);

      const result = await CustomersService.createCredit(creditData);

      expect(result).toEqual(mockCreated);
    });
  });
});
