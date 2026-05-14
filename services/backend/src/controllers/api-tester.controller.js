function getTesterUI(req, res) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confimax Backend - API Tester</title>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #0a0c10;
      --bg-sidebar: #111418;
      --bg-card: #161b22;
      --border: #21262d;
      --text-main: #8b949e;
      --text-bright: #f0f6fc;
      --primary: #00ed64;
      --accent: #8b5cf6;
      --error: #ef4444;
      --success: #22c55e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: var(--bg-main); color: var(--text-main); display: flex; height: 100vh; }
    
    .sidebar { width: 280px; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; font-weight: 700; color: var(--text-bright); }
    .sidebar-content { flex: 1; overflow-y: auto; padding: 1rem; }
    .nav-group-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.5rem 0.5rem; opacity: 0.6; }
    .endpoint-item { padding: 0.6rem 0.75rem; font-size: 0.85rem; cursor: pointer; border-radius: 6px; margin-bottom: 2px; display: flex; align-items: center; gap: 0.5rem; }
    .endpoint-item:hover { background: rgba(139, 92, 246, 0.1); color: var(--text-bright); }
    .endpoint-item.active { background: rgba(0, 237, 100, 0.1); color: var(--primary); font-weight: 600; }
    .method-get { color: #22c55e; font-weight: 600; font-size: 0.7rem; min-width: 45px; }
    .method-post { color: #3b82f6; font-weight: 600; font-size: 0.7rem; min-width: 45px; }
    .method-patch { color: #f59e0b; font-weight: 600; font-size: 0.7rem; min-width: 45px; }
    .method-delete { color: #ef4444; font-weight: 600; font-size: 0.7rem; min-width: 45px; }
    
    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .top-bar { height: 56px; background: var(--bg-sidebar); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 2rem; gap: 1rem; }
    .token-input { flex: 1; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem 1rem; color: var(--text-bright); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; }
    .token-input::placeholder { color: var(--text-main); opacity: 0.5; }
    
    .content { flex: 1; display: flex; overflow: hidden; }
    .request-panel { flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border); }
    .response-panel { flex: 1; display: flex; flex-direction: column; }
    
    .panel-header { padding: 1rem 1.5rem; background: var(--bg-sidebar); border-bottom: 1px solid var(--border); font-weight: 600; color: var(--text-bright); }
    
    .request-editor { flex: 1; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .url-bar { display: flex; gap: 0.5rem; }
    .method-select { background: var(--primary); color: #000; border: none; border-radius: 6px; padding: 0 1rem; font-weight: 700; cursor: pointer; }
    .url-input { flex: 1; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem 1rem; color: var(--text-bright); font-family: 'JetBrains Mono', monospace; }
    .send-btn { background: var(--primary); color: #000; border: none; border-radius: 6px; padding: 0.5rem 1.5rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .send-btn:hover { filter: brightness(1.1); }
    
    .body-editor { flex: 1; display: flex; flex-direction: column; }
    .body-editor textarea { flex: 1; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; padding: 1rem; color: var(--text-bright); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; resize: none; }
    
    .response-viewer { flex: 1; padding: 1.5rem; overflow-y: auto; }
    .response-meta { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-success { background: rgba(34, 197, 94, 0.2); color: var(--success); }
    .status-error { background: rgba(239, 68, 68, 0.2); color: var(--error); }
    .time-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; background: var(--bg-card); color: var(--text-main); }
    
    .response-body { background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; padding: 1rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; white-space: pre-wrap; overflow-x: auto; max-height: calc(100vh - 200px); overflow-y: auto; }
    .json-key { color: var(--accent); }
    .json-string { color: #ffab70; }
    .json-number { color: #79c0ff; }
    .json-boolean { color: #ff7b72; }
    
    .hint { font-size: 0.75rem; color: var(--text-main); opacity: 0.6; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="sidebar-header">
      <i data-lucide="terminal" style="color: var(--primary)"></i>
      <span>API TESTER</span>
    </div>
    <div class="sidebar-content">
      <div class="nav-group-label">Health (sin auth)</div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/health', null)">
        <span class="method-get">GET</span> Health Check
      </div>
      
      <div class="nav-group-label">Autenticación</div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/auth/register', {username:'nuevo',email:'nuevo@test.com',password:'password123',role:'vendor'})">
        <span class="method-post">POST</span> Register
      </div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/auth/login', {username:'admin',password:'admin123'})">
        <span class="method-post">POST</span> Login
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/auth/me', null)">
        <span class="method-get">GET</span> Me (requiere token)
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/auth/users', null)">
        <span class="method-get">GET</span> Users (requiere token)
      </div>
      
      <div class="nav-group-label">Productos</div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/products', null)">
        <span class="method-get">GET</span> Listar
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/products/1', null)">
        <span class="method-get">GET</span> Por ID
      </div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/products', {name:'Producto Test',sku:'TEST001',unit_price:100,stock_quantity:50})">
        <span class="method-post">POST</span> Crear
      </div>
      <div class="endpoint-item" onclick="setEndpoint('PATCH', '/api/products/1', {name:'Actualizado',unit_price:150})">
        <span class="method-patch">PATCH</span> Actualizar
      </div>
      <div class="endpoint-item" onclick="setEndpoint('DELETE', '/api/products/1', null)">
        <span class="method-delete">DELETE</span> Eliminar
      </div>
      
      <div class="nav-group-label">Categorías</div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/categories', null)">
        <span class="method-get">GET</span> Listar
      </div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/categories', {name:'Nueva Cat',description:'Descripción'})">
        <span class="method-post">POST</span> Crear
      </div>
      
      <div class="nav-group-label">Ventas</div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/sales', null)">
        <span class="method-get">GET</span> Listar
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/sales/1', null)">
        <span class="method-get">GET</span> Por ID
      </div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/sales', {customer_id:1,vendor_id:1,total:500,items:[{product_id:1,quantity:2,unit_price:100,total:200}]})">
        <span class="method-post">POST</span> Crear
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/sales/summary/daily?date=2024-01-15', null)">
        <span class="method-get">GET</span> Resumen Diario
      </div>
      
      <div class="nav-group-label">Clientes</div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/customers', null)">
        <span class="method-get">GET</span> Listar
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/customers/1', null)">
        <span class="method-get">GET</span> Por ID
      </div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/customers', {name:'Cliente Test',rif:'J-123456789',phone:'04141234567'})">
        <span class="method-post">POST</span> Crear
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/customers/1/credits', null)">
        <span class="method-get">GET</span> Créditos
      </div>
      
      <div class="nav-group-label">Créditos</div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/credits', {customer_id:1,sale_id:1,amount:1000,balance:1000})">
        <span class="method-post">POST</span> Crear Crédito
      </div>
      
      <div class="nav-group-label">Notificaciones</div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/notifications?user_id=1', null)">
        <span class="method-get">GET</span> Listar
      </div>
      <div class="endpoint-item" onclick="setEndpoint('POST', '/api/notifications', {user_id:'1',title:'Test',message:'Mensaje de prueba',type:'info'})">
        <span class="method-post">POST</span> Crear
      </div>
      <div class="endpoint-item" onclick="setEndpoint('GET', '/api/notifications/unread/1', null)">
        <span class="method-get">GET</span> No Leídas
      </div>
      <div class="endpoint-item" onclick="setEndpoint('PATCH', '/api/notifications/ID/read', null)">
        <span class="method-patch">PATCH</span> Marcar Leída
      </div>
    </div>
  </div>
  
  <div class="main">
    <div class="top-bar">
      <i data-lucide="key" style="color: var(--accent)"></i>
      <input type="text" class="token-input" id="tokenInput" placeholder="Bearer token (se guarda automáticamente después del login)">
    </div>
    
    <div class="content">
      <div class="request-panel">
        <div class="panel-header">Request</div>
        <div class="request-editor">
          <div class="url-bar">
            <select class="method-select" id="methodSelect">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input type="text" class="url-input" id="urlInput" placeholder="/api/endpoint">
            <button class="send-btn" onclick="sendRequest()">
              <i data-lucide="play" size="16"></i>
              SEND
            </button>
          </div>
          <div class="body-editor">
            <textarea id="bodyEditor" placeholder='{"key": "value"}'></textarea>
            <p class="hint">Los endpoints protegidos requieren token. Usa Login primero.</p>
          </div>
        </div>
      </div>
      
      <div class="response-panel">
        <div class="panel-header">Response</div>
        <div class="response-viewer">
          <div class="response-meta">
            <span class="status-badge" id="statusBadge">--</span>
            <span class="time-badge" id="timeBadge">-- ms</span>
          </div>
          <pre class="response-body" id="responseBody">Selecciona un endpoint y presiona SEND</pre>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function setEndpoint(method, url, body) {
      document.getElementById('methodSelect').value = method;
      document.getElementById('urlInput').value = url;
      document.getElementById('bodyEditor').value = body ? JSON.stringify(body, null, 2) : '';
      
      document.querySelectorAll('.endpoint-item').forEach(el => el.classList.remove('active'));
      event.currentTarget.classList.add('active');
    }
    
    async function sendRequest() {
      const method = document.getElementById('methodSelect').value;
      const url = document.getElementById('urlInput').value;
      const token = document.getElementById('tokenInput').value;
      const bodyText = document.getElementById('bodyEditor').value;
      
      const startTime = Date.now();
      
      try {
        const options = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        
        if (token) {
          options.headers['Authorization'] = token.startsWith('Bearer ') ? token : 'Bearer ' + token;
        }
        
        if (['POST', 'PATCH', 'PUT'].includes(method) && bodyText) {
          options.body = bodyText;
        }
        
        const response = await fetch(url, options);
        const endTime = Date.now();
        const data = await response.json();
        
        // Auto-save token on login
        if (url.includes('/auth/login') && data.token) {
          document.getElementById('tokenInput').value = data.token;
        }
        
        // Update status
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.textContent = response.status + ' ' + response.statusText;
        statusBadge.className = 'status-badge ' + (response.ok ? 'status-success' : 'status-error');
        
        document.getElementById('timeBadge').textContent = (endTime - startTime) + ' ms';
        document.getElementById('responseBody').innerHTML = formatJSON(data);
        
      } catch (error) {
        document.getElementById('statusBadge').textContent = 'ERROR';
        document.getElementById('statusBadge').className = 'status-badge status-error';
        document.getElementById('responseBody').textContent = error.message;
      }
    }
    
    function formatJSON(obj) {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"(\\w+)":/g, '<span class="json-key">"$1"</span>:')
                 .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
                 .replace(/: (\\d+)/g, ': <span class="json-number">$1</span>')
                 .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
    }
    
    lucide.createIcons();
  </script>
</body>
</html>`;
  res.send(html);
}

module.exports = { getTesterUI };
