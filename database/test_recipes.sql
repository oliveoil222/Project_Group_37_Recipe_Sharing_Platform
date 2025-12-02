-- Ensure recipes table exists
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    cuisine TEXT,
    difficulty TEXT,
    cook_time TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample recipes
INSERT INTO recipes (user_id, title, ingredients, instructions, cuisine, difficulty, cook_time, image_url)
VALUES
(
    1,
    'Shredded Saucy BBQ Chicken Sammies',
    '1 cup chicken stock
1 bottle Mexican beer
4 pieces, 6 ounces each boneless, skinless chicken breast
2 tablespoons extra-virgin olive oil, 2 turns of the pan
2 cloves garlic, chopped
1 medium onion, peeled and finely chopped
2 tablespoons Worcestershire sauce
1 tablespoon hot sauce (Tabasco recommended)
2 tablespoons grill seasoning (Montreal Steak Seasoning)
3 tablespoons dark brown sugar
4 tablespoons tomato paste
1 large sour deli pickle, chopped
6 to 8 slices sweet bread and butter pickles, chopped
6 soft sammy buns',
    'Bring liquids to a simmer and poach chicken for 10 minutes.
Sauté garlic and onion until soft.  
Mix sauce ingredients with 2 ladles of poaching liquid.  
Shred chicken and simmer with onions and garlic 5–10 mins.  
Serve on rolls topped with pickle relish.',
    'American',
    'Easy',
    '25 minutes',
    'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2009/3/16/0/TM1001_30855-_s4x3.jpg.rend.hgtvcom.1280.720.suffix/1547591055394.webp'
),
(
    1,
    'Alfredo Shrimp Scampi Dump Dinner',
    '4 tablespoons unsalted butter, cubed
12 ounces rotini pasta
1 pound frozen shrimp
2 cups chicken broth
1/4 teaspoon red pepper flakes
2 cloves garlic, minced
Zest of 1/2 lemon
Salt and pepper
1/2 cup Parmesan
1/3 cup parsley, chopped
1/2 cup heavy cream, warmed',
    'Grease casserole dish.
Layer pasta, shrimp, butter, broth, spices, garlic, and lemon zest.
Cover and bake at 425°F for 30–35 minutes.
Stir in cream and top with Parmesan + parsley.',
    'Italian-American',
    'Easy',
    '40 minutes',
    'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2019/1/07/0/FNK_Shrimp-Scampi-Dump-Dinner_s4x3.jpg.rend.hgtvcom.1280.720.suffix/1546894452608.webp'
),
(
    1,
    'Lemon Parmesan Chicken with Arugula Salad Topping',
    '1 cup all-purpose flour
Salt and pepper
2 eggs
1 1/2 cups seasoned breadcrumbs
1/2 cup grated Parmesan
1 teaspoon lemon zest
1 teaspoon chopped thyme
6 chicken breasts
Butter and olive oil
5 ounces arugula
1/4 cup lemon juice
1/4 lb Parmesan chunk',
    'Prepare flour, egg, and breadcrumb stations.
Pound chicken thin; dredge through flour, egg, and crumbs.
Pan fry 2–3 minutes per side.
Dress arugula with lemon vinaigrette.
Top each chicken breast with arugula + shaved Parmesan.',
    'Italian-American',
    'Easy',
    '35 minutes',
    'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2018/2/23/0/BX1401_Lemon-Parmesan-Chicken_s4x3.jpg.rend.hgtvcom.826.620.suffix/1519403185474.webp'
);
