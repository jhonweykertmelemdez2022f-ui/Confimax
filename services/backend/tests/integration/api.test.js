const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock de modelos antes de importar
jest.mock('../../src/models/index', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
  },
  initConnections: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn(),
  getMongoose: jest.fn(() => jest.requireActual('mongoose')),
}));

jest.mock('../../src/services/audit.service', () => ({
  log: jest.fn().mockResolvedValue(undefined),
  logLogin: jest.fn().mockResolvedValue(undefined),
  logLogout: jest.fn().mockResolvedValue(undefined),
  logRegister: jest.fn().mockResolvedValue(undefined),
  getLogs: jest.fn().mockResolvedValue([]),
  getUserActivity: jest.fn().mockResolvedValue([]),
}));

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

jest.mock('../../src/models/product.model', () => ({
  Product: {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  },
  Category: {
    list: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/models/sale.model', () => ({
  Sale: {
    findById: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    list: jest.fn(),
    dailySummary: jest.fn(),
  },
}));

jest.mock('../../src/models/customer.model', () => ({
  Customer: {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  },
  Credit: {
    findByCustomer: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/models/notification.model', () => ({
  Notification: {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../src/controllers/health.controller', () => ({
  status: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      service: 'backend',
      status: 'OK',
      databases: {
        postgres: 'connected',
        redis: 'connected',
        mongo: 'connected',
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }),
  readiness: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      ready: true,
      details: { postgres: true, redis: true, mongo: true },
    });
  }),
}));

const { User } = require('../../src/models/user.model');
const { Product, Category } = require('../../src/models/product.model');
const { Sale } = require('../../src/models/sale.model');
const { Customer, Credit } = require('../../src/models/customer.model');
const { Notification } = require('../../src/models/notification.model');
const { pool } = require('../../src/models/index');

const routes = require('../../src/routes');
const config = require('../../src/config');

const app = express();
app.use(express.json());
app.use('/api', routes);

const generateToken = (payload) => jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });

describe('API Integration Tests', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = generateToken({ id: 1, role: 'admin' });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('service', 'backend');
      expect(res.body).toHaveProperty('databases');
    });
  });

  describe('Auth Routes', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        User.findByUsername.mockResolvedValue(null);
        User.findByEmail.mockResolvedValue(null);
        User.create.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@test.com',
          role: 'vendor',
        });

        const res = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: 'test@test.com',
            password: 'password123',
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('username', 'testuser');
      });

      it('should fail if username exists', async () => {
        User.findByUsername.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'existing',
            email: 'test@test.com',
            password: 'password123',
          });

        expect(res.status).toBe(500);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login and return token', async () => {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 10);

        User.findByUsername.mockResolvedValue({
          id: 1,
          username: 'testuser',
          password: hashedPassword,
          role: 'vendor',
        });

        const res = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'password123',
          });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
      });

      it('should fail with invalid credentials', async () => {
        User.findByUsername.mockResolvedValue(null);

        const res = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'nonexistent',
            password: 'wrong',
          });

        expect(res.status).toBe(500);
      });
    });

    describe('GET /api/auth/me', () => {
      it('should return current user with valid token', async () => {
        User.findById.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@test.com',
          role: 'admin',
        });

        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('username');
      });

      it('should fail without token', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/auth/users', () => {
      it('should list users with auth', async () => {
        User.list.mockResolvedValue([
          { id: 1, username: 'user1' },
          { id: 2, username: 'user2' },
        ]);

        const res = await request(app)
          .get('/api/auth/users')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });
  });

  describe('Inventory Routes', () => {
    describe('GET /api/products', () => {
      it('should list products', async () => {
        Product.list.mockResolvedValue([
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ]);

        const res = await request(app)
          .get('/api/products')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should fail without auth', async () => {
        const res = await request(app).get('/api/products');

        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/products/:id', () => {
      it('should return a product', async () => {
        Product.findById.mockResolvedValue({ id: 1, name: 'Product 1' });

        const res = await request(app)
          .get('/api/products/1')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
      });

      it('should return 404 if not found', async () => {
        Product.findById.mockResolvedValue(null);

        const res = await request(app)
          .get('/api/products/999')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
      });
    });

    describe('POST /api/products', () => {
      it('should create a product', async () => {
        Product.create.mockResolvedValue({
          id: 1,
          name: 'New Product',
          sku: 'SKU001',
        });

        const res = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'New Product',
            sku: 'SKU001',
            unit_price: 100,
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('name', 'New Product');
      });
    });

    describe('GET /api/categories', () => {
      it('should list categories', async () => {
        Category.list.mockResolvedValue([
          { id: 1, name: 'Category 1' },
          { id: 2, name: 'Category 2' },
        ]);

        const res = await request(app)
          .get('/api/categories')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });
  });

  describe('Sales Routes', () => {
    describe('GET /api/sales', () => {
      it('should list sales', async () => {
        Sale.list.mockResolvedValue([
          { id: 1, total: 1000 },
          { id: 2, total: 2000 },
        ]);

        const res = await request(app)
          .get('/api/sales')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('GET /api/sales/:id', () => {
      it('should return a sale with items', async () => {
        Sale.findById.mockResolvedValue({
          id: 1,
          total: 1000,
          items: [{ product_id: 1, quantity: 2 }],
        });

        const res = await request(app)
          .get('/api/sales/1')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('items');
      });
    });

    describe('GET /api/sales/summary/daily', () => {
      it('should return daily summary', async () => {
        Sale.dailySummary.mockResolvedValue({
          date: '2024-01-15',
          count: 10,
          total: 5000,
        });

        const res = await request(app)
          .get('/api/sales/summary/daily?date=2024-01-15')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('count');
      });

      it('should fail without date', async () => {
        const res = await request(app)
          .get('/api/sales/summary/daily')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
      });
    });
  });

  describe('Customers Routes', () => {
    describe('GET /api/customers', () => {
      it('should list customers', async () => {
        Customer.list.mockResolvedValue([
          { id: 1, name: 'Customer 1' },
          { id: 2, name: 'Customer 2' },
        ]);

        const res = await request(app)
          .get('/api/customers')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('GET /api/customers/:id/credits', () => {
      it('should return customer credits', async () => {
        Credit.findByCustomer.mockResolvedValue([
          { id: 1, amount: 500 },
        ]);

        const res = await request(app)
          .get('/api/customers/1/credits')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });
  });

  describe('Notifications Routes', () => {
    describe('GET /api/notifications', () => {
      it('should list notifications', async () => {
        Notification.limit.mockResolvedValue([
          { _id: '1', title: 'Notif 1' },
        ]);

        const res = await request(app)
          .get('/api/notifications?user_id=1')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/notifications/unread/:user_id', () => {
      it('should return unread count', async () => {
        Notification.countDocuments.mockResolvedValue(5);

        const res = await request(app)
          .get('/api/notifications/unread/1')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('unread_count', 5);
      });
    });
  });
});
