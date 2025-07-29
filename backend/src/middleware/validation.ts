/**
 * Request validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, ValidationChain } from 'express-validator';
import { createValidationError } from './errorHandler';

/**
 * Handle validation results
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    const error = createValidationError('Validation failed');
    (error as any).details = errorMessages;
    
    return next(error);
  }
  
  next();
};

/**
 * Student profile validation rules
 */
export const validateStudentProfile = (): ValidationChain[] => [
  body('personalInfo.name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u0900-\u097F]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('personalInfo.grade')
    .notEmpty()
    .withMessage('Grade is required')
    .isIn(['9', '10', '11', '12', 'Undergraduate', 'Postgraduate'])
    .withMessage('Invalid grade selection'),

  body('personalInfo.board')
    .notEmpty()
    .withMessage('Board is required')
    .isIn(['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'NIOS'])
    .withMessage('Invalid board selection'),

  body('personalInfo.languagePreference')
    .notEmpty()
    .withMessage('Language preference is required')
    .isIn(['hindi', 'english'])
    .withMessage('Language preference must be hindi or english'),

  body('personalInfo.age')
    .optional()
    .isInt({ min: 10, max: 25 })
    .withMessage('Age must be between 10 and 25'),

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
    .withMessage('Physically disabled must be a boolean'),

  body('academicData.interests')
    .isArray({ min: 1, max: 10 })
    .withMessage('Interests must be an array with 1-10 items'),

  body('academicData.interests.*')
    .isString()
    .notEmpty()
    .withMessage('Each interest must be a non-empty string'),

  body('academicData.subjects')
    .isArray({ min: 1 })
    .withMessage('Subjects must be an array with at least 1 item'),

  body('academicData.subjects.*')
    .isString()
    .notEmpty()
    .withMessage('Each subject must be a non-empty string'),

  body('academicData.performance')
    .notEmpty()
    .withMessage('Performance is required')
    .isIn(['excellent', 'good', 'average', 'below-average'])
    .withMessage('Invalid performance selection'),

  body('academicData.favoriteSubjects')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Favorite subjects must be an array with max 5 items'),

  body('academicData.difficultSubjects')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Difficult subjects must be an array with max 5 items'),

  body('academicData.extracurricularActivities')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Extracurricular activities must be an array with max 10 items'),

  body('socioeconomicData.location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),

  body('socioeconomicData.familyBackground')
    .notEmpty()
    .withMessage('Family background is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Family background must be between 10 and 500 characters'),

  body('socioeconomicData.economicFactors')
    .isArray({ min: 1 })
    .withMessage('Economic factors must be an array with at least 1 item'),

  body('socioeconomicData.ruralUrban')
    .notEmpty()
    .withMessage('Rural/Urban classification is required')
    .isIn(['rural', 'urban', 'semi-urban'])
    .withMessage('Invalid rural/urban selection'),

  body('socioeconomicData.internetAccess')
    .isBoolean()
    .withMessage('Internet access must be a boolean'),

  body('socioeconomicData.deviceAccess')
    .isArray({ min: 1 })
    .withMessage('Device access must be an array with at least 1 item'),

  body('socioeconomicData.householdSize')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Household size must be between 1 and 20'),

  body('familyIncome')
    .notEmpty()
    .withMessage('Family income is required')
    .isIn(['Below 1 Lakh', '1-3 Lakhs', '3-5 Lakhs', '5-10 Lakhs', '10-20 Lakhs', '20-50 Lakhs', 'Above 50 Lakhs'])
    .withMessage('Invalid family income selection'),
];

/**
 * Search query validation
 */
export const validateSearchQuery = (): ValidationChain[] => [
  query('query')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

/**
 * ID parameter validation
 */
export const validateId = (paramName: string = 'id'): ValidationChain[] => [
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage(`${paramName} must contain only alphanumeric characters, hyphens, and underscores`),
];

/**
 * Analytics query validation
 */
export const validateAnalyticsQuery = (): ValidationChain[] => [
  query('dateRange.start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('dateRange.end')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  query('demographics.gender')
    .optional()
    .isArray()
    .withMessage('Gender filter must be an array'),

  query('demographics.category')
    .optional()
    .isArray()
    .withMessage('Category filter must be an array'),

  query('demographics.board')
    .optional()
    .isArray()
    .withMessage('Board filter must be an array'),

  query('demographics.location')
    .optional()
    .isArray()
    .withMessage('Location filter must be an array'),
];

/**
 * Webhook notification validation
 */
export const validateWebhookPayload = (): ValidationChain[] => [
  body('studentName')
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Student name must be between 2 and 100 characters'),

  body('selectedCareers')
    .isArray({ min: 1, max: 5 })
    .withMessage('Selected careers must be an array with 1-5 items'),

  body('selectedCareers.*')
    .isString()
    .notEmpty()
    .withMessage('Each career must be a non-empty string'),

  body('profileId')
    .optional()
    .matches(/^profile_[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid profile ID format'),
];

/**
 * College search validation
 */
export const validateCollegeSearch = (): ValidationChain[] => [
  query('type')
    .optional()
    .isIn(['government', 'private', 'deemed'])
    .withMessage('Invalid college type'),

  query('location')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),

  query('course')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course must be between 2 and 100 characters'),

  query('entranceExam')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Entrance exam must be between 2 and 50 characters'),

  query('maxFees')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max fees must be a non-negative integer'),
];

/**
 * Career search validation
 */
export const validateCareerSearch = (): ValidationChain[] => [
  query('nepCategory')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('NEP category must be between 2 and 100 characters'),

  query('minSalary')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min salary must be a non-negative integer'),

  query('maxSalary')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max salary must be a non-negative integer'),

  query('education')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Education must be between 2 and 100 characters'),

  query('skill')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill must be between 2 and 100 characters'),
];

/**
 * Scholarship search validation
 */
export const validateScholarshipSearch = (): ValidationChain[] => [
  query('category')
    .optional()
    .isIn(['General', 'OBC', 'SC', 'ST', 'EWS'])
    .withMessage('Invalid category'),

  query('incomeLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Income limit must be a non-negative integer'),

  query('type')
    .optional()
    .isIn(['Merit-based', 'Need-based', 'Merit-cum-Means'])
    .withMessage('Invalid scholarship type'),

  query('course')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course must be between 2 and 100 characters'),

  query('provider')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Provider must be between 2 and 100 characters'),
];