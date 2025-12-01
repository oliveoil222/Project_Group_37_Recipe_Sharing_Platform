import express from 'express';
import { pool } from '../db.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// GET /recipes - list recipes
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, title, cuisine, difficulty, cook_time, image_url, created_at
             FROM recipes
             ORDER BY id DESC`
        );
        res.render('recipes', { recipes: result.rows, error: null });
    } catch (err) {
        console.error('Fetch recipes error:', err?.message || err);
        // Gracefully render with no data if DB isn't configured
        res.render('recipes', { recipes: [], error: 'Database not ready or query failed.' });
    }
});

// GET /recipes/new - show create form
router.get('/new', ensureAuthenticated,(req, res) => {
    res.render('recipe-form', {
        values: { title: '', 
                  ingredients: '', 
                  instructions: '', 
                  cuisine: '', 
                  difficulty: '', 
                  cook_time: '', 
                  image_url: '' },
        error: null
    });
});

// POST /recipes - create a recipe
router.post('/', ensureAuthenticated,async (req, res) => {
    const { title, ingredients, instructions, cuisine, difficulty, cook_time, image_url } = req.body;

    if (!title || !ingredients || !instructions) {
        return res.status(400).render('recipe-form', {
            values: { title, ingredients, instructions, cuisine, difficulty, cook_time, image_url },
            error: 'Title, ingredients, and instructions are required.'
        });
    }

    // trim fields
    const trimmedTitle = title.trim();
    const trimmedIngredients = ingredients.trim();
    const trimmedInstructions = instructions.trim();
    const trimmedCuisine = cuisine ? cuisine.trim() : null;
    const trimmedDifficulty = difficulty ? difficulty.trim() : null;
    const trimmedImageUrl = image_url ? image_url.trim() : null;

    let cookTimeValue = null;
    if ( cook_time && cook_time.trim() !== '' ) {
        cookTimeValue = parseInt(cook_time.trim(), 10);
        if ( Number.isNaN(cookTimeValue) || cookTimeValue < 0 ) {
            return res.status(400).render('recipe-form', {
                values: { title, ingredients, instructions, cuisine, difficulty, cook_time, image_url },
                error: 'Cook time must be a non-negative integer.'
            });
        }   
    }

    try {
        const insert = await pool.query(
            `INSERT INTO recipes (user_id, title, ingredients, instructions, cuisine, difficulty, cook_time, image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id`,
            [ req.session.user.user_id, trimmedTitle, trimmedIngredients, trimmedInstructions, trimmedCuisine, trimmedDifficulty, cookTimeValue, trimmedImageUrl ]
        );
        const id = insert.rows[0].id;
        res.redirect(`/recipes/${id}`);
    } catch (err) {
        console.error('Create recipe error:', err?.message || err);
        res.status(500).render('recipe-form', {
            values: { title, ingredients, instructions, cuisine, difficulty, cook_time, image_url },
            error: 'Failed to save recipe. Is the database configured and the table created?'
        });
    }
});

// GET /recipes/:id - view single recipe
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, title, ingredients, instructions, cuisine, difficulty, cook_time, image_url, created_at
             FROM recipes WHERE id = $1`,
            [id]
        );
        if (!result.rows[0]) {
            return res.status(404).send('Recipe not found');
        }
        res.render('recipe-view', { recipe: result.rows[0] });
    } catch (err) {
        console.error('Fetch recipe error:', err?.message || err);
        res.status(500).send('Failed to fetch recipe.');
    }
});

export default router;
