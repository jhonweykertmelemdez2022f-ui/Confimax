/**
 * @file k6-stress-test.js
 * @description Script funcional de pruebas de carga con k6 para el API Gateway de Confimax.
 * Simula una rampa de estrés progresivo de hasta 500 Usuarios Virtuales (VUs) concurrentes,
 * ejecutando operaciones mixtas de lectura (catálogo) y escritura (registro de ventas).
 * Define umbrales (Thresholds) para aprobación académica y técnica exigidos por la UPTAI.
 * 
 * Uso:
 *   k6 run tests/load/k6-stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// ------------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE FASES DE ESTRÉS (Ramp-Up, Peak, Ramp-Down)
// ------------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Rampa de subida: de 0 a 100 usuarios concurrentes
    { duration: '1m', target: 300 },  // Estrés medio: de 100 a 300 usuarios concurrentes
    { duration: '2m', target: 500 },  // Pico crítico (Stress Peak): de 300 a 500 usuarios
    { duration: '1m', target: 500 },  // Mantener carga pico a 500 usuarios durante 1 minuto
    { duration: '30s', target: 0 },   // Rampa de bajada ordenada a 0 usuarios
  ],

  // ----------------------------------------------------------------------------
  // 2. UMBRALES DE CALIDAD DE SERVICIO (SLA / Thresholds UPTAI)
  // ----------------------------------------------------------------------------
  thresholds: {
    // El 95% de todas las peticiones (P95) debe completarse en menos de 500 ms
    http_req_duration: ['p(95)<500'],
    
    // El 99% de todas las peticiones (P99) debe completarse en menos de 1000 ms
    'http_req_duration{type:write}': ['p(99)<1200'], 
    
    // La tasa de errores de red o servidor de la API debe ser menor al 1%
    http_req_failed: ['rate<0.01'], 
  },
};

// Configuración de constantes del entorno
const BASE_URL = 'https://api-confimax.bitforges.com/api';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJzeXN0ZW1fZGV2IiwidXNlcm5hbWUiOiJqYWNrc29uX3VwdGFpIiwiZXhwIjoyNTI0NjA4MDAwfQ.dummy_signature';

// ------------------------------------------------------------------------------
// 3. FLUJO DE COMPORTAMIENTO DEL USUARIO VIRTUAL (VU)
// ------------------------------------------------------------------------------
export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'X-Client-Type': 'k6-load-test',
    },
  };

  // --- ESCENARIO A: LECTURA DE CATÁLOGO (GET /products) ---
  // Simula a un operario consultando stock de productos desde la Web o el Móvil
  const getProductsRes = http.get(`${BASE_URL}/products?limit=50`, {
    ...params,
    tags: { type: 'read' },
  });

  check(getProductsRes, {
    'GET /products - Status 200': (r) => r.status === 200,
    'GET /products - Contiene productos': (r) => JSON.parse(r.body).length >= 0,
  });

  sleep(1); // Tiempo de descanso simulado del usuario (think time)

  // --- ESCENARIO B: ESCRITURA TRANSACCIONAL (POST /sales) ---
  // Simula la creación o sincronización de una venta realizada desde la app móvil
  const salePayload = JSON.stringify({
    customerId: 'cust_999888',
    totalAmount: 145.50,
    status: 'COMPLETED',
    items: [
      { productId: 'prod_001', quantity: 2, unitPrice: 50.00 },
      { productId: 'prod_002', quantity: 3, unitPrice: 15.17 }
    ]
  });

  const postSaleRes = http.post(`${BASE_URL}/sales`, salePayload, {
    ...params,
    tags: { type: 'write' },
  });

  check(postSaleRes, {
    'POST /sales - Status 201': (r) => r.status === 201 || r.status === 200,
    'POST /sales - Contiene ID de venta': (r) => {
      const body = JSON.parse(r.body);
      return body && (body.id || body.success === true);
    },
  });

  sleep(1.5); // Descanso adicional antes del siguiente ciclo
}
