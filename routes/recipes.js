import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.render('recipes');
});

router.get('/new', (req, res) => {
    res.render('recipe-form');
});

// full submission logic in Phase 2
router.post('/', (req, res) => {
    res.send("Recipe submission (placeholder)");
});

export default router;
