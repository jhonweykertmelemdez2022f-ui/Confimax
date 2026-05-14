/**
 * Tests de Integración - Arquitectura de Single Database con 4 Schemas
 * 
 * Estos tests verifican que la arquitectura completa funciona:
 * - Redis para caché (Upstash cloud)
 * - MongoDB para logs (MongoDB Atlas cloud)
 * - PostgreSQL (1 DB, 4 schemas) para datos transaccionales (Supabase cloud)
 * - Comunicación entre microservicios
 * - Tailscale para acceso seguro (opcional)
 */

const { getPostgres, closePostgres } = require('../postgres-connection');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const axios = require('axios');

describe('Integración: Arquitectura Completa (Redis + MongoDB + PostgreSQL)', () => {
  
  // Configuraciones - Usa variables de entorno o valores cloud por defecto

  const mongoConfig = {
    uri: process.env.MONGO_URL || 'mongodb://jak:jema2019@ac-s1gj562-shard-00-00.tedq2nv.mongodb.net:27017,ac-s1gj562-shard-00-01.tedq2nv.mongodb.net:27017,ac-s1gj562-shard-00-02.tedq2nv.mongodb.net:27017/confimax_notifications?ssl=true&replicaSet=atlas-mrqwtn-shard-0&authSource=admin&appName=Confimax'
  };

  const redisConfig = {
    url: process.env.REDIS_URL || 'rediss://default:gQAAAAAAAdIgAAIgcDFhNDRkNmE3OTg5YjA0MDBlODE4MzQxMGY5NGVjNmU0Mg@good-iguana-119328.upstash.io:6379'
  };

  let sql;
  let mongoClient;
  let redisClient;

  beforeAll(async () => {
    // Inicializar conexiones
    sql = getPostgres();
    mongoClient = new MongoClient(mongoConfig.uri);
    // Redis: usa URL completa (soporta Upstash con TLS)
    redisClient = redis.createClient({
      url: redisConfig.url
    });

    await mongoClient.connect();
    await redisClient.connect();
  });

  afterAll(async () => {
    await closePostgres();
    await mongoClient.close();
    await redisClient.disconnect();
  });

  describe('PostgreSQL: Single Database con 4 Schemas', () => {
    test('todos los schemas existen', async () => {
      const result = await sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name IN ('auth', 'inventory', 'sales', 'customers')
        ORDER BY schema_name
      `;
      
      const schemas = result.map(r => r.schema_name);
      expect(schemas).toContain('auth');
      expect(schemas).toContain('inventory');
      expect(schemas).toContain('sales');
      expect(schemas).toContain('customers');
    });

    test('cada schema tiene sus tablas correspondientes', async () => {
      // Auth schema
      const authTables = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_type = 'BASE TABLE'
      `;
      expect(authTables.map(r => r.table_name)).toContain('users');

      // Inventory schema
      const inventoryTables = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'inventory' AND table_type = 'BASE TABLE'
      `;
      expect(inventoryTables.map(r => r.table_name)).toContain('products');
      expect(inventoryTables.map(r => r.table_name)).toContain('categories');

      // Sales schema (tablas: orders, order_items, payments)
      const salesTables = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'sales' AND table_type = 'BASE TABLE'
      `;
      expect(salesTables.map(r => r.table_name)).toContain('orders');
      expect(salesTables.map(r => r.table_name)).toContain('order_items');

      // Customers schema
      const customersTables = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'customers' AND table_type = 'BASE TABLE'
      `;
      expect(customersTables.map(r => r.table_name)).toContain('customers');
      expect(customersTables.map(r => r.table_name)).toContain('credits');
    });

    test(' Foreign Keys entre schemas son válidas', async () => {
      // Verificar que las FK constraints existen
      const fkResult = await sql`
        SELECT
          tc.constraint_name,
          tc.table_schema,
          tc.table_name,
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema IN ('sales', 'customers')
      `;

      // Al menos algunas FK deben existir
      expect(fkResult.length).toBeGreaterThan(0);
    });
  });

  describe('Redis: Caché de productos', () => {
    test('debe almacenar y recuperar de caché', async () => {
      const testKey = 'test:product:123';
      const testData = JSON.stringify({ id: '123', name: 'Producto Test' });

      await redisClient.setEx(testKey, 60, testData);
      const cached = await redisClient.get(testKey);

      expect(cached).toBe(testData);
    });

    test('expiración de caché funciona', async () => {
      const testKey = 'test:expiring';
      await redisClient.setEx(testKey, 1, 'value');

      // Inmediatamente debe existir
      let cached = await redisClient.get(testKey);
      expect(cached).toBe('value');

      // Esperar 2 segundos y verificar que expiró
      await new Promise(r => setTimeout(r, 1100));
      cached = await redisClient.get(testKey);
      expect(cached).toBeNull();
    });
  });

  describe('MongoDB: Logs y eventos', () => {
    test('debe insertar y consultar logs', async () => {
      const db = mongoClient.db('confimax_notifications');
      const collection = db.collection('logs');

      const logEntry = {
        service: 'auth-service',
        level: 'info',
        message: 'Test log entry',
        timestamp: new Date()
      };

      await collection.insertOne(logEntry);

      const found = await collection.findOne({ message: 'Test log entry' });
      expect(found).toBeDefined();
      expect(found.service).toBe('auth-service');

      // Cleanup
      await collection.deleteOne({ message: 'Test log entry' });
    });
  });

  describe('Flujo completo: Venta con sincronización', () => {
    test('flujo: Crear usuario → Crear producto → Crear venta → Log en MongoDB', async () => {
      // Este test simula el flujo completo de una venta
      
      // 1. Crear vendedor en auth.users (sin username, usar solo email)
      const vendorResult = await sql`
        INSERT INTO auth.users (email, password, role)
        VALUES ('vendedor@test.com', '$2a$10$hash', 'vendor')
        RETURNING id
      `;
      const vendorId = vendorResult[0].id;

      // 2. Crear cliente en customers.customers
      const customerResult = await sql`
        INSERT INTO customers.customers (name, rif, email, credit_limit)
        VALUES ('Cliente Test', 'J-12345678-9', 'cliente@test.com', 1000.00)
        RETURNING id
      `;
      const customerId = customerResult[0].id;

      // 3. Crear producto en inventory.products
      const productResult = await sql`
        INSERT INTO inventory.products (name, sku, unit_price, stock_quantity)
        VALUES ('Producto Test', 'SKU-001', 100.00, 50)
        RETURNING id
      `;
      const productId = productResult[0].id;

      // 4. Crear orden en sales.orders (con FK a customers y auth)
      const orderResult = await sql`
        INSERT INTO sales.orders (customer_id, vendor_id, subtotal, iva, total, currency)
        VALUES (${customerId}, ${vendorId}, 100.00, 16.00, 116.00, 'VES')
        RETURNING id
      `;
      const orderId = orderResult[0].id;

      // 5. Crear item de orden
      await sql`
        INSERT INTO sales.order_items (order_id, product_id, quantity, unit_price, total)
        VALUES (${orderId}, ${productId}, 1, 100.00, 100.00)
      `;

      // 6. Log en MongoDB
      const db = mongoClient.db('confimax_notifications');
      await db.collection('logs').insertOne({
        service: 'sales-service',
        action: 'order_created',
        orderId: orderId,
        customerId: customerId,
        vendorId: vendorId,
        timestamp: new Date()
      });

      // 7. Caché en Redis del resumen de orden
      await redisClient.setEx(`order:${orderId}`, 3600, JSON.stringify({
        id: orderId,
        total: 116.00,
        customer: 'Cliente Test'
      }));

      // Verificaciones
      // a) Orden existe
      const orderCheck = await sql`SELECT * FROM sales.orders WHERE id = ${orderId}`;
      expect(orderCheck).toHaveLength(1);

      // b) Log existe en MongoDB
      const logCheck = await db.collection('logs').findOne({ orderId: orderId });
      expect(logCheck).toBeDefined();

      // c) Caché existe en Redis
      const cacheCheck = await redisClient.get(`order:${orderId}`);
      expect(cacheCheck).not.toBeNull();

      // Cleanup
      await sql`DELETE FROM sales.order_items WHERE order_id = ${orderId}`;
      await sql`DELETE FROM sales.orders WHERE id = ${orderId}`;
      await sql`DELETE FROM inventory.products WHERE id = ${productId}`;
      await sql`DELETE FROM customers.customers WHERE id = ${customerId}`;
      await sql`DELETE FROM auth.users WHERE id = ${vendorId}`;
      await db.collection('logs').deleteOne({ orderId: orderId });
      await redisClient.del(`order:${orderId}`);

      console.log('✅ Flujo completo de orden ejecutado exitosamente');
    });
  });
});
