// app.js

// imports
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { pool } from './db.js';

import homeRoutes from './routes/home.js';
import recipeRoutes from './routes/recipes.js';
import userRoutes from './routes/users.js';

// configure
dotenv.config();

// server set up
const app = express();
const PORT = process.env.PORT || 4000;

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// view engine and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Ensure templates are always reloaded and not cached in dev
app.disable('view cache');

app.use(express.static(path.join(__dirname, 'public')));

// middleware
app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(express.json());                         // for JSON (if needed)

// session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
}));

// provide safe default locals for templates
app.use((req, res, next) => {
    if (typeof res.locals.error === 'undefined') res.locals.error = null;
    next();
});

// make logged-in users available in ejs templates
app.use( (req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});


/*
******************************
*********** ROUTES ***********
******************************
*/

// render homepage
app.get('/', (req, res) => {
    res.render('index', { title: 'Recipe Sharing Platform' });
});

// test DB connection
app.get('/db-test', async (req, res) => {
    try {

        // send time query to pgAdmin
        const result = await pool.query('SELECT NOW() AS now');

        // validate
        res.json({ ok: true, now: result.rows[0].now });
    } 
    
    // error handling
    catch (err) {
        console.error('DB test error:', err);
        res.status(500).json({ ok: false, error: 'Database connection failed' });
    }
});

// TEMPORARY TEST: insert user into table
app.get('/test-create-user', async (req, res) => {
    try {

        // test query
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, email, created_at`,
            ['testuser', 'test@example.com', 'fakehash123']
        );

        // validate
        res.json({ ok: true, user: result.rows[0] });
    } 
    
    // error handling
    catch (err) {
        console.error('Test user insert error:', err);
        res.status(500).json({ ok: false, error: 'Insert failed' });
    }
});

// TEMPORARY TEST: list users in table
app.get('/test-users', async (req, res) => {
    try {

        // test query
        const result = await pool.query(
            `SELECT user_id, username, email, created_at 
            FROM users ORDER BY user_id`
        );

        // validate
        res.json({ ok: true, users: result.rows });
    } 
    
    // error handling
    catch (err) {
        console.error('Fetch users error:', err);
        res.status(500).json({ ok: false, error: 'Select failed' });
    }
});

app.use('/', homeRoutes);
app.use('/recipes', recipeRoutes);
app.use('/users', userRoutes);

// start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});