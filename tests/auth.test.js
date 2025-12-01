import request from 'supertest';
import app from '../app.js';

describe('Auth routes', () => {
  test('GET /users/login should render login page', async () => {
    const res = await request(app).get('/users/login');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Login/);
    expect(res.text).toMatch(/name=\"username\"/);
  });

  test('GET /users/signup should render signup page', async () => {
    const res = await request(app).get('/users/signup');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Sign Up/);
    expect(res.text).toMatch(/name=\"email\"/);
  });
});
