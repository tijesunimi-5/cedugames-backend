import bcrypt from "bcrypt";
import pool from "../config/database_connection";
import { hashPassword } from "./hashPassword";

export const updateUserPasswordInDB = async (
  email: string,
  clearTextPassword: string,
): Promise<void> => {
  const hashedPassword = await hashPassword(clearTextPassword);
  await pool.query(
    "UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2;",
    [hashedPassword, email],
  );
};
