const ReportService = require('../services/report.service');
const InventoryService = require('../services/inventory.service');
const SalesService = require('../services/sales.service');
const CustomersService = require('../services/customers.service'); // Assuming this exists to get customers
const AuthService = require('../services/auth.service'); // Assuming this exists to get users

const reportController = {
  async getProductsPDF(req, res, next) {
    try {
      const products = await InventoryService.getAllProducts(); // Need a method to get all products
      const pdfBuffer = await ReportService.generateProductsPDF(products);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=products-report.pdf');
      res.send(pdfBuffer);
    } catch (e) {
      next(e);
    }
  },

  async getUsersPDF(req, res, next) {
    try {
      const users = await AuthService.getAllUsersForReport();
      const pdfBuffer = await ReportService.generateUsersPDF(users);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=users-report.pdf');
      res.send(pdfBuffer);
    } catch (e) {
      next(e);
    }
  },

  async getCustomersPDF(req, res, next) {
    try {
      const { q } = req.query; // Search query for customers
      const customers = await CustomersService.getAllCustomersForReport(q);
      const pdfBuffer = await ReportService.generateCustomersPDF(customers);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=customers-report.pdf');
      res.send(pdfBuffer);
    } catch (e) {
      next(e);
    }
  },

  async getSalesPDF(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      const filters = { start_date, end_date };
      const sales = await SalesService.getAllSalesForReport(filters);
      const pdfBuffer = await ReportService.generateSalesPDF(sales);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
      res.send(pdfBuffer);
    } catch (e) {
      next(e);
    }
  },
  // Add other report generation methods here
};

module.exports = reportController;