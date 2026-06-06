const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const notificationRoutes = require('./routes/notification.routes');
const { errorHandler } = require('./middleware/error.middleware');
const sharedPath = process.env.SHARED_MODULES_PATH || '../../shared';
const { connectUpstash } = require(sharedPath + '/upstash-redis');
const { connectAtlas, checkAtlasHealth, getMongoose } = require(sharedPath + '/mongo-atlas');
const logger = require('./services/logger.service');
const JobsService = require('./services/jobs.service');

const mongoose = getMongoose();

const app = express();
const PORT = process.env.PORT || 3005;

// Iniciar suscripción a Auditoría y conectar DBs cloud
const startAuditListener = async () => {
  try {
    // Conectar a MongoDB Atlas (usando módulo compartido con soporte URI cloud)
    await connectAtlas();
    console.log('[NOTIFICATIONS] MongoDB Atlas conectado');

    // Conectar Upstash Redis (o local)
    await connectUpstash();
    console.log('[NOTIFICATIONS] Redis/Upstash conectado');

    // Log inicial de bienvenida
    await logger.audit('DASHBOARD_BOOTED', { message: 'Sistema de auditoría reiniciado con éxito' });

    // Iniciar trabajos en segundo plano
    JobsService.start();
  } catch (err) {
    console.error('[NOTIFICATIONS] Startup failed:', err.message);
  }
};

startAuditListener();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
  try {
    const mongoHealth = await checkAtlasHealth();
    res.status(200).json({
      status: 'OK',
      service: 'notifications-service',
      mongo: mongoHealth.status,
    });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', service: 'notifications-service', error: err.message });
  }
});

app.use('/notifications', notificationRoutes);

const { Notification } = require('./models/notification.model');

// --- DASHBOARD DE AUDITORÍA PREMIUM (ESTILO COMPASS) ---
app.get('/api/data/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { action, limit = 50 } = req.query;
    
    let model;
    let query = {};

    if (collection === 'audit_logs') {
      model = logger.Log;
      if (action) query.action = new RegExp(action, 'i');
    } else if (collection === 'notifications') {
      model = Notification;
      if (action) query.title = new RegExp(action, 'i');
    } else {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    const data = await model.find(query).sort({ createdAt: -1, timestamp: -1 }).limit(parseInt(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching data', details: err.message });
  }
});

// --- ENLACE A AUDITORÍA INTEGRADO (PARA PRESERVAR ARQUITECTURA ORIGINAL) ---
app.get(['/api/audit', '/api/backend/audit'], async (req, res) => {
  try {
    const { limit = 100, offset = 0, operation, userId, entity, recordId, start_date, end_date } = req.query;
    const query = {};

    if (operation) query.operation = operation;
    if (userId) query.userId = userId;
    if (entity) query.entity = entity;
    if (recordId) query.recordId = recordId;

    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }

    const logs = await mongoose.connection.db.collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching audit logs', details: err.message });
  }
});

// Endpoint para que otros microservicios envíen logs de auditoría
app.post(['/api/audit', '/api/backend/audit'], async (req, res) => {
  try {
    const payload = req.body;
    
    // Preparar el documento según el esquema original de audit.model.js
    const auditDoc = {
      entity: payload.entity || 'Unknown',
      operation: payload.operation || 'UNKNOWN',
      recordId: payload.recordId ? String(payload.recordId) : null,
      oldData: payload.oldData,
      newData: payload.newData,
      userId: payload.userId || null,
      username: payload.username || null,
      ipAddress: payload.ip || null,
      endpoint: payload.endpoint || null,
      userAgent: payload.userAgent || null,
      status: payload.status || 'success',
      errorMessage: payload.errorMessage || null,
      timestamp: new Date()
    };

    await mongoose.connection.db.collection('audit_logs').insertOne(auditDoc);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[AUDIT-API] Error saving audit log:', err.message);
    res.status(500).json({ error: 'Failed to save audit log' });
  }
});

app.get(['/api/audit/user/:userId', '/api/backend/audit/user/:userId'], async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const logs = await mongoose.connection.db.collection('audit_logs')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user activity', details: err.message });
  }
});

app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confimax | Audit Telemetry</title>
        <script src="https://unpkg.com/lucide@latest"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                /* Light Mode */
                --bg-main: #ffffff;
                --bg-sidebar: #f8f9fa;
                --bg-header: #ffffff;
                --bg-terminal: #0a0a0a;
                --border: #e5e7eb;
                --text-main: #1f2937;
                --text-bright: #111827;
                --primary: #00ed64; /* Mongo Green */
                --accent: #8b5cf6;
                --error: #ef4444;
                --sidebar-width: 280px;
                --header-height: 64px;
            }

            @media (prefers-color-scheme: dark) {
                :root {
                    --bg-main: #0a0c10;
                    --bg-sidebar: #111418;
                    --bg-header: #111418;
                    --bg-terminal: #010409;
                    --border: #21262d;
                    --text-main: #8b949e;
                    --text-bright: #f0f6fc;
                }
            }

            * { box-sizing: border-box; transition: background-color 0.3s, border-color 0.3s; }
            body {
                font-family: 'Inter', sans-serif;
                background: var(--bg-main);
                color: var(--text-main);
                margin: 0;
                display: flex;
                height: 100vh;
                overflow: hidden;
            }

            /* --- SIDEBAR --- */
            .sidebar {
                width: var(--sidebar-width);
                background: var(--bg-sidebar);
                border-right: 1px solid var(--border);
                display: flex;
                flex-direction: column;
                z-index: 10;
            }
            .sidebar-header {
                padding: 1.5rem;
                border-bottom: 1px solid var(--border);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: 700;
                color: var(--text-bright);
                letter-spacing: -0.02em;
            }
            .sidebar-content {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            }
            .nav-group-label {
                font-size: 0.7rem;
                font-weight: 700;
                color: var(--text-main);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin: 1.5rem 0 0.5rem 0.5rem;
                opacity: 0.6;
            }
            .db-item {
                padding: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
                font-size: 0.9rem;
                border-radius: 8px;
                margin-bottom: 2px;
                color: var(--text-main);
            }
            .db-item:hover { background: rgba(139, 92, 246, 0.05); color: var(--text-bright); }
            .db-item.active { background: rgba(0, 237, 100, 0.1); color: var(--primary); font-weight: 600; }
            
            .coll-item {
                padding: 0.6rem 0.75rem 0.6rem 2.5rem;
                font-size: 0.85rem;
                color: var(--text-main);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
                border-radius: 8px;
                margin-bottom: 2px;
            }
            .coll-item:hover { background: rgba(255,255,255,0.05); color: var(--text-bright); }
            .coll-item.active { 
                background: rgba(139, 92, 246, 0.1); 
                color: var(--accent); 
                font-weight: 600;
            }

            /* --- MAIN CONTENT --- */
            .main {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .top-bar {
                height: var(--header-height);
                background: var(--bg-header);
                border-bottom: 1px solid var(--border);
                display: flex;
                align-items: center;
                padding: 0 2rem;
                justify-content: space-between;
            }
            .breadcrumb {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                font-weight: 500;
            }

            /* --- QUERY ENGINE --- */
            .query-panel {
                padding: 1.5rem 2rem;
                background: var(--bg-sidebar);
                border-bottom: 1px solid var(--border);
            }
            .query-box {
                display: flex;
                gap: 1rem;
                background: var(--bg-main);
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 0.5rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            }
            .query-box input {
                flex: 1;
                background: transparent;
                border: none;
                padding: 0.75rem 1rem;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.9rem;
                color: var(--text-bright);
                outline: none;
            }
            .btn-execute {
                background: var(--primary);
                color: #000;
                border: none;
                padding: 0 1.5rem;
                border-radius: 8px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: transform 0.2s;
            }
            .btn-execute:hover { filter: brightness(1.1); transform: translateY(-1px); }

            /* --- DATA GRID --- */
            .data-grid {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem 2rem;
            }
            .doc-card {
                background: var(--bg-sidebar);
                border: 1px solid var(--border);
                border-radius: 12px;
                margin-bottom: 1rem;
                overflow: hidden;
            }
            .doc-header {
                padding: 1rem 1.5rem;
                background: rgba(0,0,0,0.02);
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .doc-body {
                padding: 1.5rem;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.85rem;
                white-space: pre-wrap;
                color: var(--text-bright);
            }

            /* --- BADGES --- */
            .badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 700;
                font-family: 'Inter', sans-serif;
            }
            .badge-audit { background: rgba(0, 237, 100, 0.1); color: var(--primary); }
            .badge-error { background: rgba(239, 68, 68, 0.1); color: var(--error); }

            .json-key { color: var(--accent); }
            .json-string { color: #ffab70; }
            .json-number { color: #79c0ff; }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <div class="sidebar-header">
                <i data-lucide="shield-check" style="color: var(--primary)"></i>
                <span>CONFIMAX AUDIT</span>
            </div>
            <div class="sidebar-content">
                <div class="nav-group-label">Clusters</div>
                <div class="db-item active">
                    <i data-lucide="server"></i>
                    <span>atlas-sharded-01</span>
                </div>
                <div class="nav-group-label">Collections</div>
                <div class="coll-item active" id="coll-audit_logs" onclick="selectCollection('audit_logs')">
                    <i data-lucide="activity"></i>
                    <span>audit_logs</span>
                </div>
                <div class="coll-item" id="coll-notifications" onclick="selectCollection('notifications')">
                    <i data-lucide="bell"></i>
                    <span>notifications</span>
                </div>
            </div>
        </div>

        <div class="main">
            <div class="top-bar">
                <div class="breadcrumb">
                    <span style="opacity: 0.5">Telemetría</span>
                    <i data-lucide="chevron-right" size="14"></i>
                    <span>Audit Pipeline</span>
                </div>
                <div id="statusIndicator" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--primary)">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); animation: pulse 2s infinite"></span>
                    Live Streaming
                </div>
            </div>

            <div class="query-panel">
                <div class="query-box">
                    <input type="text" id="queryFilter" placeholder='db.audit_logs.find({ action: "SYNC" })' value='{}'>
                    <button class="btn-execute" onclick="fetchData()">
                        <i data-lucide="play" size="16"></i>
                        EXECUTE
                    </button>
                </div>
            </div>

            <div class="data-grid" id="resultsArea">
                <!-- Data will be injected here -->
            </div>
        </div>

        <script>
            let currentCollection = 'audit_logs';

            function selectCollection(name) {
                currentCollection = name;
                document.querySelectorAll('.coll-item').forEach(el => el.classList.remove('active'));
                document.getElementById('coll-' + name).classList.add('active');
                fetchData();
            }

            async function fetchData() {
                const container = document.getElementById('resultsArea');
                container.innerHTML = '<div style="padding: 2rem; opacity: 0.5">Ejecutando pipeline...</div>';
                
                try {
                    const res = await fetch('/api/data/' + currentCollection);
                    const data = await res.json();
                    renderData(data);
                } catch (e) {
                    container.innerHTML = '<div style="color: var(--error)">Error de red</div>';
                }
            }

            function renderData(items) {
                const container = document.getElementById('resultsArea');
                if (!items.length) {
                    container.innerHTML = '<div style="padding: 2rem; opacity: 0.5">No se encontraron documentos.</div>';
                    return;
                }

                container.innerHTML = items.map(item => \`
                    <div class="doc-card">
                        <div class="doc-header">
                            <div style="display: flex; align-items: center; gap: 1rem">
                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-bright)">ID: \${item._id.slice(-8)}</span>
                                <span class="badge \${item.level === 'ERROR' ? 'badge-error' : 'badge-audit'}">\${item.action || item.type || 'SYSTEM'}</span>
                            </div>
                            <span style="font-size: 0.75rem; opacity: 0.6">\${new Date(item.timestamp || item.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="doc-body">\${formatJSON(item)}</div>
                    </div>
                \`).join('');
                lucide.createIcons();
            }

            function formatJSON(obj) {
                const json = JSON.stringify(obj, null, 2);
                return json.replace(/"(\\w+)":/g, '<span class="json-key">"$1"</span>:')
                           .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
                           .replace(/: (\\d+)/g, ': <span class="json-number">$1</span>');
            }

            fetchData();
            lucide.createIcons();
        </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Notifications Service running on port ${PORT}`);
});

module.exports = app;
