import axios from 'axios';
import * as Keychain from 'react-native-keychain';

// Para emulador Android usa 10.0.2.2, para iOS usa localhost, para dispositivo real usa tu IP
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3006/api' // Android emulator
  : 'http://localhost:3006/api'; // iOS simulator

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        const { token } = JSON.parse(credentials.password);
        config.headers.Authorization = `Bearer ${token}`;
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
      await Keychain.resetGenericPassword();
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
