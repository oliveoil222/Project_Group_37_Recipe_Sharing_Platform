import request from 'supertest';
import app from '../app.js';

describe('Recipes routes', () => {
  test('GET / should render homepage', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Recipe Sharing Platform/);
  });

  test('GET /recipes should render list and search form', async () => {
    const res = await request(app).get('/recipes');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<form method=\"GET\" action=\"\\/recipes\"/);
    expect(res.text).toMatch(/Search by title or ingredients/);
  });

  test('GET /recipes?difficulty=Easy should not error', async () => {
    const res = await request(app).get('/recipes?difficulty=Easy');
    expect(res.status).toBe(200);
  });
});
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import recipeRoutes from '../routes/recipes.js';

// Minimal app for testing routes
function makeApp() {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));

  // Fake login middleware for tests
  app.use((req, res, next) => {
    req.session.user = { user_id: 1, username: 'tester' };
    next();
  });
  app.use('/recipes', recipeRoutes);
  return app;
}

describe('Recipes integration', () => {
  const app = makeApp();

  test('GET /recipes lists recipes (no DB may return empty)', async () => {
    const res = await request(app).get('/recipes');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html');
  });

  test('Search UI has form elements', async () => {
    const res = await request(app).get('/recipes');
    expect(res.text).toContain('recipe-search');
    expect(res.text).toContain('name="query"');
    expect(res.text).toContain('name="difficulty"');
  });
});
