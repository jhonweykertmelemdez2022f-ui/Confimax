/**
 * Tests de Arquitectura Hexagonal - Capa de Dominio
 * User Entity Tests
 * 
 * Estos tests prueban la lógica de negocio pura sin dependencias externas.
 * Siguiendo el principio de Arquitectura Hexagonal, el dominio no debe depender
 * de frameworks ni bases de datos.
 */

const { validateUser, createUser } = require('../../../../services/auth-service/src/domain/user.entity');

describe('Domain: User Entity (Arquitectura Hexagonal)', () => {
  
  describe('validateUser()', () => {
    test('debe validar un usuario válido', () => {
      const user = {
        username: 'vendedor1',
        email: 'vendedor@confimax.com',
        password: 'SecurePass123!',
        role: 'vendor'
      };
      
      const result = validateUser(user);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('debe rechazar username menor a 3 caracteres', () => {
      const user = {
        username: 'ab',
        email: 'test@confimax.com',
        password: 'SecurePass123!'
      };
      
      const result = validateUser(user);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username debe tener al menos 3 caracteres');
    });

    test('debe rechazar email inválido', () => {
      const user = {
        username: 'vendedor1',
        email: 'email-invalido',
        password: 'SecurePass123!'
      };
      
      const result = validateUser(user);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email inválido');
    });

    test('debe rechazar password débil', () => {
      const user = {
        username: 'vendedor1',
        email: 'test@confimax.com',
        password: '123'
      };
      
      const result = validateUser(user);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password debe tener al menos 8 caracteres');
    });
  });

  describe('createUser()', () => {
    test('debe crear usuario con UUID válido', () => {
      const userData = {
        username: 'vendedor1',
        email: 'vendedor@confimax.com',
        password: 'SecurePass123!',
        role: 'vendor'
      };
      
      const user = createUser(userData);
      
      expect(user.id).toBeDefined();
      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(user.username).toBe('vendedor1');
      expect(user.active).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('debe hashear password correctamente', async () => {
      const userData = {
        username: 'vendedor1',
        email: 'vendedor@confimax.com',
        password: 'SecurePass123!'
      };
      
      const user = await createUser(userData);
      
      expect(user.password).not.toBe('SecurePass123!');
      expect(user.password).toMatch(/^\$2[aby]\$/); // Formato bcrypt
    });
  });
});
