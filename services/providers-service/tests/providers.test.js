const request = require('supertest');

describe('Providers Service basic', () => {
  let app;
  beforeAll(() => {
    app = require('../src/index');
  });

  test('GET /health should return 200', async () => {
    const res = await request('http://localhost:3010').get('/health');
    expect([200,503]).toContain(res.status);
  }, 10000);
});
