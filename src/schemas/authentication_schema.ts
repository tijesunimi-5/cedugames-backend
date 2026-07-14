//This contains the Authentication's ZOD validation schemas for the request body
import { z } from "zod";

const RegisterUserSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.number().int().positive(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

//Login Zod Schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
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
  otp: z.number().min(6),
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
  newPassword: z.string().min(6),
});

//update password zod schema
const UpdatePassword = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export {
  RegisterUserSchema,
  LoginSchema,
  GoogleAuthSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
  ResetPasswordSchema,
  UpdatePassword
};
