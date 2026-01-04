process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./dev.test.db';

import request from 'supertest';
import app from '../../src/index';

describe('GET /health', () => {
  it('should respond 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
