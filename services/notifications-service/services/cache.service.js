import Redis from 'ioredis';

/**
 * CACHE SERVICE - Redis para Confimax
 * Caché de productos, sesiones, carritos y más
 * 
 * Uso:
 *   import cache from './services/cache.service.js';
 *   
 *   // Guardar en caché
 *   await cache.setProduct(productId, productData);
 *   
 *   // Obtener de caché
 *   const product = await cache.getProduct(productId);
 *   
 *   // Sesiones
 *   await cache.setSession(token, userData);
 *   const user = await cache.getSession(token);
 */

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      password: 'redis_secure_2024',
      db: 0,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });

    this.redis.on('connect', () => {
      console.log('✅ Cache Service: Redis conectado');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Cache Service Error:', err.message);
    });

    // TTL por tipo de dato (segundos)
    this.TTL = {
      PRODUCT: 300,           // 5 minutos
      PRODUCT_LIST: 180,    // 3 minutos
      CUSTOMER: 300,        // 5 minutos
      CUSTOMER_LIST: 180,   // 3 minutos
      SALE: 60,             // 1 minuto (vistas recientes)
      USER_SESSION: 86400,    // 24 horas
      CART: 3600,           // 1 hora
      RATE_LIMIT: 60,       // 1 minuto
      STATS: 300,           // 5 minutos
      SYNC_TOKEN: 300       // 5 minutos
    };
  }

  // ============================================
  // PRODUCTOS
  // ============================================

  async getProduct(productId) {
    const data = await this.redis.get(`product:${productId}`);
    return data ? JSON.parse(data) : null;
  }

  async setProduct(productId, product) {
    return this.redis.setex(
      `product:${productId}`,
      this.TTL.PRODUCT,
      JSON.stringify(product)
    );
  }

  async deleteProduct(productId) {
    return this.redis.del(`product:${productId}`);
  }

  // Lista de productos (por categoría o búsqueda)
  async getProductList(key) {
    const data = await this.redis.get(`products:list:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async setProductList(key, products) {
    return this.redis.setex(
      `products:list:${key}`,
      this.TTL.PRODUCT_LIST,
      JSON.stringify(products)
    );
  }

  // ============================================
  // CLIENTES
  // ============================================

  async getCustomer(customerId) {
    const data = await this.redis.get(`customer:${customerId}`);
    return data ? JSON.parse(data) : null;
  }

  async setCustomer(customerId, customer) {
    return this.redis.setex(
      `customer:${customerId}`,
      this.TTL.CUSTOMER,
      JSON.stringify(customer)
    );
  }

  // ============================================
  // SESIONES DE USUARIO
  // ============================================

  async getSession(token) {
    const data = await this.redis.get(`session:${token}`);
    return data ? JSON.parse(data) : null;
  }

  async setSession(token, userData) {
    return this.redis.setex(
      `session:${token}`,
      this.TTL.USER_SESSION,
      JSON.stringify(userData)
    );
  }

  async deleteSession(token) {
    return this.redis.del(`session:${token}`);
  }

  // ============================================
  // CARROS DE VENTA (Temporal)
  // ============================================

  async getCart(cashierId) {
    const data = await this.redis.get(`cart:${cashierId}`);
    return data ? JSON.parse(data) : null;
  }

  async setCart(cashierId, cartData) {
    return this.redis.setex(
      `cart:${cashierId}`,
      this.TTL.CART,
      JSON.stringify(cartData)
    );
  }

  async deleteCart(cashierId) {
    return this.redis.del(`cart:${cashierId}`);
  }

  // ============================================
  // RATE LIMITING (Evitar abuso)
  // ============================================

  async checkRateLimit(key, maxRequests = 100, windowSeconds = 60) {
    const current = await this.redis.incr(`ratelimit:${key}`);
    
    if (current === 1) {
      await this.redis.expire(`ratelimit:${key}`, windowSeconds);
    }
    
    return {
      allowed: current <= maxRequests,
      current,
      remaining: Math.max(0, maxRequests - current),
      resetIn: windowSeconds
    };
  }

  // ============================================
  // ESTADÍSTICAS EN TIEMPO REAL
  // ============================================

  async getStats(key) {
    const data = await this.redis.get(`stats:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async setStats(key, stats) {
    return this.redis.setex(
      `stats:${key}`,
      this.TTL.STATS,
      JSON.stringify(stats)
    );
  }

  // Incrementar contador (ej: ventas del día)
  async incrementCounter(key, amount = 1, ttl = null) {
    const newValue = await this.redis.incrby(`counter:${key}`, amount);
    
    if (newValue === amount && ttl) {
      await this.redis.expire(`counter:${key}`, ttl);
    }
    
    return newValue;
  }

  async getCounter(key) {
    const value = await this.redis.get(`counter:${key}`);
    return value ? parseInt(value) : 0;
  }

  // ============================================
  // TOKENS DE SINCRONIZACIÓN (Offline-First)
  // ============================================

  async getSyncToken(deviceId) {
    return this.redis.get(`sync:${deviceId}`);
  }

  async setSyncToken(deviceId, token) {
    return this.redis.setex(
      `sync:${deviceId}`,
      this.TTL.SYNC_TOKEN,
      token
    );
  }

  // ============================================
  // MÉTODOS GENERALES
  // ============================================

  async get(key) {
    const data = await this.redis.get(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return data;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    const data = typeof value === 'object' ? JSON.stringify(value) : value;
    return this.redis.setex(key, ttlSeconds, data);
  }

  async delete(key) {
    return this.redis.del(key);
  }

  async exists(key) {
    return this.redis.exists(key);
  }

  // Limpiar toda la caché (⚠️ cuidado)
  async flushAll() {
    return this.redis.flushdb();
  }

  // Información de Redis
  async info() {
    const info = await this.redis.info();
    return {
      usedMemory: info.match(/used_memory:(\d+)/)?.[1],
      connectedClients: info.match(/connected_clients:(\d+)/)?.[1],
      uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1]
    };
  }

  // Cerrar conexión
  async disconnect() {
    await this.redis.quit();
  }
}

// Instancia única
const cache = new CacheService();

export default cache;
export { CacheService };
