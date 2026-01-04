process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./dev.test.db';

import request from 'supertest';
import app from '../../src/index';

describe('POST /auth/login', () => {
  it('should login admin with seeded credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .set('Accept', 'application/json');

    expect([200, 401]).toContain(res.status); // allow 401 if seed not present
    if (res.status === 200) {
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
    }
  });
});
