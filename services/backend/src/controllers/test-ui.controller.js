/**
 * Página UI para ejecutar tests desde el navegador
 */
exports.getTestUI = (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confimax Test Runner</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e0e0e0;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #888; font-size: 1.1em; }
    .grid { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
    .sidebar {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
    }
    .sidebar h2 { font-size: 1.2em; margin-bottom: 15px; color: #00d4ff; }
    .test-list { list-style: none; }
    .test-item {
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-bottom: 10px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }
    .test-item:hover { background: rgba(0,212,255,0.1); border-color: #00d4ff; }
    .test-item.running { border-color: #ffc107; animation: pulse 1s infinite; }
    .test-item.success { border-color: #28a745; }
    .test-item.failed { border-color: #dc3545; }
    .test-name { font-weight: 600; margin-bottom: 4px; }
    .test-desc { font-size: 0.85em; color: #888; }
    .test-type {
      display: inline-block;
      font-size: 0.7em;
      padding: 2px 8px;
      border-radius: 4px;
      margin-top: 5px;
    }
    .test-type.unit { background: #17a2b8; }
    .test-type.integration { background: #6f42c1; }
    .test-type.all { background: #fd7e14; }
    .main-content {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
    }
    .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .btn-primary {
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      color: white;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(0,212,255,0.3); }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #e0e0e0; }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .results-container {
      background: #0d1117;
      border-radius: 8px;
      padding: 20px;
      min-height: 400px;
      max-height: 600px;
      overflow-y: auto;
    }
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .results-title { font-size: 1.2em; }
    .results-stats { display: flex; gap: 20px; }
    .stat { text-align: center; }
    .stat-value { font-size: 1.5em; font-weight: bold; }
    .stat-label { font-size: 0.8em; color: #888; }
    .stat-passed .stat-value { color: #28a745; }
    .stat-failed .stat-value { color: #dc3545; }
    .stat-total .stat-value { color: #00d4ff; }
    .test-result {
      background: rgba(255,255,255,0.03);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      border-left: 4px solid #666;
    }
    .test-result.passed { border-left-color: #28a745; }
    .test-result.failed { border-left-color: #dc3545; }
    .test-result-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .test-result-name { font-weight: 600; }
    .test-result-status { font-size: 0.85em; padding: 2px 10px; border-radius: 4px; }
    .test-result-status.passed { background: #28a745; color: white; }
    .test-result-status.failed { background: #dc3545; color: white; }
    .test-result-message { font-size: 0.9em; color: #888; white-space: pre-wrap; word-break: break-word; }
    .loading { text-align: center; padding: 40px; }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #00d4ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .empty-state { text-align: center; padding: 60px 20px; color: #666; }
    .empty-state-icon { font-size: 4em; margin-bottom: 20px; }
    .raw-output {
      background: #000;
      padding: 15px;
      border-radius: 6px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.85em;
      white-space: pre-wrap;
      overflow-x: auto;
      margin-top: 15px;
      max-height: 300px;
      overflow-y: auto;
    }
    .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
    .tab {
      padding: 8px 16px;
      background: rgba(255,255,255,0.05);
      border: none;
      border-radius: 6px;
      color: #888;
      cursor: pointer;
      transition: all 0.3s;
    }
    .tab.active { background: #00d4ff; color: #000; }
    .tab:hover:not(.active) { background: rgba(255,255,255,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Confimax Test Runner</h1>
      <p class="subtitle">Ejecuta y visualiza tests desde el navegador</p>
    </header>
    
    <div class="grid">
      <aside class="sidebar">
        <h2>Test Suites</h2>
        <ul class="test-list" id="testList">
          <li class="test-item" data-test="all">
            <div class="test-name">Todos los Tests</div>
            <div class="test-desc">Ejecutar suite completa</div>
            <span class="test-type all">all</span>
          </li>
          <li class="test-item" data-test="all-unit">
            <div class="test-name">Tests Unitarios</div>
            <div class="test-desc">Todos los tests unitarios</div>
            <span class="test-type unit">unit</span>
          </li>
          <li class="test-item" data-test="auth-unit">
            <div class="test-name">Auth Tests</div>
            <div class="test-desc">Tests de autenticacion</div>
            <span class="test-type unit">unit</span>
          </li>
          <li class="test-item" data-test="inventory-unit">
            <div class="test-name">Inventory Tests</div>
            <div class="test-desc">Tests de inventario</div>
            <span class="test-type unit">unit</span>
          </li>
          <li class="test-item" data-test="sales-unit">
            <div class="test-name">Sales Tests</div>
            <div class="test-desc">Tests de ventas</div>
            <span class="test-type unit">unit</span>
          </li>
          <li class="test-item" data-test="customers-unit">
            <div class="test-name">Customers Tests</div>
            <div class="test-desc">Tests de clientes</div>
            <span class="test-type unit">unit</span>
          </li>
          <li class="test-item" data-test="notifications-unit">
            <div class="test-name">Notifications Tests</div>
            <div class="test-desc">Tests de notificaciones</div>
            <span class="test-type unit">unit</span>
          </li>
          <li class="test-item" data-test="api-integration">
            <div class="test-name">API Integration</div>
            <div class="test-desc">Tests de integracion</div>
            <span class="test-type integration">integration</span>
          </li>
        </ul>
      </aside>
      
      <main class="main-content">
        <div class="toolbar">
          <button class="btn btn-primary" id="btnRunAll">Ejecutar Todos</button>
          <button class="btn btn-secondary" id="btnClear">Limpiar</button>
          <button class="btn btn-secondary" id="btnRefresh">Actualizar</button>
        </div>
        
        <div class="results-container" id="resultsContainer">
          <div class="empty-state">
            <div class="empty-state-icon">Test</div>
            <p>Selecciona un test del panel izquierdo<br>o haz clic en "Ejecutar Todos"</p>
          </div>
        </div>
      </main>
    </div>
  </div>
  
  <script>
    const API_BASE = window.location.origin + '/api/tests';
    let currentResults = null;
    let currentTestItem = null;
    
    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
      // Click en items de test
      document.querySelectorAll('.test-item').forEach(function(item) {
        item.addEventListener('click', function() {
          const testId = this.getAttribute('data-test');
          runTest(testId, this);
        });
      });
      
      // Boton Ejecutar Todos
      document.getElementById('btnRunAll').addEventListener('click', runAllTests);
      
      // Boton Limpiar
      document.getElementById('btnClear').addEventListener('click', clearResults);
      
      // Boton Refresh
      document.getElementById('btnRefresh').addEventListener('click', loadSuites);
    });
    
    async function runTest(testId, element) {
      // Limpiar estados anteriores
      document.querySelectorAll('.test-item').forEach(function(item) {
        item.classList.remove('running', 'success', 'failed');
      });
      
      currentTestItem = element;
      element.classList.add('running');
      showLoading();
      
      try {
        const response = await fetch(API_BASE + '/run/' + testId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        currentResults = data;
        
        element.classList.remove('running');
        element.classList.add(data.success ? 'success' : 'failed');
        
        renderResults(data);
      } catch (error) {
        element.classList.remove('running');
        element.classList.add('failed');
        showError(error.message);
      }
    }
    
    async function runAllTests() {
      showLoading();
      
      try {
        const response = await fetch(API_BASE + '/run-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        currentResults = data;
        renderResults(data);
      } catch (error) {
        showError(error.message);
      }
    }
    
    function showLoading() {
      document.getElementById('resultsContainer').innerHTML = 
        '<div class="loading">' +
          '<div class="spinner"></div>' +
          '<p>Ejecutando tests...</p>' +
        '</div>';
    }
    
    function showError(message) {
      document.getElementById('resultsContainer').innerHTML = 
        '<div class="test-result failed">' +
          '<div class="test-result-header">' +
            '<span class="test-result-name">Error</span>' +
          '</div>' +
          '<div class="test-result-message">' + escapeHtml(message) + '</div>' +
        '</div>';
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function renderResults(data) {
      const container = document.getElementById('resultsContainer');
      
      if (!data.results) {
        container.innerHTML = 
          '<div class="test-result failed">' +
            '<div class="test-result-header">' +
              '<span class="test-result-name">Error</span>' +
            '</div>' +
            '<div class="test-result-message">' + escapeHtml(data.error || 'No se pudieron obtener resultados') + '</div>' +
          '</div>' +
          '<div class="raw-output">' + escapeHtml(data.rawOutput || '') + '</div>';
        return;
      }
      
      const results = data.results;
      const numPassed = results.numPassedTests || 0;
      const numFailed = results.numFailedTests || 0;
      const numTotal = results.numTotalTests || 0;
      
      let html = 
        '<div class="results-header">' +
          '<span class="results-title">' + escapeHtml(data.testName || 'Resultados') + '</span>' +
          '<div class="results-stats">' +
            '<div class="stat stat-passed">' +
              '<div class="stat-value">' + numPassed + '</div>' +
              '<div class="stat-label">Pasaron</div>' +
            '</div>' +
            '<div class="stat stat-failed">' +
              '<div class="stat-value">' + numFailed + '</div>' +
              '<div class="stat-label">Fallaron</div>' +
            '</div>' +
            '<div class="stat stat-total">' +
              '<div class="stat-value">' + numTotal + '</div>' +
              '<div class="stat-label">Total</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      // Renderizar cada test
      if (results.testResults) {
        results.testResults.forEach(function(testFile) {
          testFile.assertionResults.forEach(function(assertion) {
            const status = assertion.status === 'passed' ? 'passed' : 'failed';
            html += 
              '<div class="test-result ' + status + '">' +
                '<div class="test-result-header">' +
                  '<span class="test-result-name">' + escapeHtml(assertion.title) + '</span>' +
                  '<span class="test-result-status ' + status + '">' + assertion.status + '</span>' +
                '</div>';
            
            if (assertion.failureMessages && assertion.failureMessages.length) {
              html += '<div class="test-result-message">' + escapeHtml(assertion.failureMessages.join('\\n')) + '</div>';
            }
            
            html += '</div>';
          });
        });
      }
      
      // Raw output
      html += 
        '<div class="tabs">' +
          '<button class="tab active" onclick="showTab(\\'results\\')">Resultados</button>' +
          '<button class="tab" onclick="showTab(\\'raw\\')">Output Raw</button>' +
        '</div>' +
        '<div id="rawOutput" class="raw-output" style="display:none;">' + escapeHtml(data.rawOutput || '') + '</div>';
      
      container.innerHTML = html;
    }
    
    function showTab(tab) {
      document.querySelectorAll('.tab').forEach(function(t) {
        t.classList.remove('active');
      });
      event.currentTarget.classList.add('active');
      
      const rawOutput = document.getElementById('rawOutput');
      rawOutput.style.display = tab === 'raw' ? 'block' : 'none';
    }
    
    function clearResults() {
      currentResults = null;
      document.getElementById('resultsContainer').innerHTML = 
        '<div class="empty-state">' +
          '<div class="empty-state-icon">Test</div>' +
          '<p>Selecciona un test del panel izquierdo<br>o haz clic en "Ejecutar Todos"</p>' +
        '</div>';
      
      document.querySelectorAll('.test-item').forEach(function(item) {
        item.classList.remove('running', 'success', 'failed');
      });
    }
    
    async function loadSuites() {
      try {
        const response = await fetch(API_BASE + '/suites');
        const data = await response.json();
        console.log('Test suites:', data);
        alert('Test suites cargados: ' + data.data.length);
      } catch (error) {
        console.error('Error loading suites:', error);
        alert('Error cargando test suites: ' + error.message);
      }
    }
  </script>
</body>
</html>`);
};
