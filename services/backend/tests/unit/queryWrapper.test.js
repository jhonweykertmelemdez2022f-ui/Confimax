const { query, transaction, detectOperation, extractEntity, extractRecordId, asyncLocalStorage } = require('../../src/database/queryWrapper');
const { pool } = require('../../src/models');
const { emitEntityEvent } = require('../../src/events/emitter');

jest.mock('../../src/events/emitter', () => ({
  emitEntityEvent: jest.fn(),
}));

describe('queryWrapper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectOperation', () => {
    it('detects CREATE from INSERT', () => {
      expect(detectOperation('INSERT INTO products...')).toBe('CREATE');
    });
    it('detects UPDATE', () => {
      expect(detectOperation('UPDATE products SET...')).toBe('UPDATE');
    });
    it('detects DELETE', () => {
      expect(detectOperation('DELETE FROM products...')).toBe('DELETE');
    });
    it('returns null for SELECT', () => {
      expect(detectOperation('SELECT * FROM products')).toBeNull();
    });
  });

  describe('extractEntity', () => {
    it('extracts table from INSERT', () => {
      expect(extractEntity('INSERT INTO products (name) VALUES ($1)')).toBe('PRODUCTS');
    });
    it('extracts table from UPDATE', () => {
      expect(extractEntity('UPDATE products SET name = $1 WHERE id = $2')).toBe('PRODUCTS');
    });
    it('extracts table from DELETE', () => {
      expect(extractEntity('DELETE FROM products WHERE id = $1')).toBe('PRODUCTS');
    });
  });

  describe('extractRecordId', () => {
    it('extracts id from WHERE id = $N', () => {
      expect(extractRecordId('UPDATE products SET name = $1 WHERE id = $2', ['foo', 42])).toBe(42);
    });
    it('returns null when no WHERE id', () => {
      expect(extractRecordId('UPDATE products SET active = true', [])).toBeNull();
    });
  });

  describe('query', () => {
    beforeEach(() => {
      pool.query = jest.fn();
    });

    it('passes SELECT directly without emitting events', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await query('SELECT * FROM products WHERE id = $1', [1]);

      expect(result.rows[0].id).toBe(1);
      expect(emitEntityEvent).not.toHaveBeenCalled();
    });

    it('emits entity.created on INSERT', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 5, name: 'Test' }] });

      await asyncLocalStorage.run(
        { userId: 'u1', username: 'admin', ip: '127.0.0.1', endpoint: 'POST /api/products', userAgent: 'jest' },
        async () => query('INSERT INTO products (name) VALUES ($1) RETURNING *', ['Test'])
      );

      expect(emitEntityEvent).toHaveBeenCalledWith('CREATE', expect.objectContaining({
        entity: 'PRODUCTS',
        recordId: 5,
        newData: { id: 5, name: 'Test' },
        userId: 'u1',
      }));
    });

    it('fetches oldData before UPDATE and emits entity.updated', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Old', price: 10 }] })  // SELECT oldData
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'New', price: 20 }] });   // UPDATE result

      await asyncLocalStorage.run(
        { userId: 'u2', ip: '127.0.0.1' },
        async () => query('UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *', ['New', 20, 1])
      );

      expect(emitEntityEvent).toHaveBeenCalledWith('UPDATE', expect.objectContaining({
        entity: 'PRODUCTS',
        oldData: { id: 1, name: 'Old', price: 10 },
        newData: { id: 1, name: 'New', price: 20 },
        userId: 'u2',
      }));
    });

    it('fetches oldData before DELETE and emits entity.deleted', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 3, name: 'Gone' }] })  // SELECT oldData
        .mockResolvedValueOnce({ rows: [] });                        // DELETE result

      await query('DELETE FROM products WHERE id = $1', [3]);

      expect(emitEntityEvent).toHaveBeenCalledWith('DELETE', expect.objectContaining({
        entity: 'PRODUCTS',
        recordId: 3,
        oldData: { id: 3, name: 'Gone' },
      }));
    });

    it('does not emit event if PG fails', async () => {
      pool.query.mockRejectedValue(new Error('PG down'));

      await expect(query('INSERT INTO products (name) VALUES ($1)', ['Test'])).rejects.toThrow('PG down');
      expect(emitEntityEvent).not.toHaveBeenCalled();
    });
  });

  describe('transaction', () => {
    it('buffers events until COMMIT and emits them', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
        _pendingEvents: [],
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      await transaction(async (client) => {
        await query('INSERT INTO sales (total) VALUES ($1) RETURNING *', [100], client);
      });

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(emitEntityEvent).toHaveBeenCalledWith('CREATE', expect.objectContaining({ entity: 'SALES' }));
    });

    it('discards buffered events on ROLLBACK', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
        _pendingEvents: [],
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      await expect(
        transaction(async (client) => {
          await query('INSERT INTO sales (total) VALUES ($1) RETURNING *', [100], client);
          throw new Error('fail');
        })
      ).rejects.toThrow('fail');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(emitEntityEvent).not.toHaveBeenCalled();
    });
  });
});
