import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('/users/login');
});

// Signup
router.get('/signup', (req, res) => {
    res.render('signup', { values: {}, error: null });
});

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).render('signup', { values: { username, email }, error: 'All fields are required.' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING user_id, username, email`,
            [username.trim(), email.trim(), hash]
        );
        req.session.user = { user_id: result.rows[0].user_id, username: result.rows[0].username, email: result.rows[0].email };
        res.redirect('/');
    } catch (err) {
        console.error('Signup error:', err?.message || err);
        const msg = (err?.code === '23505') ? 'Username or email already exists.' : 'Signup failed.';
        res.status(400).render('signup', { values: { username, email }, error: msg });
    }
});

// Login
router.get('/login', (req, res) => {
    res.render('login', { values: {}, error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).render('login', { values: { username }, error: 'Username and password required.' });
    }
    try {
        const result = await pool.query(
            `SELECT user_id, username, email, password_hash FROM users WHERE username=$1`,
            [username.trim()]
        );
        const user = result.rows[0];
        if (!user) {
            return res.status(401).render('login', { values: { username }, error: 'Invalid credentials.' });
        }
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).render('login', { values: { username }, error: 'Invalid credentials.' });
        }
        req.session.user = { user_id: user.user_id, username: user.username, email: user.email };
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err?.message || err);
        res.status(500).render('login', { values: { username }, error: 'Login failed.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

export default router;
