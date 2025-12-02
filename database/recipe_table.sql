CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    cuisine TEXT,
    difficulty TEXT,
    cook_time TEXT,
    image_url TEXT
);
