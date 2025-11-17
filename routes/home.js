import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { title: 'Recipe Sharing Platform' });
});

export default router;
