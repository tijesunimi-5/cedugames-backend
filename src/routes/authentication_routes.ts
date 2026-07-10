//This contains the authentication deffinitions (carries the containers)
import { Router } from "express";
import pool from "../config/database_connection";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  LoginSchema,
  RegisterUserInput,
  RegisterUserSchema,
} from "../schemas/authentication_schema";
import { success } from "zod";
import { comparePassword, hashPassword } from "../helpers/hashPassword";

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
    const hashedPassword = await hashPassword(password);
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

//---------------------------------------------------------//
//-----------------LOGIN ENDPOINT-------------------------//
//--------------------------------------------------------//
router.post("/login", async (req, res) => {
  try {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        errors: validation.error.issues,
      });
      return;
    }

    //This gets the validated data from the request body after going through zod checkings
    const { email, password } = validation.data;

    const query = `SELECT id, name, username, email, password, role FROM users WHERE email = $1;
    `;
    const database_connection = await pool.query(query, [email]);
    const database_result = database_connection.rows[0];

    //Checks if the database returns an empty data - which means user email doesn't exist
    if (!database_result) {
      res.status(404).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    //checks password after email is confirmed to be valid
    const passwordMatch = await comparePassword(
      password,
      database_result.password,
    );

    if (!passwordMatch) {
      res.status(401).json({ success: false, message: "Invalid Password!" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      { id: database_result.id, role: database_result.role },
      jwtSecret,
      {
        expiresIn: "24h",
      },
    );

    res.status(200).json({
      success: true,
      message: "Sign In successful.",
      token,
      user: {
        name: database_result.name,
        username: database_result.username,
        email: database_result.email
      },
    });
  } catch (error) {
    console.log("An error occured while signing in:", error);
    res.status(500).json({
      success: false,
      message: "An error occured while Signing in."
    })
  }
});

export default router;
