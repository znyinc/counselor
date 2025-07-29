/**
 * Input Sanitization Utilities
 * Provides comprehensive input sanitization and validation
 */

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  removeNullBytes?: boolean;
  normalizeUnicode?: boolean;
}

export class InputSanitizer {
  /**
   * Sanitize string input with comprehensive security measures
   */
  static sanitizeString(
    input: string,
    options: SanitizationOptions = {}
  ): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    const {
      allowHtml = false,
      maxLength = 10000,
      trimWhitespace = true,
      removeNullBytes = true,
      normalizeUnicode = true,
    } = options;

    let sanitized = input;

    // Remove null bytes and control characters
    if (removeNullBytes) {
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }

    // Normalize unicode
    if (normalizeUnicode) {
      sanitized = sanitized.normalize('NFC');
    }

    // Trim whitespace
    if (trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Length validation
    if (sanitized.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // HTML sanitization
    if (!allowHtml) {
      // Remove HTML tags and encode special characters
      sanitized = DOMPurify.sanitize(sanitized, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });
      
      // Additional XSS protection
      sanitized = validator.escape(sanitized);
    } else {
      // Allow limited HTML but sanitize dangerous content
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: [],
      });
    }

    return sanitized;
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email input');
    }

    const sanitized = this.sanitizeString(email, {
      maxLength: 254,
      allowHtml: false,
    }).toLowerCase();

    if (!validator.isEmail(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Invalid phone number input');
    }

    // Remove all non-digit characters except + for country code
    let sanitized = phone.replace(/[^\d+]/g, '');

    // Validate phone number format
    if (!validator.isMobilePhone(sanitized, 'any', { strictMode: false })) {
      throw new Error('Invalid phone number format');
    }

    return sanitized;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(
    input: string | number,
    options: { min?: number; max?: number; integer?: boolean } = {}
  ): number {
    const { min, max, integer = false } = options;

    let num: number;
    if (typeof input === 'string') {
      // Remove any non-numeric characters except decimal point and minus
      const cleaned = input.replace(/[^\d.-]/g, '');
      num = parseFloat(cleaned);
    } else {
      num = input;
    }

    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid numeric input');
    }

    if (integer && !Number.isInteger(num)) {
      throw new Error('Input must be an integer');
    }

    if (min !== undefined && num < min) {
      throw new Error(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new Error(`Number must be at most ${max}`);
    }

    return num;
  }

  /**
   * Sanitize array input
   */
  static sanitizeArray<T>(
    input: T[],
    itemSanitizer: (item: T) => T,
    options: { maxLength?: number; unique?: boolean } = {}
  ): T[] {
    if (!Array.isArray(input)) {
      throw new Error('Input must be an array');
    }

    const { maxLength = 100, unique = false } = options;

    if (input.length > maxLength) {
      throw new Error(`Array exceeds maximum length of ${maxLength} items`);
    }

    let sanitized = input.map(itemSanitizer);

    if (unique) {
      sanitized = [...new Set(sanitized)];
    }

    return sanitized;
  }

  /**
   * Sanitize object input recursively
   */
  static sanitizeObject(
    input: Record<string, any>,
    schema: Record<string, (value: any) => any>
  ): Record<string, any> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Input must be an object');
    }

    const sanitized: Record<string, any> = {};

    for (const [key, sanitizer] of Object.entries(schema)) {
      if (key in input) {
        try {
          sanitized[key] = sanitizer(input[key]);
        } catch (error) {
          throw new Error(`Validation failed for field '${key}': ${error.message}`);
        }
      }
    }

    // Check for unexpected fields
    const unexpectedFields = Object.keys(input).filter(key => !(key in schema));
    if (unexpectedFields.length > 0) {
      throw new Error(`Unexpected fields: ${unexpectedFields.join(', ')}`);
    }

    return sanitized;
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  static sanitizeFilePath(path: string): string {
    if (!path || typeof path !== 'string') {
      throw new Error('Invalid file path');
    }

    // Remove null bytes and control characters
    let sanitized = path.replace(/[\x00-\x1F\x7F]/g, '');

    // Prevent directory traversal
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[/\\]/g, '_');

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

    if (sanitized.length === 0) {
      throw new Error('Invalid file path after sanitization');
    }

    return sanitized;
  }

  /**
   * Sanitize SQL input to prevent SQL injection
   */
  static sanitizeSqlInput(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid SQL input');
    }

    // Remove SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;|'|"|`)/g,
      /(\bOR\b|\bAND\b).*?[=<>]/gi,
    ];

    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return this.sanitizeString(sanitized);
  }

  /**
   * Sanitize NoSQL input to prevent NoSQL injection
   */
  static sanitizeNoSqlInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map(item => this.sanitizeNoSqlInput(item));
      }

      // Check for NoSQL injection patterns
      const dangerousKeys = ['$where', '$regex', '$ne', '$gt', '$lt', '$in', '$nin'];
      const sanitized: Record<string, any> = {};

      for (const [key, value] of Object.entries(input)) {
        if (dangerousKeys.includes(key)) {
          throw new Error(`Potentially dangerous NoSQL operator: ${key}`);
        }
        sanitized[key] = this.sanitizeNoSqlInput(value);
      }

      return sanitized;
    }

    return input;
  }

  /**
   * Sanitize student profile data
   */
  static sanitizeStudentProfile(profile: any): any {
    const personalInfoSchema = {
      name: (value: string) => this.sanitizeString(value, { maxLength: 100 }),
      grade: (value: string) => this.sanitizeString(value, { maxLength: 10 }),
      board: (value: string) => this.sanitizeString(value, { maxLength: 50 }),
      languagePreference: (value: string) => this.sanitizeString(value, { maxLength: 20 }),
      age: (value: number) => this.sanitizeNumber(value, { min: 10, max: 25, integer: true }),
      gender: (value: string) => this.sanitizeString(value, { maxLength: 20 }),
      category: (value: string) => this.sanitizeString(value, { maxLength: 20 }),
      physicallyDisabled: (value: boolean) => Boolean(value),
    };

    const academicDataSchema = {
      interests: (value: string[]) => this.sanitizeArray(
        value,
        (item: string) => this.sanitizeString(item, { maxLength: 50 }),
        { maxLength: 20 }
      ),
      subjects: (value: string[]) => this.sanitizeArray(
        value,
        (item: string) => this.sanitizeString(item, { maxLength: 50 }),
        { maxLength: 20 }
      ),
      performance: (value: string) => this.sanitizeString(value, { maxLength: 20 }),
      favoriteSubjects: (value: string[]) => this.sanitizeArray(
        value,
        (item: string) => this.sanitizeString(item, { maxLength: 50 }),
        { maxLength: 10 }
      ),
      difficultSubjects: (value: string[]) => this.sanitizeArray(
        value,
        (item: string) => this.sanitizeString(item, { maxLength: 50 }),
        { maxLength: 10 }
      ),
      extracurricularActivities: (value: string[]) => this.sanitizeArray(
        value,
        (item: string) => this.sanitizeString(item, { maxLength: 100 }),
        { maxLength: 20 }
      ),
      achievements: (value: string) => this.sanitizeString(value, { maxLength: 1000 }),
    };

    const socioeconomicDataSchema = {
      location: (value: string) => this.sanitizeString(value, { maxLength: 200 }),
      familyBackground: (value: string) => this.sanitizeString(value, { maxLength: 1000 }),
      economicFactors: (value: string[]) => this.sanitizeArray(
        value,
        (item: string) => this.sanitizeString(item, { maxLength: 100 }),
        { maxLength: 10 }
      ),
      ruralUrban: (value: string) => this.sanitizeString(value, { maxLength: 20 }),
      internetAccess: (value: boolean) => Boolean(value),
      deviceAccess: (value: string[]) => this.sanitizeArray(
        value,
        (item: string) => this.sanitizeString(item, { maxLength: 50 }),
        { maxLength: 10 }
      ),
      householdSize: (value: number) => this.sanitizeNumber(value, { min: 1, max: 20, integer: true }),
    };

    return {
      personalInfo: this.sanitizeObject(profile.personalInfo, personalInfoSchema),
      academicData: this.sanitizeObject(profile.academicData, academicDataSchema),
      socioeconomicData: this.sanitizeObject(profile.socioeconomicData, socioeconomicDataSchema),
      familyIncome: this.sanitizeString(profile.familyIncome, { maxLength: 20 }),
      aspirations: profile.aspirations ? this.sanitizeObject(profile.aspirations, {
        preferredCareers: (value: string[]) => this.sanitizeArray(
          value,
          (item: string) => this.sanitizeString(item, { maxLength: 100 }),
          { maxLength: 10 }
        ),
        preferredLocations: (value: string[]) => this.sanitizeArray(
          value,
          (item: string) => this.sanitizeString(item, { maxLength: 100 }),
          { maxLength: 10 }
        ),
        salaryExpectations: (value: string) => this.sanitizeString(value, { maxLength: 20 }),
        workLifeBalance: (value: string) => this.sanitizeString(value, { maxLength: 20 }),
      }) : undefined,
      constraints: profile.constraints ? this.sanitizeObject(profile.constraints, {
        financialConstraints: (value: boolean) => Boolean(value),
        locationConstraints: (value: string[]) => this.sanitizeArray(
          value,
          (item: string) => this.sanitizeString(item, { maxLength: 100 }),
          { maxLength: 10 }
        ),
        familyExpectations: (value: string) => this.sanitizeString(value, { maxLength: 500 }),
        timeConstraints: (value: string) => this.sanitizeString(value, { maxLength: 500 }),
      }) : undefined,
    };
  }
}

export default InputSanitizer;