import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  ZEPTOMAIL_TOKEN: z.string().default(""),
  ZEPTOMAIL_FROM_EMAIL: z.union([z.literal(""), z.string().email()]).default(""),
  ZEPTOMAIL_FROM_NAME: z.string().min(1).default("CeduGames"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}
if (parsed.data.NODE_ENV === "production") {
  const missing = [
    !parsed.data.GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID",
    !parsed.data.ZEPTOMAIL_TOKEN && "ZEPTOMAIL_TOKEN",
    !parsed.data.ZEPTOMAIL_FROM_EMAIL && "ZEPTOMAIL_FROM_EMAIL",
  ].filter(Boolean);
  if (missing.length) throw new Error(`Missing production configuration: ${missing.join(", ")}`);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean),
};
