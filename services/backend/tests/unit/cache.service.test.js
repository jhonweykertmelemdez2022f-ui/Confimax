const { getOrSet, invalidate, invalidatePattern } = require('../../src/services/cache.service');
const { messageQueue, getRedisClient } = require('../../src/services/redis.service');

const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
  unlink: jest.fn().mockResolvedValue(1),
};

jest.mock('../../src/services/redis.service', () => ({
  connectRedis: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn(() => mockRedisClient),
  messageQueue: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
}));

describe('cache.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrSet', () => {
    it('returns cached data on cache hit', async () => {
      messageQueue.get.mockResolvedValue({ id: 1, name: 'Cached' });

      const fetchFn = jest.fn();
      const result = await getOrSet('product:1', fetchFn, 300);

      expect(result).toEqual({ id: 1, name: 'Cached' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('fetches and caches on cache miss', async () => {
      messageQueue.get.mockResolvedValue(null);
      const fetched = { id: 2, name: 'Fresh' };
      const fetchFn = jest.fn().mockResolvedValue(fetched);

      const result = await getOrSet('product:2', fetchFn, 300);

      expect(result).toEqual(fetched);
      expect(fetchFn).toHaveBeenCalled();
      expect(messageQueue.set).toHaveBeenCalledWith('product:2', fetched, 300);
    });

    it('falls back to DB when Redis read fails', async () => {
      messageQueue.get.mockRejectedValue(new Error('Redis down'));
      const fetched = { id: 3, name: 'Fallback' };
      const fetchFn = jest.fn().mockResolvedValue(fetched);

      const result = await getOrSet('product:3', fetchFn, 300);

      expect(result).toEqual(fetched);
      expect(fetchFn).toHaveBeenCalled();
    });

    it('falls back to DB when Redis write fails', async () => {
      messageQueue.get.mockResolvedValue(null);
      messageQueue.set.mockRejectedValue(new Error('Redis write fail'));
      const fetched = { id: 4, name: 'NoCache' };
      const fetchFn = jest.fn().mockResolvedValue(fetched);

      const result = await getOrSet('product:4', fetchFn, 300);

      expect(result).toEqual(fetched);
    });
  });

  describe('invalidatePattern', () => {
    it('deletes keys matching pattern via SCAN+UNLINK', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce({ cursor: 10, keys: ['product:1', 'product:2'] })
        .mockResolvedValueOnce({ cursor: 0, keys: ['product:3'] });

      await invalidatePattern('product:*', 2);

      expect(mockRedisClient.scan).toHaveBeenCalledWith(0, { MATCH: 'product:*', COUNT: 2 });
      expect(mockRedisClient.unlink).toHaveBeenCalledWith(['product:1', 'product:2']);
      expect(mockRedisClient.unlink).toHaveBeenCalledWith(['product:3']);
    });

    it('handles Redis failure gracefully', async () => {
      mockRedisClient.scan.mockRejectedValue(new Error('Redis scan fail'));

      await expect(invalidatePattern('product:*')).resolves.toBeUndefined();
    });
  });
});
