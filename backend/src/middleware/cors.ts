/**
 * CORS configuration middleware
 */

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

/**
 * CORS configuration options
 */
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-API-Key',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200, // For legacy browser support
};

/**
 * Configure CORS middleware
 */
export const configureCors = () => {
  return cors(corsOptions);
};

/**
 * Custom CORS handler for specific routes
 */
export const customCorsHandler = (
  allowedOrigins: string[],
  allowedMethods: string[] = ['GET', 'POST']
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  };
};

/**
 * Preflight handler for complex requests
 */
export const preflightHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }
  next();
};

/**
 * API-specific CORS configuration
 */
export const apiCorsOptions: cors.CorsOptions = {
  ...corsOptions,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    ...corsOptions.allowedHeaders!,
    'Content-Length',
    'X-Forwarded-For',
  ],
};

/**
 * Webhook-specific CORS configuration (more restrictive)
 */
export const webhookCorsOptions: cors.CorsOptions = {
  origin: false, // No browser access to webhooks
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'X-Webhook-Signature'],
  credentials: false,
};

/**
 * Health check CORS configuration (public)
 */
export const healthCheckCorsOptions: cors.CorsOptions = {
  origin: true, // Allow all origins for health checks
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
};