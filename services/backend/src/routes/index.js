const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const healthController = require('../controllers/health.controller');
const { getTesterUI } = require('../controllers/api-tester.controller');
const { getTestUI } = require('../controllers/test-ui.controller');
const authRoutes = require('./auth.routes');
const inventoryRoutes = require('./inventory.routes');
const salesRoutes = require('./sales.routes');
const customersRoutes = require('./customers.routes');
const notificationsRoutes = require('./notifications.routes');
const testRoutes = require('./test.routes');
const auditRoutes = require('./audit.routes');

const router = express.Router();

// API Tester UI (no auth needed - it's a dev tool)
router.get('/tester', getTesterUI);

// Test Runner UI (no auth needed - it's a dev tool)
router.get('/tests', getTestUI);
router.use('/tests', testRoutes);

// Health
router.get('/health', healthController.status);
router.get('/ready', healthController.readiness);

// Auth (login/register public, rest protected internally)
router.use('/auth', authRoutes);

// Protected domain routes
router.use('/products', authenticate, inventoryRoutes);
router.use('/categories', authenticate, require('./category.routes'));
router.use('/sales', authenticate, salesRoutes);
router.use('/customers', authenticate, customersRoutes);
router.use('/credits', authenticate, require('./credit.routes'));
router.use('/notifications', authenticate, notificationsRoutes);
router.use('/audit', authenticate, auditRoutes);

module.exports = router;
