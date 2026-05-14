/**
 * Controlador para ejecutar tests desde la API
 */
const { exec } = require('child_process');
const path = require('path');

// Configuración de tests disponibles
const TEST_SUITES = {
  // Tests unitarios del backend
  'auth-unit': {
    name: 'Auth Unit Tests',
    description: 'Tests unitarios de autenticación',
    command: 'npx jest tests/unit/auth.test.js --json',
    type: 'unit'
  },
  'inventory-unit': {
    name: 'Inventory Unit Tests',
    description: 'Tests unitarios de inventario',
    command: 'npx jest tests/unit/inventory.test.js --json',
    type: 'unit'
  },
  'sales-unit': {
    name: 'Sales Unit Tests',
    description: 'Tests unitarios de ventas',
    command: 'npx jest tests/unit/sales.test.js --json',
    type: 'unit'
  },
  'customers-unit': {
    name: 'Customers Unit Tests',
    description: 'Tests unitarios de clientes',
    command: 'npx jest tests/unit/customers.test.js --json',
    type: 'unit'
  },
  'notifications-unit': {
    name: 'Notifications Unit Tests',
    description: 'Tests unitarios de notificaciones',
    command: 'npx jest tests/unit/notifications.test.js --json',
    type: 'unit'
  },
  // Tests de integración
  'api-integration': {
    name: 'API Integration Tests',
    description: 'Tests de integración de la API',
    command: 'npx jest tests/integration/api.test.js --json',
    type: 'integration'
  },
  // Todos los tests unitarios
  'all-unit': {
    name: 'All Unit Tests',
    description: 'Ejecutar todos los tests unitarios',
    command: 'npx jest tests/unit/ --json',
    type: 'unit'
  },
  // Todos los tests
  'all': {
    name: 'All Tests',
    description: 'Ejecutar todos los tests',
    command: 'npx jest --json',
    type: 'all'
  }
};

/**
 * Ejecuta un comando y retorna el resultado
 */
function runCommand(command, cwd) {
  return new Promise((resolve) => {
    exec(command, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout,
        stderr: stderr,
        error: error?.message || null
      });
    });
  });
}

/**
 * Obtiene la lista de tests disponibles
 */
exports.getTestSuites = (req, res) => {
  const suites = Object.entries(TEST_SUITES).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    type: config.type
  }));

  res.json({
    success: true,
    data: suites
  });
};

/**
 * Ejecuta un test específico
 */
exports.runTest = async (req, res) => {
  const { testId } = req.params;
  const test = TEST_SUITES[testId];

  if (!test) {
    return res.status(404).json({
      success: false,
      error: `Test '${testId}' no encontrado`
    });
  }

  const backendPath = path.join(__dirname, '..', '..', '..');
  
  try {
    const result = await runCommand(test.command, backendPath);
    
    // Parsear resultado de Jest
    let testResults = null;
    try {
      const jsonOutput = result.stdout.substring(result.stdout.indexOf('{'));
      testResults = JSON.parse(jsonOutput);
    } catch (e) {
      // No se pudo parsear JSON
    }

    res.json({
      success: result.success,
      testId,
      testName: test.name,
      type: test.type,
      results: testResults,
      rawOutput: result.stdout,
      error: result.stderr || result.error
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Ejecuta todos los tests
 */
exports.runAllTests = async (req, res) => {
  const backendPath = path.join(__dirname, '..', '..', '..');
  
  try {
    const result = await runCommand('npx jest --json', backendPath);
    
    let testResults = null;
    try {
      const jsonOutput = result.stdout.substring(result.stdout.indexOf('{'));
      testResults = JSON.parse(jsonOutput);
    } catch (e) {
      // No se pudo parsear JSON
    }

    res.json({
      success: result.success,
      results: testResults,
      rawOutput: result.stdout,
      error: result.stderr || result.error
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Obtiene el estado de salud de los tests
 */
exports.health = (req, res) => {
  res.json({
    success: true,
    message: 'Test runner is ready',
    availableTests: Object.keys(TEST_SUITES).length
  });
};
