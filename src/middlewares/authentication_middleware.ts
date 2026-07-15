import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import pool from "../config/database_connection";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: "user" | "admin"; ver: number };
}

export const verifyPlayerToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) { res.status(401).json({ success: false, message: "Missing authorization token." }); return; }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: "cedugames-api", audience: "cedugames-client" }) as { id: string; role: "user" | "admin"; ver: number };
    const result = await pool.query("SELECT role,token_version FROM users WHERE id=$1", [decoded.id]);
    const user = result.rows[0];
    if (!user || user.role !== decoded.role || user.token_version !== decoded.ver) throw new Error("Session revoked");
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid, expired, or revoked session token." });
  }
};
