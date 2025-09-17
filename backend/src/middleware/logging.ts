/**
 * Logging middleware
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface LogEntry {
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string | undefined;
  ip: string;
  timestamp: Date;
  error?: any;
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // Log request start
  const logEntry: LogEntry = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date(),
  };

  console.log('Request started:', {
    requestId: logEntry.requestId,
    method: logEntry.method,
    url: logEntry.url,
    ip: logEntry.ip,
    userAgent: logEntry.userAgent,
    timestamp: logEntry.timestamp.toISOString(),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const responseTime = Date.now() - startTime;
    
    const responseLog = {
      ...logEntry,
      statusCode: res.statusCode,
      responseTime,
    };

    // Log response
    console.log('Request completed:', {
      requestId: responseLog.requestId,
      method: responseLog.method,
      url: responseLog.url,
      statusCode: responseLog.statusCode,
      responseTime: `${responseLog.responseTime}ms`,
      timestamp: new Date().toISOString(),
    });

  // Call original end method
  return (originalEnd as any).call(this, chunk, encoding);
  };

  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string;

  const errorLog = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode,
    },
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date(),
  };

  console.error('Request error:', errorLog);

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to external logging service
    // logToExternalService(errorLog);
  }

  next(err);
};

/**
 * API usage logging for analytics
 */
export const apiUsageLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Only log API endpoints
  if (!req.originalUrl.startsWith('/api/')) {
    return next();
  }

  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const responseTime = Date.now() - startTime;
    
    const usageLog = {
      requestId,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      timestamp: new Date(),
    };

    // Log API usage (could be sent to analytics service)
    console.log('API Usage:', usageLog);

    // In production, store this data for analytics
    if (process.env.NODE_ENV === 'production') {
      // Example: Store in analytics database
      // storeApiUsage(usageLog);
    }

  return (originalEnd as any).call(this, chunk, encoding);
  };

  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    };

    const performanceLog = {
      requestId: req.headers['x-request-id'] as string,
      url: req.originalUrl,
      method: req.method,
      responseTime: Math.round(responseTime * 100) / 100, // Round to 2 decimal places
      memoryDelta,
      statusCode: res.statusCode,
      timestamp: new Date(),
    };

    // Log performance data
    if (responseTime > 1000) { // Log slow requests (> 1 second)
      console.warn('Slow request detected:', performanceLog);
    }

    // In development, log all performance data
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance:', performanceLog);
    }
  });

  next();
};

/**
 * Security event logging
 */
export const securityLogger = (event: string, details: any, req: Request): void => {
  const securityLog = {
    event,
    details,
    requestId: req.headers['x-request-id'] as string,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date(),
  };

  console.warn('Security event:', securityLog);

  // In production, send security events to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to security monitoring service
    // sendSecurityAlert(securityLog);
  }
};

/**
 * Health check logging
 */
export const healthCheckLogger = (status: 'healthy' | 'unhealthy', details?: any): void => {
  const healthLog = {
    status,
    details,
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  if (status === 'unhealthy') {
    console.error('Health check failed:', healthLog);
  } else {
    console.log('Health check passed:', healthLog);
  }
};