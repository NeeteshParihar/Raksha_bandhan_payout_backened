import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/error_handling.js';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the error is our custom ApiError, return its specific status and message
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // For unhandled/unknown errors, log them and return a generic 500 error
  console.error("Unhandled Error: ", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

