import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ CONFIGURACIÓN DE CONEXIÓN CLOUD VS LOCAL:
// Cambia USE_PRODUCTION a:
//   - true: Para conectarte al servidor central de producción en la nube (Supabase + Render)
//   - false: Para conectarte al backend de desarrollo local ejecutándose en tu PC en Docker
const USE_PRODUCTION = true; 

// Para conexión local: cambia esta IP por la IP local de tu PC en tu red WiFi
const LOCAL_IP = '192.168.101.4'; 

const API_BASE_URL = USE_PRODUCTION 
  ? 'https://confimax-api-gateway.onrender.com/api'
  : `http://${LOCAL_IP}:8080/api`;

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

api.interceptors.request.use(
  async (config) => {
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
  getLowStock: () => api.get('/products/low-stock'),
  getExpiring: (days) => api.get('/products/alerts/expiring', { params: { days } }),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.patch(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getProductStockItems: (productId) => api.get(`/inventory/stock/product/${productId}`),
  createStockItem: (data) => api.post('/inventory/stock', data),
  updateStockItem: (id, data) => api.put(`/inventory/stock/${id}`, data),
};

export const salesAPI = {
  createSale: (saleData) => api.post('/sales', saleData),
  getSales: (params) => api.get('/sales', { params }),
  getSale: (id) => api.get(`/sales/${id}`),
  getSaleItems: (id) => api.get(`/sales/${id}/items`),
  getDailySales: (date) => api.get('/sales/daily', { params: { date } }),
  getSalesSummary: (params) => api.get('/sales/summary', { params }),
  updateSale: (id, data) => api.patch(`/sales/${id}`, data),
  deleteSale: (id) => api.delete(`/sales/${id}`),
  getExchangeRates: () => api.get('/sales/exchange-rates'),
  convertPrice: (params) => api.get('/sales/convert', { params }),
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

export default api;
