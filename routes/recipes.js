import express from 'express';
import { pool } from '../db.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// GET /recipes - list recipes with search, filters, rating, sorting
router.get('/', async (req, res) => {
    const { query, difficulty, minRating, sort } = req.query;

    let whereClauses = [];
    let values = [];
    let param = 1;

    // Keyword search
    if (query && query.trim() !== "") {
        whereClauses.push(`(r.title ILIKE $${param} OR r.ingredients ILIKE $${param})`);
        values.push(`%${query.trim()}%`);
        param++;
    }

    // Difficulty filter
    if (difficulty && difficulty !== "") {
        whereClauses.push(`r.difficulty = $${param}`);
        values.push(difficulty);
        param++;
    }

    // Base select with LEFT JOIN ratings
    let sql = `
        SELECT 
            r.id,
            r.title,
            r.cuisine,
            r.difficulty,
            r.cook_time,
            r.image_url,
            ROUND(AVG(rt.rating)::numeric, 1)::float AS avg_rating,
            COUNT(rt.id) AS rating_count
        FROM recipes r
        LEFT JOIN ratings rt ON rt.recipe_id = r.id
    `;

    if (whereClauses.length > 0) {
        sql += ` WHERE ` + whereClauses.join(" AND ");
    }

    sql += ` GROUP BY r.id `;

    if (minRating && !isNaN(minRating)) {
        sql += ` HAVING ROUND(AVG(rt.rating)::numeric, 1)::float >= $${param}`;
        values.push(Number(minRating));
        param++;
    }

    // Sorting
    if (sort === "rating") {
        sql += ` ORDER BY avg_rating DESC NULLS LAST`;
    } else {
        sql += ` ORDER BY r.id DESC`;
    }

    try {
        const result = await pool.query(sql, values);

        res.render("recipes", {
            recipes: result.rows,
            error: null,
            filters: {
                query: query || "",
                difficulty: difficulty || "",
                minRating: minRating || "",
                sort: sort || ""
            }
        });

    } catch (err) {
        console.error("Fetch recipes error:", err);

        res.render("recipes", {
            recipes: [],
            error: "Database error.",
            filters: {
                query: query || "",
                difficulty: difficulty || "",
                minRating: minRating || "",
                sort: sort || ""
            }
        });
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
    const { title, ingredients, instructions, cuisine, 
            difficulty, cook_time, image_url } = req.body;

    if (!title || !ingredients || !instructions) {
        return res.status(400).render('recipe-form', {
            values: { title, ingredients, instructions, 
                      cuisine, difficulty, cook_time, image_url },
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

    // validate cook_time if provided
    let cookTimeValue = null;
    if ( cook_time && cook_time.trim() !== '' ) {
        cookTimeValue = parseInt(cook_time.trim(), 10);
        if ( Number.isNaN(cookTimeValue) || cookTimeValue < 0 ) {
            return res.status(400).render('recipe-form', {
                values: { title, ingredients, instructions, 
                          cuisine, difficulty, cook_time, image_url },
                error: 'Cook time must be a non-negative integer.'
            });
        }   
    }

    // insert into DB
    try {
        const insert = await pool.query(
            `INSERT INTO recipes (user_id, title, ingredients, instructions, 
                                  cuisine, difficulty, cook_time, image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id`,
            [ req.session.user.user_id, trimmedTitle, trimmedIngredients, 
              trimmedInstructions, trimmedCuisine, trimmedDifficulty, 
              cookTimeValue, trimmedImageUrl ]
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
            `SELECT r.id, r.title, r.ingredients, r.instructions,
                    r.cuisine, r.difficulty, r.cook_time, r.image_url,
                    ROUND(AVG(rt.rating)::numeric, 1)::float AS avg_rating,
                    COUNT(rt.id) AS rating_count
            FROM recipes r
            LEFT JOIN ratings rt ON rt.recipe_id = r.id
            WHERE r.id = $1
            GROUP BY r.id`,
            [id]
        );
        if (!result.rows[0]) {
            return res.status(404).send('Recipe not found');
        }

        let user_rating = null;
        if (req.session && req.session.user) {
            const ur = await pool.query(
                `SELECT rating FROM ratings WHERE recipe_id=$1 AND user_id=$2`,
                [id, req.session.user.user_id]
            );
            user_rating = ur.rows[0]?.rating || null;
        }

        res.render('recipe-view', { recipe: result.rows[0], user_rating });
    } catch (err) {
        console.error('Fetch recipe error:', err?.message || err);
        res.status(500).send('Failed to fetch recipe.');
    }
});

// POST /recipes/:id/rate - submit or update rating
router.post('/:id/rate', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.session.user.user_id;

    const parsed = parseInt(rating, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 5) {
        return res.status(400).json({ ok: false, error: 'Rating must be an integer 1-5.' });
    }

    try {
        // Ensure recipe exists
        const recipeCheck = await pool.query(`SELECT id FROM recipes WHERE id=$1`, [id]);
        if (!recipeCheck.rows[0]) {
            return res.status(404).json({ ok: false, error: 'Recipe not found.' });
        }

        // Upsert rating
        await pool.query(
            `INSERT INTO ratings (recipe_id, user_id, rating)
             VALUES ($1, $2, $3)
             ON CONFLICT (recipe_id, user_id)
             DO UPDATE SET rating = EXCLUDED.rating`,
            [id, userId, parsed]
        );

        // Return new average
        const avg = await pool.query(
            `SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS rating_count
             FROM ratings WHERE recipe_id=$1`,
            [id]
        );

        return res.json({ ok: true, avg_rating: avg.rows[0].avg_rating, rating_count: avg.rows[0].rating_count });
    } catch (err) {
        console.error('Rating submit error:', err?.message || err);
        return res.status(500).json({ ok: false, error: 'Failed to submit rating.' });
    }
});

export default router;
