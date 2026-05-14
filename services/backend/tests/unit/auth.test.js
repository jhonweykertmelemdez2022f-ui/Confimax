const bcrypt = require('bcryptjs');
const AuthService = require('../../src/services/auth.service');
const { User } = require('../../src/models/user.model');

// Mock del modelo User
jest.mock('../../src/models/user.model', () => ({
  User: {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'vendor',
      };

      User.findByUsername.mockResolvedValue(null);
      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 1,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      });

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('id');
      expect(result.username).toBe(userData.username);
      expect(User.create).toHaveBeenCalled();
    });

    it('should throw error if username already exists', async () => {
      User.findByUsername.mockResolvedValue({ id: 1, username: 'existing' });

      await expect(AuthService.register({
        username: 'existing',
        email: 'test@test.com',
        password: 'password123',
      })).rejects.toThrow('Username or email already exists');
    });

    it('should throw error if email already exists', async () => {
      User.findByUsername.mockResolvedValue(null);
      User.findByEmail.mockResolvedValue({ id: 1, email: 'existing@test.com' });

      await expect(AuthService.register({
        username: 'newuser',
        email: 'existing@test.com',
        password: 'password123',
      })).rejects.toThrow('Username or email already exists');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'vendor',
        password: hashedPassword,
      };

      User.findByUsername.mockResolvedValue(mockUser);
      User.updateLastLogin.mockResolvedValue(true);

      const result = await AuthService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('testuser');
    });

    it('should throw error for invalid username', async () => {
      User.findByUsername.mockResolvedValue(null);

      await expect(AuthService.login({
        username: 'nonexistent',
        password: 'password123',
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      User.findByUsername.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
      });

      await expect(AuthService.login({
        username: 'testuser',
        password: 'wrongpassword',
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('me', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role: 'vendor',
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await AuthService.me(1);

      expect(result).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      const mockUsers = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
      ];

      User.list.mockResolvedValue(mockUsers);

      const result = await AuthService.listUsers(50, 0);

      expect(result).toEqual(mockUsers);
      expect(User.list).toHaveBeenCalledWith(50, 0);
    });
  });
});
