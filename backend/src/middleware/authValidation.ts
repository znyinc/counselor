/**
 * Authentication Validation Middleware
 * Provides validation rules for authentication endpoints
 */

import { body, param } from 'express-validator';

export const validateRegistration = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('role')
    .optional()
    .isIn(['student', 'counselor', 'admin', 'parent'])
    .withMessage('Role must be one of: student, counselor, admin, parent'),
  
  body('profile.phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  
  body('profile.location.state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
  
  body('profile.location.district')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('District must be between 1 and 100 characters'),
  
  body('profile.location.area')
    .optional()
    .isIn(['urban', 'rural'])
    .withMessage('Area must be either urban or rural'),
  
  body('profile.preferences.language')
    .optional()
    .isIn(['english', 'hindi'])
    .withMessage('Language preference must be either english or hindi'),
  
  body('profile.preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications preference must be a boolean'),
  
  body('studentProfile.grade')
    .optional()
    .isIn(['9', '10', '11', '12', 'graduate', 'postgraduate'])
    .withMessage('Grade must be one of: 9, 10, 11, 12, graduate, postgraduate'),
  
  body('studentProfile.board')
    .optional()
    .isIn(['CBSE', 'ICSE', 'State Board', 'IB', 'Other'])
    .withMessage('Board must be one of: CBSE, ICSE, State Board, IB, Other'),
  
  body('studentProfile.interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('studentProfile.subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),
  
  body('studentProfile.performance')
    .optional()
    .isIn(['excellent', 'good', 'average', 'needs_improvement'])
    .withMessage('Performance must be one of: excellent, good, average, needs_improvement')
];

export const validateLogin = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateProfileUpdate = () => [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('profile.phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  
  body('profile.location.state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
  
  body('profile.location.district')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('District must be between 1 and 100 characters'),
  
  body('profile.location.area')
    .optional()
    .isIn(['urban', 'rural'])
    .withMessage('Area must be either urban or rural'),
  
  body('profile.preferences.language')
    .optional()
    .isIn(['english', 'hindi'])
    .withMessage('Language preference must be either english or hindi'),
  
  body('profile.preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications preference must be a boolean'),
  
  body('studentProfile.grade')
    .optional()
    .isIn(['9', '10', '11', '12', 'graduate', 'postgraduate'])
    .withMessage('Grade must be one of: 9, 10, 11, 12, graduate, postgraduate'),
  
  body('studentProfile.board')
    .optional()
    .isIn(['CBSE', 'ICSE', 'State Board', 'IB', 'Other'])
    .withMessage('Board must be one of: CBSE, ICSE, State Board, IB, Other'),
  
  body('studentProfile.interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('studentProfile.subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),
  
  body('studentProfile.performance')
    .optional()
    .isIn(['excellent', 'good', 'average', 'needs_improvement'])
    .withMessage('Performance must be one of: excellent, good, average, needs_improvement')
];

export const validatePasswordChange = () => [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

export const validatePasswordResetRequest = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

export const validatePasswordReset = () => [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

export const validateEmailVerification = () => [
  param('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid verification token format')
];