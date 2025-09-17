/**
 * Authentication and Authorization Middleware
 * Provides JWT-based authentication and role-based authorization
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';
import { SecureStorage } from '../utils/secureStorage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

export class AuthenticationService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET as any, ({
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'ai-career-counseling',
      audience: 'ai-career-counseling-users',
    } as any));
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_SECRET as any,
      ({
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'ai-career-counseling',
        audience: 'ai-career-counseling-users',
      } as any)
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'ai-career-counseling',
        audience: 'ai-career-counseling-users',
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new CustomError('Token expired', 401, 'TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid token', 401, 'INVALID_TOKEN');
      } else {
        throw new CustomError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Generate API key for external integrations
   */
  static generateApiKey(): string {
    const prefix = 'acc_'; // AI Career Counseling prefix
    const key = SecureStorage.generateSecureToken(32);
    return `${prefix}${key}`;
  }

  /**
   * Validate API key format
   */
  static validateApiKeyFormat(apiKey: string): boolean {
    return /^acc_[a-f0-9]{64}$/.test(apiKey);
  }
}

/**
 * Authentication middleware
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new CustomError('Authorization header missing', 401, 'MISSING_AUTH_HEADER');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer') {
      throw new CustomError('Invalid authorization scheme', 401, 'INVALID_AUTH_SCHEME');
    }

    if (!token) {
      throw new CustomError('Token missing', 401, 'MISSING_TOKEN');
    }

    const payload = AuthenticationService.verifyToken(token);
    
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * API key authentication middleware
 */
export const authenticateApiKey = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new CustomError('API key missing', 401, 'MISSING_API_KEY');
    }

    if (!AuthenticationService.validateApiKeyFormat(apiKey)) {
      throw new CustomError('Invalid API key format', 401, 'INVALID_API_KEY_FORMAT');
    }

    // In a real implementation, you would validate the API key against a database
    // For now, we'll accept any properly formatted key
    req.user = {
      id: 'api-user',
      email: 'api@system.local',
      role: 'api',
      permissions: ['read:analytics', 'write:webhooks'],
      sessionId: SecureStorage.generateUUID(),
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware (allows both authenticated and anonymous access)
 */
export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');
      
      if (scheme === 'Bearer' && token) {
        try {
          const payload = AuthenticationService.verifyToken(token);
          req.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions,
            sessionId: payload.sessionId,
          };
        } catch (error) {
          // Ignore authentication errors for optional auth
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      if (!req.user.permissions.includes(requiredPermission)) {
        throw new CustomError(
          `Permission '${requiredPermission}' required`,
          403,
          'PERMISSION_REQUIRED'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting by user
 */
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
  const userId: string = (req.user?.id ?? req.ip ?? 'anonymous') as string;
      const now = Date.now();
      
  const userLimit = userRequests.get(userId);
      
      if (!userLimit || now > userLimit.resetTime) {
  userRequests.set(userId, {
          count: 1,
          resetTime: now + windowMs,
        });
        next();
        return;
      }

      if (userLimit.count >= maxRequests) {
        throw new CustomError(
          'Rate limit exceeded for user',
          429,
          'USER_RATE_LIMIT_EXCEEDED'
        );
      }

      userLimit.count++;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Session validation middleware
 */
export const validateSession = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user?.sessionId) {
      throw new CustomError('Invalid session', 401, 'INVALID_SESSION');
    }

    // In a real implementation, you would validate the session against a database
    // and check for session expiry, concurrent sessions, etc.
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * CSRF protection middleware
 */
export const csrfProtection = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const csrfToken = req.headers['x-csrf-token'] as string;
      const sessionToken = req.user?.sessionId;

      if (!csrfToken || !sessionToken) {
        throw new CustomError('CSRF token required', 403, 'CSRF_TOKEN_REQUIRED');
      }

      // Simple CSRF validation (in production, use a more robust method)
      const expectedToken = Buffer.from(sessionToken).toString('base64');
      if (csrfToken !== expectedToken) {
        throw new CustomError('Invalid CSRF token', 403, 'INVALID_CSRF_TOKEN');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  AuthenticationService,
  authenticate,
  authenticateApiKey,
  optionalAuthenticate,
  authorize,
  requirePermission,
  rateLimitByUser,
  validateSession,
  csrfProtection,
};