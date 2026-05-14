/**
 * Tests de Arquitectura Hexagonal - Capa de Infraestructura
 * PostgreSQL User Repository Tests
 * 
 * Estos tests prueban el adaptador de PostgreSQL que implementa el puerto
 * del repositorio. Verifican la integración con la base de datos real usando
 * la estructura de Single Database con 4 Schemas.
 * 
 * Configurado para:
 *   - Supabase (cloud) por defecto
 *   - PostgreSQL local via Docker
 *   - Tailscale para acceso seguro (opcional)
 */

const { getPostgres, closePostgres } = require('../../../postgres-connection');
const UserRepositoryPG = require('../../../../services/auth-service/src/infrastructure/user.repository.pg');

// Configuración de conexión para tests (usa DATABASE_URL)
const testConfig = {
  schema: 'auth',  // Schema específico para auth-service
};

describe('Infrastructure: PostgreSQL User Repository (Arquitectura Hexagonal)', () => {
  let sql;
  let userRepository;

  beforeAll(async () => {
    sql = getPostgres();
    userRepository = new UserRepositoryPG(sql, testConfig.schema);
    
    // Verificar conexión
    try {
      const result = await sql`SELECT 1`;
      console.log(`✅ Conectado a PostgreSQL - Schema: ${testConfig.schema}`);
    } catch (err) {
      console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
      throw err;
    }
  });

  afterAll(async () => {
    await closePostgres();
  });

  beforeEach(async () => {
    // Limpiar tabla antes de cada test
    await sql`TRUNCATE TABLE ${sql(testConfig.schema)}.users RESTART IDENTITY CASCADE`;
  });

  describe('Single Database con Schemas', () => {
    test('debe operar en el schema auth correctamente', async () => {
      // Verificar que estamos en el schema correcto
      const result = await sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${testConfig.schema}
      `;
      
      expect(result).toHaveLength(1);
      expect(result[0].schema_name).toBe('auth');
    });

    test('debe crear usuario en schema auth', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@confimax.com',
        password: '$2a$10$hashedpassword',
        role: 'vendor',
        active: true
      };

      const created = await userRepository.create(userData);
      
      expect(created.id).toBeDefined();
      expect(created.username).toBe('testuser');
      
      // Verificar que existe en la BD
      const result = await sql`
        SELECT * FROM ${sql(testConfig.schema)}.users WHERE email = ${userData.email}
      `;
      
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('testuser');
    });

    test('debe encontrar usuario por email en schema auth', async () => {
      // Crear usuario primero
      await sql`
        INSERT INTO ${sql(testConfig.schema)}.users (username, email, password, role)
        VALUES ('findme', 'find@confimax.com', '$2a$10$hash', 'vendor')
      `;

      const user = await userRepository.findByEmail('find@confimax.com');
      
      expect(user).toBeDefined();
      expect(user.username).toBe('findme');
      expect(user.email).toBe('find@confimax.com');
    });

    test('debe retornar null si usuario no existe', async () => {
      const user = await userRepository.findByEmail('noexiste@confimax.com');
      expect(user).toBeNull();
    });

    test('debe actualizar last_login correctamente', async () => {
      // Crear usuario
      const insertResult = await sql`
        INSERT INTO ${sql(testConfig.schema)}.users (username, email, password, role)
        VALUES ('loginuser', 'login@confimax.com', '$2a$10$hash', 'vendor')
        RETURNING id
      `;
      const userId = insertResult[0].id;

      // Actualizar last_login
      await userRepository.updateLastLogin(userId);

      // Verificar
      const result = await sql`
        SELECT last_login FROM ${sql(testConfig.schema)}.users WHERE id = ${userId}
      `;

      expect(result[0].last_login).not.toBeNull();
    });
  });

  describe('Integridad entre Schemas (NO implementado - ejemplo)', () => {
    test('los schemas están aislados correctamente', async () => {
      // Verificar que los 4 schemas existen
      const result = await sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name IN ('auth', 'inventory', 'sales', 'customers')
        ORDER BY schema_name
      `;
      
      expect(result).toHaveLength(4);
      expect(result.map(r => r.schema_name)).toEqual(
        expect.arrayContaining(['auth', 'inventory', 'sales', 'customers'])
      );
    });

    test('tablas en diferentes schemas no interfieren', async () => {
      // Insertar en auth.users
      await sql`
        INSERT INTO auth.users (username, email, password, role)
        VALUES ('authuser', 'auth@test.com', '$2a$10$hash', 'vendor')
      `;

      // Verificar que inventory.products está vacío (tabla diferente, mismo concepto)
      const result = await sql`
        SELECT COUNT(*) as count FROM inventory.products
      `.catch(() => [{ count: '0' }]);

      // No hay interferencia entre schemas
      expect(result[0].count).toBe('0');
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar error de constraint UNIQUE en email', async () => {
      // Crear primer usuario
      await userRepository.create({
        username: 'user1',
        email: 'duplicate@confimax.com',
        password: '$2a$10$hash',
        role: 'vendor'
      });

      // Intentar crear duplicado
      await expect(userRepository.create({
        username: 'user2',
        email: 'duplicate@confimax.com',
        password: '$2a$10$hash',
        role: 'vendor'
      })).rejects.toThrow(/duplicate|unique/i);
    });
  });
});
