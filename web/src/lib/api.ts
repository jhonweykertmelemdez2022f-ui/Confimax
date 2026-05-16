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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error en la petición');
      }

      // Guardar token si viene en la respuesta
      if (data.token) {
        this.token = data.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('confimax_token', data.token);
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
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
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

  // Inventory Service
  async getProducts(params?: { limit?: number; offset?: number; category?: string }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/inventory/products${queryString}`);
  }

  async getProduct(id: string) {
    return this.request(`/inventory/products/${id}`);
  }

  async getCategories() {
    return this.request('/inventory/categories');
  }

  async searchProducts(query: string) {
    return this.request(`/inventory/products/search?q=${encodeURIComponent(query)}`);
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

  // Notifications Service
  async getNotifications(params?: { limit?: number; unread?: boolean }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/notifications${queryString}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
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
