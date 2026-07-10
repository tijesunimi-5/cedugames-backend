//This contains the authentication deffinitions (carries the containers)
import { Router } from "express";
import {
  RegisterUserRequest,
  RegisterUserResponse,
} from "../types/authentication_types";
import pool from "../config/database_connection";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  RegisterUserInput,
  RegisterUserSchema,
} from "../schemas/authentication_schema";

const router = Router();

//------------------------------------------------------//
/* THE REGISTRATION ENDPOINT (CREATE AN ACCOUNT)       */
//-----------------------------------------------------//

router.post("/user/register", async (req, res) => {
  try {
    //Validate the incoming body against Zod schema
    const validation = RegisterUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        errors: validation.error.issues,
      });
      return;
    }

    const { name, username, email, password, age } = validation.data;
    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(password, saltRound);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const insertQuery = `
      INSERT INTO users (id, name, username, email, password, age, role, total_xp, coins_count, lives_remaining, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'user', 0, 100, 3, NOW(), NOW()) RETURNING id, name, username, email, role;
    `;
    const otpQuery = `
      INSERT INTO otps (email, otp_code, purpose, expires_at)
      VALUES ($1, $2, 'register', NOW() + INTERVAL '15 minutes')
      ON CONFLICT (email, purpose) DO UPDATE 
      SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, is_used = false;
    `;
    await pool.query(otpQuery, [email, otpCode]);

    const database_result = await pool.query(insertQuery, [
      name,
      username,
      email,
      hashedPassword,
      age,
    ]);

    const newUser = database_result.rows[0];

    // Trigger the email service to send the otpCode to the user's email
    // await sendVerificationEmail(email, otpCode);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, jwtSecret, {
      expiresIn: "24h",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while registering the user.",
    });
  }
});

export default router;
