import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ IMPORTANTE: Cambia esta IP por la IP local de tu PC en la red WiFi
// Para verla en Windows: abre cmd y escribe "ipconfig", busca "Dirección IPv4"
// Ejemplo: 192.168.1.15
const LOCAL_IP = '192.168.101.4'; // <-- Cambia esto por tu IP

const API_BASE_URL = `http://${LOCAL_IP}:8080/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 2000,
  headers: {
    'Content-Type': 'application/json',
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
};

export const inventoryAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getProductByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  searchProducts: (query) => api.get('/products/search', { params: { q: query } }),
  searchProductsABC: (prefix) => api.get('/products/search-abc', { params: { prefix } }),
  adjustStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  getLowStock: () => api.get('/products/low-stock'),
  getExpiring: (days) => api.get('/products/expiring', { params: { days } }),
  createProduct: (data) => api.post('/products', data),
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
  getExchangeRates: () => api.get('/sales/exchange-rates'),
  convertPrice: (params) => api.get('/sales/convert', { params }),
};

export const customersAPI = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  searchCustomers: (query) => api.get('/customers/search', { params: { q: query } }),
  createCustomer: (data) => api.post('/customers', data),
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

export default api;
