import Redis from 'ioredis';

/**
 * Servicio de Caché con Redis
 * Estrategias: Cache-Aside, TTL por tipo de dato
 */

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis conectado');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Error Redis:', err.message);
    });

    // TTL por tipo de dato (segundos)
    this.TTL = {
      USER: 300,              // 5 minutos
      USER_SESSION: 3600,     // 1 hora
      COURSE: 600,            // 10 minutos
      COURSE_LIST: 180,       // 3 minutos
      ENROLLMENT: 300,        // 5 minutos
      FORUM_TOPIC: 180,       // 3 minutos
      FORUM_LIST: 120,        // 2 minutos
      RESOURCE: 600,          // 10 minutos
      RATE_LIMIT: 60,         // 1 minuto
      PASSWORD_RESET: 900,    // 15 minutos
      STATS: 60,              // 1 minuto
      SEARCH_RESULTS: 300,    // 5 minutos
      API_RESPONSE: 60        // 1 minuto
    };
  }

  // ============================================
  // MÉTODOS BÁSICOS
  // ============================================

  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      return await this.redis.exists(key) === 1;
    } catch (error) {
      return false;
    }
  }

  async flush() {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // ============================================
  // CACHÉ ESPECÍFICO POR ENTIDAD
  // ============================================

  // Usuarios
  async getUser(userId) {
    return this.get(`user:${userId}`);
  }

  async setUser(userId, userData) {
    return this.set(`user:${userId}`, userData, this.TTL.USER);
  }

  async invalidateUser(userId) {
    return this.del(`user:${userId}`);
  }

  // Sesiones de usuario (para auth)
  async getSession(sessionId) {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId, sessionData) {
    return this.set(`session:${sessionId}`, sessionData, this.TTL.USER_SESSION);
  }

  async invalidateSession(sessionId) {
    return this.del(`session:${sessionId}`);
  }

  // Cursos
  async getCourse(courseId) {
    return this.get(`course:${courseId}`);
  }

  async setCourse(courseId, courseData) {
    return this.set(`course:${courseId}`, courseData, this.TTL.COURSE);
  }

  async invalidateCourse(courseId) {
    await this.del(`course:${courseId}`);
    await this.invalidateCourseList();
  }

  // Lista de cursos (con paginación)
  async getCourseList(page = 1, limit = 10, filters = {}) {
    const filterKey = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':');
    const key = `courses:list:${page}:${limit}:${filterKey || 'all'}`;
    return this.get(key);
  }

  async setCourseList(page, limit, filters, data) {
    const filterKey = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':');
    const key = `courses:list:${page}:${limit}:${filterKey || 'all'}`;
    return this.set(key, data, this.TTL.COURSE_LIST);
  }

  async invalidateCourseList() {
    const keys = await this.redis.keys('courses:list:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Inscripciones
  async getUserEnrollments(userId) {
    return this.get(`enrollments:user:${userId}`);
  }

  async setUserEnrollments(userId, data) {
    return this.set(`enrollments:user:${userId}`, data, this.TTL.ENROLLMENT);
  }

  async invalidateUserEnrollments(userId) {
    return this.del(`enrollments:user:${userId}`);
  }

  // Foro
  async getForumTopic(topicId) {
    return this.get(`forum:topic:${topicId}`);
  }

  async setForumTopic(topicId, data) {
    return this.set(`forum:topic:${topicId}`, data, this.TTL.FORUM_TOPIC);
  }

  async getForumTopics(categoryId, page = 1, limit = 20) {
    return this.get(`forum:topics:${categoryId}:${page}:${limit}`);
  }

  async setForumTopics(categoryId, page, limit, data) {
    return this.set(`forum:topics:${categoryId}:${page}:${limit}`, data, this.TTL.FORUM_LIST);
  }

  async invalidateForumTopic(topicId) {
    await this.del(`forum:topic:${topicId}`);
  }

  // Recursos
  async getResource(resourceId) {
    return this.get(`resource:${resourceId}`);
  }

  async setResource(resourceId, data) {
    return this.set(`resource:${resourceId}`, data, this.TTL.RESOURCE);
  }

  // Búsquedas
  async getSearchResults(query, type = 'all') {
    const key = `search:${type}:${Buffer.from(query).toString('base64')}`;
    return this.get(key);
  }

  async setSearchResults(query, type, results) {
    const key = `search:${type}:${Buffer.from(query).toString('base64')}`;
    return this.set(key, results, this.TTL.SEARCH_RESULTS);
  }

  // ============================================
  // RATE LIMITING
  // ============================================

  async checkRateLimit(identifier, maxRequests = 100, windowSeconds = 60) {
    const key = `ratelimit:${identifier}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    const ttl = await this.redis.ttl(key);
    
    return {
      allowed: current <= maxRequests,
      current,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetIn: ttl > 0 ? ttl : windowSeconds
    };
  }

  // Rate limit específico por endpoint
  async checkAuthRateLimit(identifier) {
    return this.checkRateLimit(`auth:${identifier}`, 5, 300); // 5 intentos en 5 min
  }

  async checkApiRateLimit(identifier) {
    return this.checkRateLimit(`api:${identifier}`, 1000, 60); // 1000 requests/min
  }

  // ============================================
  // TOKENS TEMPORALES
  // ============================================

  async storePasswordResetToken(userId, tokenHash) {
    const key = `passwordreset:${tokenHash}`;
    await this.set(key, { userId, createdAt: Date.now() }, this.TTL.PASSWORD_RESET);
    return true;
  }

  async getPasswordResetToken(tokenHash) {
    return this.get(`passwordreset:${tokenHash}`);
  }

  async invalidatePasswordResetToken(tokenHash) {
    return this.del(`passwordreset:${tokenHash}`);
  }

  // ============================================
  // CONTADORES Y ESTADÍSTICAS
  // ============================================

  async incrementCounter(key, amount = 1) {
    return this.redis.incrby(key, amount);
  }

  async getCounter(key) {
    const value = await this.redis.get(key);
    return parseInt(value) || 0;
  }

  // Contadores con expiración (para estadísticas diarias)
  async incrementDailyCounter(metric, entityId) {
    const today = new Date().toISOString().split('T')[0];
    const key = `stats:daily:${today}:${metric}:${entityId}`;
    const result = await this.redis.incr(key);
    await this.redis.expire(key, 86400 * 7); // Mantener 7 días
    return result;
  }

  async getStats(metric, entityId, days = 7) {
    const dates = [];
    const results = {};
    
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      dates.push(date);
      const key = `stats:daily:${date}:${metric}:${entityId}`;
      results[date] = this.getCounter(key);
    }
    
    const values = await Promise.all(Object.values(results));
    return dates.reduce((acc, date, i) => {
      acc[date] = values[i];
      return acc;
    }, {});
  }

  // ============================================
  // PATTERNS DE CACHÉ AVANZADOS
  // ============================================

  // Cache-Aside: Intenta obtener del caché, sino ejecuta función y guarda
  async cacheAside(key, fetchFunction, ttl) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFunction();
    if (data !== null && data !== undefined) {
      await this.set(key, data, ttl);
    }
    return data;
  }

  // Write-Through: Actualiza caché y DB simultáneamente
  async writeThrough(key, data, ttl, writeFunction) {
    await this.set(key, data, ttl);
    return writeFunction(data);
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck() {
    try {
      const ping = await this.redis.ping();
      return ping === 'PONG';
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // LIMPIEZA
  // ============================================

  async invalidateByPattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      return keys.length;
    }
    return 0;
  }

  async close() {
    await this.redis.quit();
  }
}

// Singleton
const cacheService = new CacheService();

export default cacheService;
export { CacheService };
