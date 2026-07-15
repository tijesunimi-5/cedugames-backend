// This file contains the database connection logic
import pkg from "pg";
const { Pool } = pkg as any;
import { env } from "./env";
const isProduction = env.NODE_ENV === "production" || env.DATABASE_URL.includes("neon.tech");

const pool = new Pool({
  connectionString: env.DATABASE_URL,
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
})



export default pool;
