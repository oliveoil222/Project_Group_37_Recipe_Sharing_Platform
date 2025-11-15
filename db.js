// db.js

// imports
import dotenv from 'dotenv';
import pkg from 'pg';

// configure
dotenv.config();

// instance
const { Pool } = pkg;

// database connection
export const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
});