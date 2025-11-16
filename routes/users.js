import express from 'express';
const router = express.Router();

// Placeholder for future login/signup in Phase 2
router.get('/', (req, res) => {
    res.send(`
        <h1>User Page Placeholder</h1>
        <button onclick="window.location.href='/'">Go Back</button>
    `);
});

export default router;
