const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');

// Health check del test runner
router.get('/health', testController.health);

// Lista de tests disponibles
router.get('/suites', testController.getTestSuites);

// Ejecutar un test específico
router.post('/run/:testId', testController.runTest);

// Ejecutar todos los tests
router.post('/run-all', testController.runAllTests);

module.exports = router;
