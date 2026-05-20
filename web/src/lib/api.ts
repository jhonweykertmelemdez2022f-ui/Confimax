/**
 * ============================================================
 * API CLIENT - CONFIMAX FRONTEND
 * ============================================================
 * Cliente HTTP configurado para conectar con el API Gateway.
 * 
 * Arquitectura:
 *   Frontend (Next.js) -> Nginx (puerto 3000) -> API Gateway (8080) -> Microservicios
 * 
 * Rutas:
 *   /api/auth/*      -> auth-service:3001
 *   /api/inventory/* -> inventory-service:3002
 *   /api/sales/*     -> sales-service:3003
 *   /api/customers/* -> customers-service:3004
 *   /api/notifications/* -> notifications-service:3005
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? '/api' : 'http://api-gateway:8080/api');

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    // Asegurar que la URL base termina en /api si es una URL absoluta de producción
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    if (this.baseUrl.startsWith('http') && !this.baseUrl.endsWith('/api')) {
      this.baseUrl += '/api';
    }
    // Cargar token del localStorage al iniciar
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('confimax_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Copy existing headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => headers.set(key, value));
      } else {
        Object.entries(options.headers).forEach(([key, value]) => headers.set(key, value));
      }
    }

    // Agregar token si existe
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { message: text };
        }
      } else {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Error en la petición: ${response.status}`);
      }

      // Guardar token si viene en la respuesta
      const token = data.token || data.accessToken;
      if (token) {
        this.token = token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('confimax_token', token);
        }
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('confimax_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('confimax_token');
    }
  }

  // Auth Service
  async login(usernameOrEmail: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    // Generar un username libre de espacios para satisfacer express-validator en el backend
    const username = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || `user${Date.now()}`;
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, email, password }),
    });
  }

  async logout() {
    this.clearToken();
    return this.request('/auth/logout', { method: 'POST' });
  }

  async refreshToken() {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  async recoverPassword(email: string) {
    return this.request('/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Inventory Service (Direct Paths)
  async getProducts(params?: { limit?: number; offset?: number; category?: string }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/products${queryString}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: {
    name: string;
    sku: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
    image?: string;
    expiration_date?: string;
  }) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        cost: data.price * 0.7, // Costo estimado para el servicio
        is_active: true,
        stock_quantity: data.stock,
        category_id: data.category === 'despensa' ? 'de0a6464-94e8-468b-90f7-5db18863fce9' : '3b9bbcbd-fb12-ae26-d332-b951dc649bd6', // Mapear a UUID de categoría por defecto
        image_url: data.image,
        expiration_date: data.expiration_date || null
      }),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  async getCategories() {
    return this.request('/inventory/categories');
  }

  async createCategory(data: { name: string; description?: string }) {
    return this.request('/inventory/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: { name?: string; description?: string }) {
    return this.request(`/inventory/categories/${id}`, {
      method: 'PUT', // or PATCH depending on the backend, using PUT as standard
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/inventory/categories/${id}`, { method: 'DELETE' });
  }

  async searchProducts(query: string) {
    return this.request(`/products/search?q=${encodeURIComponent(query)}`);
  }

  // Sales Service
  async createSale(data: {
    customerId?: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    paymentMethod: string;
  }) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSales(params?: { limit?: number; offset?: number }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/sales${queryString}`);
  }

  async getSale(id: string) {
    return this.request(`/sales/${id}`);
  }

  async updateSale(id: string, data: any) {
    return this.request(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSale(id: string) {
    return this.request(`/sales/${id}`, { method: 'DELETE' });
  }

  // Customers Service
  async getCustomers(params?: { limit?: number; offset?: number }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/customers${queryString}`);
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  }) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  // Notifications Service
  async getNotifications(params?: { limit?: number; unread?: boolean }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/notifications${queryString}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  // User Management Service (Admin Only)
  async getUsers() {
    return this.request('/auth/users', { method: 'GET' });
  }

  // Audit Logs (MongoDB - Admin Only)
  async getAuditLogs(params?: { limit?: number; offset?: number; operation?: string; entity?: string }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/backend/audit${queryString}`, { method: 'GET' });
  }

  async createUser(data: { username: string; email: string; password?: string; role: string; name?: string }) {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password || 'Confimax123*',
        role: data.role,
        name: data.name
      }),
    });
  }

  async updateUser(id: string, data: { username?: string; email?: string; role?: string; name?: string }) {
    return this.request(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/auth/users/${id}`, { method: 'DELETE' });
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }
}

// Exportar instancia singleton
export const api = new ApiClient(API_BASE_URL);

// Exportar tipos
export type { ApiResponse };
