/**
 * Webhook validation middleware
 * Validates webhook payloads and notification requests
 */

import { body, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

/**
 * Validation rules for notification webhook requests
 */
export const validateNotificationRequest = (): ValidationChain[] => {
  return [
    // Student Profile Validation
    body('studentProfile')
      .notEmpty()
      .withMessage('Student profile is required')
      .isObject()
      .withMessage('Student profile must be an object'),

    body('studentProfile.id')
      .notEmpty()
      .withMessage('Student profile ID is required')
      .isString()
      .withMessage('Profile ID must be a string')
      .isLength({ min: 5, max: 100 })
      .withMessage('Profile ID must be between 5 and 100 characters'),

    body('studentProfile.personalInfo.name')
      .notEmpty()
      .withMessage('Student name is required')
      .isString()
      .withMessage('Student name must be a string')
      .isLength({ min: 2, max: 100 })
      .withMessage('Student name must be between 2 and 100 characters'),

    body('studentProfile.personalInfo.grade')
      .notEmpty()
      .withMessage('Student grade is required')
      .isString()
      .withMessage('Grade must be a string'),

    body('studentProfile.personalInfo.board')
      .notEmpty()
      .withMessage('Student board is required')
      .isString()
      .withMessage('Board must be a string'),

    body('studentProfile.personalInfo.languagePreference')
      .notEmpty()
      .withMessage('Language preference is required')
      .isIn(['hindi', 'english'])
      .withMessage('Language preference must be either hindi or english'),

    body('studentProfile.socioeconomicData.location')
      .notEmpty()
      .withMessage('Student location is required')
      .isString()
      .withMessage('Location must be a string'),

    // Recommendations Validation
    body('recommendations')
      .notEmpty()
      .withMessage('Recommendations are required')
      .isArray({ min: 1, max: 10 })
      .withMessage('Recommendations must be an array with 1-10 items'),

    body('recommendations.*.id')
      .notEmpty()
      .withMessage('Recommendation ID is required')
      .isString()
      .withMessage('Recommendation ID must be a string'),

    body('recommendations.*.title')
      .notEmpty()
      .withMessage('Recommendation title is required')
      .isString()
      .withMessage('Recommendation title must be a string')
      .isLength({ min: 2, max: 200 })
      .withMessage('Recommendation title must be between 2 and 200 characters'),

    body('recommendations.*.matchScore')
      .notEmpty()
      .withMessage('Match score is required')
      .isNumeric()
      .withMessage('Match score must be a number')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Match score must be between 0 and 100'),

    body('recommendations.*.prospects.demandLevel')
      .notEmpty()
      .withMessage('Demand level is required')
      .isIn(['high', 'medium', 'low'])
      .withMessage('Demand level must be high, medium, or low'),

    body('recommendations.*.prospects.averageSalary.entry')
      .notEmpty()
      .withMessage('Entry salary is required')
      .isNumeric()
      .withMessage('Entry salary must be a number')
      .isFloat({ min: 0 })
      .withMessage('Entry salary must be a positive number'),

    // Optional fields validation
    body('processingTime')
      .optional()
      .isNumeric()
      .withMessage('Processing time must be a number')
      .isFloat({ min: 0 })
      .withMessage('Processing time must be a positive number'),

    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),

    body('metadata.source')
      .optional()
      .isString()
      .withMessage('Metadata source must be a string')
      .isLength({ max: 100 })
      .withMessage('Metadata source must be at most 100 characters'),

    body('metadata.requestId')
      .optional()
      .isString()
      .withMessage('Request ID must be a string')
      .isLength({ max: 100 })
      .withMessage('Request ID must be at most 100 characters')
  ];
};

/**
 * Middleware to validate webhook signature
 */
export const validateWebhookSignature = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // Skip validation if no secret is configured
    if (!webhookSecret) {
      console.log('Webhook secret not configured, skipping signature validation');
      return next();
    }

    // Require signature if secret is configured
    if (!signature) {
      throw new CustomError(
        'Webhook signature required',
        401,
        'MISSING_WEBHOOK_SIGNATURE'
      );
    }

    // Validate signature format
    if (!signature.startsWith('sha256=')) {
      throw new CustomError(
        'Invalid webhook signature format',
        401,
        'INVALID_SIGNATURE_FORMAT'
      );
    }

    // Generate expected signature
    const crypto = require('crypto');
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    // Compare signatures using timing-safe comparison
    const providedSignature = signature;
    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    )) {
      throw new CustomError(
        'Invalid webhook signature',
        401,
        'INVALID_WEBHOOK_SIGNATURE'
      );
    }

    console.log('Webhook signature validated successfully');
    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate webhook content type
 */
export const validateWebhookContentType = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.headers['content-type'];

  if (!contentType || !contentType.includes('application/json')) {
    const error = new CustomError(
      'Webhook content type must be application/json',
      400,
      'INVALID_CONTENT_TYPE'
    );
    return next(error);
  }

  next();
};

/**
 * Middleware to validate webhook payload size
 */
export const validateWebhookPayloadSize = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = req.headers['content-length'];
  const maxSize = parseInt(process.env.WEBHOOK_MAX_PAYLOAD_SIZE || '1048576'); // 1MB default

  if (contentLength && parseInt(contentLength) > maxSize) {
    const error = new CustomError(
      `Webhook payload too large. Maximum size: ${maxSize} bytes`,
      413,
      'PAYLOAD_TOO_LARGE'
    );
    return next(error);
  }

  next();
};

/**
 * Middleware to log webhook requests
 */
export const logWebhookRequest = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const clientId = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const contentLength = req.headers['content-length'] || '0';

  console.log(`Webhook request: ${timestamp} | IP: ${clientId} | User-Agent: ${userAgent} | Size: ${contentLength} bytes`);

  // Add webhook metadata to request for later use
  req.webhookMetadata = {
    timestamp,
    clientId,
    userAgent,
    contentLength: parseInt(contentLength),
    requestId: req.id || 'unknown'
  };

  next();
};

/**
 * Rate limiting specifically for webhook requests
 */
export const webhookRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = parseInt(process.env.WEBHOOK_RATE_LIMIT || '100'); // Max 100 webhook requests per 15 minutes

  // In production, this should use Redis or another persistent store
  if (!global.webhookRateLimitTracker) {
    global.webhookRateLimitTracker = new Map();
  }

  const tracker = global.webhookRateLimitTracker;
  const clientData = tracker.get(clientId) || { count: 0, resetTime: now + windowMs };

  if (now > clientData.resetTime) {
    // Reset the counter
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }

  if (clientData.count >= maxRequests) {
    const resetIn = Math.ceil((clientData.resetTime - now) / 1000);

    res.status(429).json({
      success: false,
      error: {
        code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
        message: `Too many webhook requests. Try again in ${resetIn} seconds.`,
        retryAfter: resetIn
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  clientData.count++;
  tracker.set(clientId, clientData);

  next();
};

/**
 * Middleware to validate n8n webhook requests
 */
export const validateN8nWebhook = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const isN8nRequest = userAgent.includes('n8n') || req.body?.source === 'n8n';

    if (isN8nRequest) {
      console.log('n8n webhook request detected');
      
      // Add n8n specific metadata
      req.n8nMetadata = {
        workflowId: req.body?.workflowId,
        executionId: req.body?.executionId,
        nodeId: req.body?.nodeId,
        timestamp: req.body?.timestamp
      };
    }

    next();

  } catch (error) {
    next(error);
  }
};

// Extend Request interface to include webhook metadata
declare global {
  namespace Express {
    interface Request {
      webhookMetadata?: {
        timestamp: string;
        clientId: string;
        userAgent: string;
        contentLength: number;
        requestId: string;
      };
      n8nMetadata?: {
        workflowId?: string;
        executionId?: string;
        nodeId?: string;
        timestamp?: string;
      };
    }
  }
}