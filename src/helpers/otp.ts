import crypto from "node:crypto";
import { env } from "../config/env";

export const generateOtp = (): string => crypto.randomInt(100000, 1000000).toString();
export const hashOtp = (email: string, purpose: string, otp: string): string =>
  crypto.createHmac("sha256", env.JWT_SECRET).update(`${email}:${purpose}:${otp}`).digest("hex");
export const otpMatches = (expected: string, actual: string): boolean => {
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(actual, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};
