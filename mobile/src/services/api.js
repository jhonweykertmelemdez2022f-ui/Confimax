import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ CONFIGURACIÓN DE CONEXIÓN CLOUD VS LOCAL:
// Si quieres usar producción explícitamente crea un `.env` con API_BASE_URL.
// En desarrollo local con Tailscale recomendamos usar la IP de tu equipo.
const USE_PRODUCTION = true;

const ENV_API_BASE_URL = process.env.API_BASE_URL || process.env.REACT_NATIVE_APP_API_BASE_URL;
const LOCAL_IP = '100.101.30.4';

const API_BASE_URL = ENV_API_BASE_URL || (USE_PRODUCTION
  ? 'https://confimax-api-gateway-i0ms.onrender.com/api'
  : `http://${LOCAL_IP}:8080/api`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Aumentado a 15s para evitar timeouts agresivos en Docker/WiFi
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Instancia separada para Fabiana (sin autenticación)
const fabianaApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentado para Fabiana que puede tardar más
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    console.log(`Making request to: ${config.url}`);
    try {
      const stored = await SecureStore.getItemAsync('confimax_auth');
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.log('No token found');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('confimax_auth');
      try {
        // Importación perezosa (lazy) para evitar dependencia circular
        const { useAuthStore } = require('../stores/authStore');
        useAuthStore.getState().logout();
      } catch (e) {
        console.log('Error forcing logout:', e.message);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

export const inventoryAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getProductByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  searchProducts: (query) => api.get('/products/search', { params: { q: query } }),
  searchProductsABC: (prefix) => api.get('/products/search-abc', { params: { prefix } }),
  adjustStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  getLowStock: (threshold) => api.get('/inventory/stock/low-stock', { params: { threshold } }),
  getExpiring: (days) => api.get('/products/alerts/expiring', { params: { days } }),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getProductStockItems: (productId) => api.get(`/inventory/stock/product/${productId}`),
  createStockItem: (data) => api.post('/inventory/stock', data),
  updateStockItem: (id, data) => api.put(`/inventory/stock/${id}`, data),
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (data) => api.post('/inventory/categories', data),
  updateCategory: (id, data) => api.put(`/inventory/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/inventory/categories/${id}`),
};

export const salesAPI = {
  // allow optional currency and taxRate in sale creation so frontends can request conversion
  createSale: (saleData, options = {}) => api.post('/sales', { ...saleData, currency: options.currency, taxRate: options.taxRate }),
  createCustomerSale: (saleData, options = {}) => api.post('/sales/customer', { ...saleData, currency: options.currency, taxRate: options.taxRate }),
  createPayment: (paymentData) => api.post('/sales/payments', paymentData),
  getSales: (params) => api.get('/sales', { params }),
  getSale: (id) => api.get(`/sales/${id}`),
  getSaleItems: (id) => api.get(`/sales/${id}/items`),
  getDailySales: (date) => api.get('/sales/daily', { params: { date } }),
  getSalesSummary: (params) => api.get('/sales/summary', { params }),
  updateSale: (id, data) => api.patch(`/sales/${id}/status`, data),
  deleteSale: (id) => api.delete(`/sales/${id}`),
  getExchangeRates: () => api.get('/sales/exchange-rates'),
  convertPrice: (params) => api.get('/sales/convert', { params }),
};

// Proveedores / Suppliers module
export const providersAPI = {
  // CRUD proveedores
  getProviders: (params) => api.get('/suppliers', { params }),
  getProvider: (id) => api.get(`/suppliers/${id}`),
  createProvider: (data) => api.post('/suppliers', data),
  updateProvider: (id, data) => api.put(`/suppliers/${id}`, data),
  deleteProvider: (id) => api.delete(`/suppliers/${id}`),

  // Productos que ofrece el proveedor
  getProviderProducts: (providerId) => api.get(`/suppliers/${providerId}/products`),
  addProviderProduct: (providerId, data) => api.post(`/suppliers/${providerId}/products`, data),
  updateProviderProduct: (providerId, productId, data) => api.put(`/suppliers/${providerId}/products/${productId}`, data),
  deleteProviderProduct: (providerId, productId) => api.delete(`/suppliers/${providerId}/products/${productId}`),

  // Compras registradas a proveedor (con IVA)
  recordPurchase: (providerId, data) => api.post(`/purchases/suppliers/${providerId}`, data),
  getPurchases: (params) => api.get('/purchases', { params }),

  // Alertas de factura por vencer
  getExpiringInvoices: (days = 7) => api.get('/purchases/expiring', { params: { days } }),
};

export const customersAPI = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  searchCustomers: (query) => api.get('/customers/search', { params: { q: query } }),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.patch(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  getCustomerDebt: (id) => api.get(`/customers/${id}/debt`),
  getCustomerCredits: (id) => api.get(`/customers/${id}/credits`),
  getExpiringCredits: (days) => api.get('/credits/expiring', { params: { days } }),
  getOverdueCredits: () => api.get('/credits/overdue'),
};

export const notificationsAPI = {
  getNotifications: (userId, params) => api.get(`/notifications/user/${userId}`, { params }),
  getUnreadCount: (userId) => api.get(`/notifications/user/${userId}/count`),
  markAsRead: (id, userId) => api.patch(`/notifications/${id}/read`, { user_id: userId }),
  markAllAsRead: (userId) => api.post('/notifications/read-all', { user_id: userId }),
  getSettings: (userId) => api.get(`/notifications/settings/${userId}`),
  updateSettings: (userId, settings) => api.put(`/notifications/settings/${userId}`, settings),
};

export const auditAPI = {
  getAuditLogs: (params) => api.get('/backend/audit', { params }),
};

export const fabianaAPI = {
  chat: (messages, role) => fabianaApi.post('/fabiana/chat', { messages, role }),
};

export default api;
