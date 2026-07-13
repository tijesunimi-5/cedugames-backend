//This handles the global error handling
import { Request, Response, NextFunction } from "express";

export const handleGlobalErrors = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    err.status === 400 &&
    "body" in err
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON format payload provided.",
    });
    return;
  }

  // This log the complete error stack trace on the server terminal for debugging
  console.error("⚠️ Global Error Caught: ", err.message || err);

  // This extract the error status code (defaults to 500 Internal Server Error)
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  // This return a clean, safe JSON format response to the frontend client
  res.status(statusCode).json({
    success: false,
    message,
    // Only expose raw system stack traces when debugging locally, never in production
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};