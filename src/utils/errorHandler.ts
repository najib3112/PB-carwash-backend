import { Request, Response, NextFunction } from 'express';

// Interface untuk error response yang konsisten
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  timestamp: string;
  path: string;
}

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error untuk debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  if (err.code === 'P2025') {
    const message = 'Record not found';
    error = new AppError(message, 404);
  }

  if (err.code === 'P2003') {
    const message = 'Invalid input data';
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = 'Invalid input data';
    error = new AppError(message, 400);
  }

  const response: ErrorResponse = {
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Tambahkan details jika dalam development mode
  if (process.env.NODE_ENV === 'development') {
    response.details = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Success response helper
export const successResponse = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Error response helper
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  details?: any
) => {
  const response: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const message = `Route ${req.originalUrl} not found`;
  const error = new AppError(message, 404);
  next(error);
};
