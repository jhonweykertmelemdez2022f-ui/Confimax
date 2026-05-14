/**
 * Tests de Arquitectura Hexagonal - Capa de Aplicación
 * Auth Use Cases Tests
 * 
 * Estos tests prueban los casos de uso que orquestan el dominio.
 * Utilizan mocks de los puertos (repositorios) para aislar la lógica de negocio.
 */

const AuthUseCases = require('../../../../services/auth-service/src/application/auth.usecases');

describe('Application: Auth Use Cases (Arquitectura Hexagonal)', () => {
  
  // Mock del repositorio (puerto)
  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    verifyPassword: jest.fn()
  };

  // Mock de servicio de token
  const mockTokenService = {
    generateToken: jest.fn(),
    verifyToken: jest.fn()
  };

  let authUseCases;

  beforeEach(() => {
    authUseCases = new AuthUseCases(mockUserRepository, mockTokenService);
    jest.clearAllMocks();
  });

  describe('login()', () => {
    test('debe autenticar usuario válido y retornar token', async () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'vendedor1',
        email: 'vendedor@confimax.com',
        password: '$2a$10$hashedpassword',
        role: 'vendor',
        active: true
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.verifyPassword.mockResolvedValue(true);
      mockTokenService.generateToken.mockReturnValue('jwt-token-123');

      const result = await authUseCases.login('vendedor@confimax.com', 'SecurePass123!');

      expect(result.user).toBeDefined();
      expect(result.token).toBe('jwt-token-123');
      expect(result.user.email).toBe('vendedor@confimax.com');
    });

    test('debe rechazar usuario inactivo', async () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'inactivo@confimax.com',
        password: '$2a$10$hashedpassword',
        active: false
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.verifyPassword.mockResolvedValue(true);

      await expect(
        authUseCases.login('inactivo@confimax.com', 'SecurePass123!')
      ).rejects.toThrow('Usuario inactivo');
    });

    test('debe rechazar credenciales inválidas', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authUseCases.login('noexiste@confimax.com', 'WrongPass')
      ).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('register()', () => {
    test('debe registrar nuevo usuario correctamente', async () => {
      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'nuevouser',
        email: 'nuevo@confimax.com',
        role: 'vendor'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser);
      mockTokenService.generateToken.mockReturnValue('jwt-token-123');

      const result = await authUseCases.register({
        username: 'nuevouser',
        email: 'nuevo@confimax.com',
        password: 'SecurePass123!',
        role: 'vendor'
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    test('debe rechazar email duplicado', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        email: 'existente@confimax.com'
      });

      await expect(
        authUseCases.register({
          username: 'nuevouser',
          email: 'existente@confimax.com',
          password: 'SecurePass123!'
        })
      ).rejects.toThrow('El email ya está registrado');
    });
  });

  describe('getUserById()', () => {
    test('debe retornar usuario por ID', async () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@confimax.com'
      };

      mockUserRepository.findById.mockResolvedValue(user);

      const result = await authUseCases.getUserById(user.id);

      expect(result).toEqual(user);
    });

    test('debe lanzar error si usuario no existe', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authUseCases.getUserById('non-existent-id')
      ).rejects.toThrow('Usuario no encontrado');
    });
  });
});
