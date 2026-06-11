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
  (typeof window !== 'undefined' ? 'https://confimax-api-gateway-tfxa.onrender.com' : 'http://api-gateway:8080/api');

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface FabianaChatResponse {
  message: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private onTokenExpired: (() => void) | null = null;

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

  setOnTokenExpired(callback: () => void) {
    this.onTokenExpired = callback;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false
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

    // Agregar token si existe y no es una solicitud de Fabiana
    if (this.token && !skipAuth) {
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
        if (response.status === 401 && this.onTokenExpired) {
          this.clearToken();
          this.onTokenExpired();
        }
        
        let errorMsg = data.error || data.message || `Error en la petición: ${response.status}`;
        
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMsg = data.errors.map((e: any) => e.msg).join(', ');
        }
        
        throw new Error(errorMsg);
      }

      // Guardar token si viene en la respuesta
      const token = data.token || data.accessToken;
      if (token) {
        this.token = token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('confimax_token', token);
        }
      }

      return data as T;
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
      body: JSON.stringify({ name, username, email, password, role: 'customer' }),
    });
  }

  async logout() {
    try {
      return await this.request('/auth/logout', { method: 'POST' }, true);
    } catch (error) {
      console.warn('Error en logout del servidor, continuando con logout local:', error);
      return { success: true };
    } finally {
      this.clearToken();
    }
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
    cost?: number;
    is_active?: boolean;
    stock_quantity: number;
    category_id: string;
    image_url?: string;
    expiration_date?: string | null;
  }) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        cost: data.cost || data.price * 0.7,
        is_active: data.is_active !== undefined ? data.is_active : true,
        stock_quantity: data.stock_quantity,
        category_id: data.category_id,
        image_url: data.image_url,
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

  async getLowStock(threshold: number = 30) {
    return this.request(`/inventory/stock/low-stock?threshold=${threshold}`);
  }

  async getExpiringProducts(days: number = 7) {
    return this.request(`/products/alerts/expiring?days=${days}`);
  }

  // Sales Service - Overload para compatibilidad con CartContext
  async createSale(data: any): Promise<any>;
  
  async createSale(data: {
    customer_id?: string;
    items: Array<{ product_id: string; sku: string; product_name: string; quantity: number; unit_price: number }>;
    status?: string;
    notes?: string;
  } | {
    customerId?: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    paymentMethod: string;
  }) {
    // Convertir formato del CartContext al formato del backend
    let payload = data;
    
    if ('customerId' in data) {
      // Formato CartContext -> convertir a formato backend
      const items = data.items.map((item: any) => ({
        product_id: item.productId,
        sku: item.productId.substring(0, 8).toUpperCase(),
        product_name: 'Producto',
        quantity: item.quantity,
        unit_price: item.price
      }));
      
      payload = {
        customer_id: data.customerId,
        items,
        status: 'pending',
        notes: ''
      };
    }
    
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createCustomerSale(data: any) {
    // Similar conversion if needed
    let payload = data;
    if ('customerId' in data || ('items' in data && data.items[0]?.productId)) {
      const items = data.items.map((item: any) => ({
        product_id: item.productId,
        sku: item.productId.substring(0, 8).toUpperCase(),
        product_name: 'Producto',
        quantity: item.quantity,
        unit_price: item.price
      }));
      payload = {
        items,
        status: 'pending',
        notes: ''
      };
    }

    return this.request('/sales/customer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSales(params?: { limit?: number; offset?: number; status?: string; customer_id?: string }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/sales${queryString}`);
  }

  async getSale(id: string) {
    return this.request(`/sales/${id}`);
  }

  async updateSaleStatus(id: string, status: string) {
    return this.request(`/sales/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getOrderItems(id: string) {
    return this.request(`/sales/${id}/items`);
  }

  async getOrderPayments(id: string) {
    return this.request(`/sales/${id}/payments`);
  }

  async createPayment(data: {
    order_id: string;
    payment_method: string;
    amount: number;
    transaction_id?: string;
    status?: string;
  }) {
    return this.request('/sales/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Customers Service
  async getCustomers(params?: { limit?: number; offset?: number }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/customers${queryString}`);
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async getExpiringCredits(days: number = 7) {
    return this.request(`/credits/expiring?days=${days}`);
  }

  async getOverdueCredits() {
    return this.request('/credits/overdue');
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

  // Suppliers / Providers
  async getSuppliers(params?: { limit?: number; offset?: number }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/suppliers${queryString}`);
  }

  async getPurchases(params?: { limit?: number; offset?: number; supplier_id?: string }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/purchases${queryString}`);
  }

  async getSupplier(id: string) {
    return this.request(`/suppliers/${id}`);
  }
  
  async recordPurchase(supplierId: string, data: any) {
    return this.request(`/purchases/suppliers/${supplierId}`, { method: 'POST', body: JSON.stringify(data) });
  }

  async getExpiringInvoices(days: number = 7) {
    return this.request(`/purchases/expiring?days=${days}`);
  }

  async createSupplier(data: any) {
    return this.request('/suppliers', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateSupplier(id: string, data: any) {
    return this.request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteSupplier(id: string) {
    return this.request(`/suppliers/${id}`, { method: 'DELETE' });
  }

  async addSupplierProduct(supplierId: string, data: any) {
    return this.request(`/suppliers/${supplierId}/products`, { method: 'POST', body: JSON.stringify(data) });
  }

  async getSupplierProducts(supplierId: string) {
    return this.request(`/suppliers/${supplierId}/products`);
  }

  async createUser(data: { username: string; email: string; password?: string; role: string; active?: boolean }) {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password || 'Confimax123*',
        role: data.role,
        active: data.active !== undefined ? data.active : true
      }),
    });
  }

  async updateUser(id: string, data: { username?: string; email?: string; role?: string; active?: boolean }) {
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

  // Fabiana Chatbot Service
  async chatWithFabiana(messages: Array<{ role: 'user' | 'assistant'; content: string }>, role?: string) {
    return this.request('/fabiana/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, role: role || 'cliente' }),
    }, true);
  }

  async downloadProductsPDF() {
    const url = `${this.baseUrl}/fabiana/products/pdf`;
    
    const headers = new Headers();
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error('Error al descargar el PDF');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'productos-confimax.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Exportar instancia singleton
export const api = new ApiClient(API_BASE_URL);

// Exportar tipos
export type { ApiResponse };
