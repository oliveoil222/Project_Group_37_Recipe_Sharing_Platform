-- Ensure users table exists
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample users
INSERT INTO users (username, email, password_hash)
VALUES
('testuser1', 'test1@example.com', 'hash123'),
('testuser2', 'test2@example.com', 'hash123'),
('testuser3', 'test3@example.com', 'hash123')
ON CONFLICT (email) DO NOTHING;
