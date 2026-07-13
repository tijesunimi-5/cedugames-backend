// This file contains the database connection logic
import pkg from "pg";
const { Pool } = pkg as any;
import dotenv from "dotenv";

dotenv.config();
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon.tech');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('Database connection established successfully. ')
});

pool.on('error', (err: Error) => {
  console.error("Unexpected database pool error:", err);
  process.exit(-1);
})



export default pool;