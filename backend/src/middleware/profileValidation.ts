/**
 * Profile validation middleware for student profile processing
 */

import { body, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

/**
 * Validation rules for student profile submission
 */
export const validateProfileSubmission = (): ValidationChain[] => {
  return [
    // Personal Information Validation
    body('personalInfo.name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s\u0900-\u097F]+$/)
      .withMessage('Name can only contain letters and spaces (English/Hindi)'),

    body('personalInfo.grade')
      .notEmpty()
      .withMessage('Grade is required')
      .isIn(['9', '10', '11', '12', 'Graduate', 'Post-Graduate'])
      .withMessage('Invalid grade selection'),

    body('personalInfo.board')
      .notEmpty()
      .withMessage('Board is required')
      .isIn(['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'])
      .withMessage('Invalid board selection'),

    body('personalInfo.languagePreference')
      .notEmpty()
      .withMessage('Language preference is required')
      .isIn(['hindi', 'english'])
      .withMessage('Language preference must be either hindi or english'),

    body('personalInfo.age')
      .optional()
      .isInt({ min: 10, max: 30 })
      .withMessage('Age must be between 10 and 30'),

    body('personalInfo.gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
      .withMessage('Invalid gender selection'),

    body('personalInfo.category')
      .optional()
      .isIn(['General', 'OBC', 'SC', 'ST', 'EWS'])
      .withMessage('Invalid category selection'),

    body('personalInfo.physicallyDisabled')
      .optional()
      .isBoolean()
      .withMessage('Physically disabled must be a boolean value'),

    // Academic Data Validation
    body('academicData.interests')
      .isArray({ min: 1, max: 10 })
      .withMessage('At least 1 and at most 10 interests must be selected'),

    body('academicData.interests.*')
      .isLength({ min: 2, max: 50 })
      .withMessage('Each interest must be between 2 and 50 characters'),

    body('academicData.subjects')
      .isArray({ min: 1, max: 15 })
      .withMessage('At least 1 and at most 15 subjects must be provided'),

    body('academicData.subjects.*')
      .isLength({ min: 2, max: 50 })
      .withMessage('Each subject must be between 2 and 50 characters'),

    body('academicData.performance')
      .notEmpty()
      .withMessage('Academic performance is required')
      .isIn(['Excellent', 'Good', 'Average', 'Below Average'])
      .withMessage('Invalid performance selection'),

    body('academicData.favoriteSubjects')
      .optional()
      .isArray({ max: 10 })
      .withMessage('At most 10 favorite subjects can be selected'),

    body('academicData.difficultSubjects')
      .optional()
      .isArray({ max: 10 })
      .withMessage('At most 10 difficult subjects can be selected'),

    body('academicData.extracurricularActivities')
      .optional()
      .isArray({ max: 15 })
      .withMessage('At most 15 extracurricular activities can be listed'),

    body('academicData.achievements')
      .optional()
      .isArray({ max: 10 })
      .withMessage('At most 10 achievements can be listed'),

    // Socioeconomic Data Validation
    body('socioeconomicData.location')
      .notEmpty()
      .withMessage('Location is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters'),

    body('socioeconomicData.familyBackground')
      .notEmpty()
      .withMessage('Family background is required')
      .isLength({ min: 5, max: 500 })
      .withMessage('Family background must be between 5 and 500 characters'),

    body('socioeconomicData.economicFactors')
      .isArray({ min: 1, max: 10 })
      .withMessage('At least 1 and at most 10 economic factors must be provided'),

    body('socioeconomicData.ruralUrban')
      .notEmpty()
      .withMessage('Rural/Urban classification is required')
      .isIn(['rural', 'urban', 'semi-urban'])
      .withMessage('Invalid rural/urban classification'),

    body('socioeconomicData.internetAccess')
      .isBoolean()
      .withMessage('Internet access must be a boolean value'),

    body('socioeconomicData.deviceAccess')
      .isArray({ min: 1, max: 10 })
      .withMessage('At least 1 device access type must be provided'),

    body('socioeconomicData.householdSize')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Household size must be between 1 and 20'),

    body('socioeconomicData.parentOccupation.father')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Father occupation must be at most 100 characters'),

    body('socioeconomicData.parentOccupation.mother')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Mother occupation must be at most 100 characters'),

    // Family Income Validation
    body('familyIncome')
      .notEmpty()
      .withMessage('Family income is required')
      .matches(/^(Below \d+ Lakh|\d+-\d+ Lakh|Above \d+ Lakh|\d+ Crore) per annum$/i)
      .withMessage('Invalid family income format'),

    // Aspirations Validation (Optional)
    body('aspirations.preferredCareers')
      .optional()
      .isArray({ max: 10 })
      .withMessage('At most 10 preferred careers can be listed'),

    body('aspirations.preferredLocations')
      .optional()
      .isArray({ max: 10 })
      .withMessage('At most 10 preferred locations can be listed'),

    body('aspirations.salaryExpectations')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Salary expectations must be at most 50 characters'),

    body('aspirations.workLifeBalance')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('Work-life balance must be high, medium, or low'),

    // Constraints Validation (Optional)
    body('constraints.financialConstraints')
      .optional()
      .isBoolean()
      .withMessage('Financial constraints must be a boolean value'),

    body('constraints.locationConstraints')
      .optional()
      .isArray({ max: 10 })
      .withMessage('At most 10 location constraints can be listed'),

    body('constraints.familyExpectations')
      .optional()
      .isArray({ max: 10 })
      .withMessage('At most 10 family expectations can be listed'),

    body('constraints.timeConstraints')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Time constraints must be at most 200 characters')
  ];
};

/**
 * Middleware to check for content security issues
 */
export const validateContentSecurity = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const profileData = req.body;
    
    // Check for potentially malicious content patterns
    const maliciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /expression\s*\(/gi
    ];

    // Recursively check all string values in the profile data
    const checkForMaliciousContent = (obj: any, path: string = ''): void => {
      if (typeof obj === 'string') {
        for (const pattern of maliciousPatterns) {
          if (pattern.test(obj)) {
            throw new CustomError(
              `Potentially malicious content detected in ${path}`,
              400,
              'MALICIOUS_CONTENT_DETECTED'
            );
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          checkForMaliciousContent(value, path ? `${path}.${key}` : key);
        }
      }
    };

    checkForMaliciousContent(profileData);
    next();
    
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate profile data size and complexity
 */
export const validateProfileSize = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const profileData = req.body;
    const profileString = JSON.stringify(profileData);
    
    // Check overall profile size (should be reasonable for a student profile)
    if (profileString.length > 50000) { // 50KB limit
      throw new CustomError(
        'Profile data too large',
        400,
        'PROFILE_TOO_LARGE'
      );
    }

    // Check for reasonable array sizes
    const checkArraySizes = (obj: any, path: string = ''): void => {
      if (Array.isArray(obj)) {
        if (obj.length > 50) { // Reasonable limit for any array
          throw new CustomError(
            `Array too large at ${path}`,
            400,
            'ARRAY_TOO_LARGE'
          );
        }
        
        // Check each array element
        obj.forEach((item, index) => {
          checkArraySizes(item, `${path}[${index}]`);
        });
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          checkArraySizes(value, path ? `${path}.${key}` : key);
        }
      }
    };

    checkArraySizes(profileData);
    next();
    
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to sanitize profile data
 */
export const sanitizeProfileData = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const profileData = req.body;
    
    // Recursively sanitize string values
    const sanitizeStrings = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .trim()
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/[<>]/g, '') // Remove potential HTML brackets
          .substring(0, 1000); // Limit string length
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeStrings);
      } else if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeStrings(value);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeStrings(profileData);
    next();
    
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting specifically for profile submissions
 */
export const profileSubmissionRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // This would typically use a more sophisticated rate limiting library
  // For now, we'll implement a simple in-memory rate limiter
  
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // Max 5 profile submissions per 15 minutes
  
  // In production, this should use Redis or another persistent store
  if (!global.profileSubmissionTracker) {
    global.profileSubmissionTracker = new Map();
  }
  
  const tracker = global.profileSubmissionTracker;
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
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many profile submissions. Try again in ${resetIn} seconds.`,
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
 * Middleware to log profile submission attempts
 */
export const logProfileSubmission = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`Profile submission attempt: ${timestamp} | IP: ${clientId} | User-Agent: ${userAgent}`);
  
  // Add submission metadata to request for later use
  req.submissionMetadata = {
    clientId,
    userAgent,
    timestamp,
    requestId: (req.headers['x-request-id'] as string) || 'unknown'
  };
  
  next();
};

// Extend Request interface to include submission metadata
declare global {
  namespace Express {
    interface Request {
      submissionMetadata?: {
        clientId: string;
        userAgent: string;
        timestamp: string;
        requestId: string;
      };
    }
  }
}