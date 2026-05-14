/**
 * ============================================================
 * CACHE SERVICE GENÉRICO CON FALLBACK
 * ============================================================
 * Helper de alto nivel para leer/escribir en Redis con tolerancia
 * a fallos: si Redis no está disponible, se sirve directamente
 * desde PostgreSQL sin romper la petición.
 *
 * Funciones:
 *   getOrSet(key, fetchFn, ttl) → cache hit / fetch + cache
 *   invalidate(key)             → borra una clave
 *   invalidatePattern(pattern)    → borra claves por patrón (SCAN + DEL)
 */

const { messageQueue, getRedisClient } = require('./redis.service');

const DEFAULT_TTL = 300; // 5 minutos

/**
 * Intenta obtener de caché; si no existe, ejecuta fetchFn,
 * guarda el resultado y lo retorna.
 *
 * @param {string} key       Clave de caché
 * @param {function} fetchFn Función asíncrona que devuelve los datos
 * @param {number} ttl       Tiempo de vida en segundos
 * @returns {Promise<any>}
 */
async function getOrSet(key, fetchFn, ttl = DEFAULT_TTL) {
  try {
    const cached = await messageQueue.get(key);
    if (cached !== null) {
      return cached;
    }
  } catch (err) {
    console.warn(`[CACHE] Error leyendo Redis (${key}):`, err.message);
    // Fallback: continuar sin caché
  }

  const data = await fetchFn();

  // Guardar en caché solo si fetch tuvo éxito y Redis está vivo
  if (data !== undefined && data !== null) {
    try {
      await messageQueue.set(key, data, ttl);
    } catch (err) {
      console.warn(`[CACHE] Error escribiendo Redis (${key}):`, err.message);
    }
  }

  return data;
}

/**
 * Invalida una clave específica.
 * @param {string} key
 */
async function invalidate(key) {
  try {
    await messageQueue.del(key);
  } catch (err) {
    console.warn(`[CACHE] Error invalidando Redis (${key}):`, err.message);
  }
}

/**
 * Invalida claves por patrón usando SCAN para evitar bloquear Redis.
 * Ejemplo: invalidatePattern('product:*') borra product:1, product:list:..., etc.
 *
 * @param {string} pattern  Patrón glob-style (ej. 'product:*')
 * @param {number} count  Cantidad de claves por iteración SCAN
 */
async function invalidatePattern(pattern, count = 100) {
  try {
    const client = getRedisClient();
    let cursor = 0;
    let totalDeleted = 0;

    do {
      const scanResult = await client.scan(cursor, { MATCH: pattern, COUNT: count });
      cursor = scanResult.cursor;
      const keys = scanResult.keys;

      if (keys.length > 0) {
        await client.unlink(keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== 0);

    if (totalDeleted > 0) {
      console.log(`[CACHE] Invalidadas ${totalDeleted} claves con patrón "${pattern}"`);
    }
  } catch (err) {
    console.warn(`[CACHE] Error invalidando patrón "${pattern}":`, err.message);
  }
}

module.exports = {
  getOrSet,
  invalidate,
  invalidatePattern,
  DEFAULT_TTL,
};
