//This validates the JWTs and checks the user roles
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// This extend Express Request typings locally so TS knows 'req.user' is valid
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "user" | "admin";
  };
}

export const verifyPlayerToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;

    // Block request if header is missing or formatted incorrectly
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access Denied: Missing authorization token.",
      });
      return;
    }

    // Isolate the pure token string out of 'Bearer <token_string>'
    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access Denied: Missing authorization token.",
      });
      return;
    }

    // Verify and decode the JWT payload
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        success: false,
        message: "Server configuration error: missing JWT secret.",
      });
      return;
    }
    const verified = jwt.verify(token, secret as string);
    const decoded =
      typeof verified === "object" && verified !== null
        ? (verified as { id: string; role: "user" | "admin" })
        : null;

    if (
      !decoded ||
      typeof decoded.id !== "string" ||
      (decoded.role !== "user" && decoded.role !== "admin")
    ) {
      res.status(403).json({
        success: false,
        message: "Access Denied: Invalid or expired session token.",
      });
      return;
    }

    // Attach decoded payload details straight to the request lifecycle context
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Access Denied: Invalid or expired session token.",
    });
  }
};