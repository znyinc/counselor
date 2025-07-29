/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/shared';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Custom error class for application errors
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new CustomError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  // Mongoose duplicate key
  if (err.code === '11000') {
    const message = 'Duplicate field value entered';
    error = new CustomError(message, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation error';
    error = new CustomError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new CustomError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new CustomError(message, 401, 'TOKEN_EXPIRED');
  }

  // OpenAI API errors
  if (err.message?.includes('OpenAI') || err.message?.includes('AI')) {
    if (err.message?.includes('quota') || err.message?.includes('rate limit')) {
      error = new CustomError(
        'AI service quota exceeded. Please try again later.',
        429,
        'AI_QUOTA_EXCEEDED'
      );
    } else if (err.message?.includes('timeout')) {
      error = new CustomError(
        'AI service timeout. Please try again.',
        408,
        'AI_TIMEOUT'
      );
    } else {
      error = new CustomError(
        'AI service temporarily unavailable',
        503,
        'AI_SERVICE_UNAVAILABLE'
      );
    }
  }

  // Network/Connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    error = new CustomError(
      'Service temporarily unavailable',
      503,
      'SERVICE_UNAVAILABLE'
    );
  }

  // Rate limit errors
  if (err.code === 'RATE_LIMIT_EXCEEDED') {
    error = new CustomError(
      'Too many requests, please try again later',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    },
    timestamp: new Date(),
  };

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'] as string;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    errorResponse.error.message = 'Something went wrong';
    errorResponse.error.code = 'INTERNAL_ERROR';
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse.error as any).stack = err.stack;
  }

  res.status(error.statusCode || 500).json(errorResponse);
};

/**
 * Validation error helper
 */
export const createValidationError = (message: string, field?: string): CustomError => {
  const error = new CustomError(message, 400, 'VALIDATION_ERROR');
  if (field) {
    (error as any).field = field;
  }
  return error;
};

/**
 * Not found error helper
 */
export const createNotFoundError = (resource: string): CustomError => {
  return new CustomError(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
};

/**
 * Unauthorized error helper
 */
export const createUnauthorizedError = (message: string = 'Unauthorized'): CustomError => {
  return new CustomError(message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden error helper
 */
export const createForbiddenError = (message: string = 'Forbidden'): CustomError => {
  return new CustomError(message, 403, 'FORBIDDEN');
};

/**
 * Bad request error helper
 */
export const createBadRequestError = (message: string): CustomError => {
  return new CustomError(message, 400, 'BAD_REQUEST');
};

/**
 * Service unavailable error helper
 */
export const createServiceUnavailableError = (message: string): CustomError => {
  return new CustomError(message, 503, 'SERVICE_UNAVAILABLE');
};