//This contains the Authentication's ZOD validation schemas for the request body
import { z } from "zod";

const RegisterUserSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(10).max(128),
  age: z.number().int().positive(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

//Login Zod Schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(128),
});
const AdminLoginSchema = LoginSchema;
export type LoginInput = z.infer<typeof LoginSchema>;

// Google Authentication Zod Schema
const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
});

// Forgot password zod schema
const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

//Verify-otp Zod Schema\
const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly six digits"),
  purpose: z.enum(["register", "password_reset"], {
    error: "Invalid OTP Purpose Specified",
  }),
});

//resend otp zod schema
const ResendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  purpose: z.enum(["register", "password_reset"], {
    error: "Invalid OTP Purpose Specified",
  }),
});

//reset-password zod schema
const ResetPasswordSchema = z.object({
  newPassword: z.string().min(10).max(128),
});

//update password zod schema
const UpdatePassword = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(10).max(128),
});
const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/, "Username must be 3-40 characters using letters, numbers, dots, underscores, or hyphens."),
  age: z.number().int().min(1).max(130),
});

export {
  RegisterUserSchema,
  LoginSchema,
  AdminLoginSchema,
  GoogleAuthSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
  ResetPasswordSchema,
  UpdatePassword
  ,UpdateProfileSchema
};
