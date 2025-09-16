/**
 * Form validation utilities for student profile form
 */

import { 
  StudentProfile, 
  PersonalInfo, 
  AcademicData, 
  SocioeconomicData,
  FormErrors 
} from '../types';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  minItems?: number;
  maxItems?: number;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FormValidator {
  /**
   * Validate a single field value against rules
   */
  static validateField(value: any, rules: ValidationRule, fieldName: string): FieldValidationResult {
    const errors: string[] = [];

    // Required validation
    if (rules.required) {
      if (value === null || value === undefined || value === '') {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
      }
      
      if (Array.isArray(value) && value.length === 0) {
        errors.push(`${fieldName} must have at least one selection`);
        return { isValid: false, errors };
      }
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, errors: [] };
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(`${fieldName} must have at least ${rules.minItems} items`);
      }

      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(`${fieldName} must have no more than ${rules.maxItems} items`);
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate personal information section
   */
  static validatePersonalInfo(personalInfo: Partial<PersonalInfo>): FormErrors {
    const errors: FormErrors = {};

    // Name validation
    const nameResult = this.validateField(personalInfo.name, {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u0900-\u097F]+$/,
    }, 'Name');
    if (!nameResult.isValid) errors.name = nameResult.errors;

    // Grade validation
    const gradeResult = this.validateField(personalInfo.grade, {
      required: true,
    }, 'Grade');
    if (!gradeResult.isValid) errors.grade = gradeResult.errors;

    // Board validation
    const boardResult = this.validateField(personalInfo.board, {
      required: true,
    }, 'Board');
    if (!boardResult.isValid) errors.board = boardResult.errors;

    // Language preference validation
    const languageResult = this.validateField(personalInfo.languagePreference, {
      required: true,
      custom: (value) => {
        if (value && !['hindi', 'english'].includes(value)) {
          return 'Language preference must be either Hindi or English';
        }
        return null;
      }
    }, 'Language Preference');
    if (!languageResult.isValid) errors.languagePreference = languageResult.errors;

    // Age validation (optional)
    if (personalInfo.age !== undefined) {
      const ageResult = this.validateField(personalInfo.age, {
        custom: (value) => {
          const age = Number(value);
          if (isNaN(age) || age < 10 || age > 25) {
            return 'Age must be between 10 and 25';
          }
          return null;
        }
      }, 'Age');
      if (!ageResult.isValid) errors.age = ageResult.errors;
    }

    // Gender validation (optional)
    if (personalInfo.gender !== undefined) {
      const genderResult = this.validateField(personalInfo.gender, {
        custom: (value) => {
          if (value && !['male', 'female', 'other', 'prefer-not-to-say'].includes(value)) {
            return 'Invalid gender selection';
          }
          return null;
        }
      }, 'Gender');
      if (!genderResult.isValid) errors.gender = genderResult.errors;
    }

    // Category validation (optional)
    if (personalInfo.category !== undefined) {
      const categoryResult = this.validateField(personalInfo.category, {
        custom: (value) => {
          if (value && !['General', 'OBC', 'SC', 'ST', 'EWS'].includes(value)) {
            return 'Invalid category selection';
          }
          return null;
        }
      }, 'Category');
      if (!categoryResult.isValid) errors.category = categoryResult.errors;
    }

    return errors;
  }

  /**
   * Validate academic information section
   */
  static validateAcademicInfo(academicData: Partial<AcademicData>): FormErrors {
    const errors: FormErrors = {};

    // Interests validation
    const interestsResult = this.validateField(academicData.interests, {
      required: true,
      minItems: 1,
      maxItems: 10,
    }, 'Interests');
    if (!interestsResult.isValid) errors.interests = interestsResult.errors;

    // Subjects validation
    const subjectsResult = this.validateField(academicData.subjects, {
      required: true,
      minItems: 1,
    }, 'Subjects');
    if (!subjectsResult.isValid) errors.subjects = subjectsResult.errors;

    // Performance validation
    const performanceResult = this.validateField(academicData.performance, {
      required: true,
    }, 'Performance');
    if (!performanceResult.isValid) errors.performance = performanceResult.errors;

    // Favorite subjects validation (optional)
    if (academicData.favoriteSubjects !== undefined) {
      const favoriteResult = this.validateField(academicData.favoriteSubjects, {
        maxItems: 5,
      }, 'Favorite Subjects');
      if (!favoriteResult.isValid) errors.favoriteSubjects = favoriteResult.errors;
    }

    // Difficult subjects validation (optional)
    if (academicData.difficultSubjects !== undefined) {
      const difficultResult = this.validateField(academicData.difficultSubjects, {
        maxItems: 5,
      }, 'Difficult Subjects');
      if (!difficultResult.isValid) errors.difficultSubjects = difficultResult.errors;
    }

    // Extracurricular activities validation (optional)
    if (academicData.extracurricularActivities !== undefined) {
      const extracurricularResult = this.validateField(academicData.extracurricularActivities, {
        maxItems: 10,
      }, 'Extracurricular Activities');
      if (!extracurricularResult.isValid) errors.extracurricularActivities = extracurricularResult.errors;
    }

    return errors;
  }

  /**
   * Validate socioeconomic information section
   */
  static validateSocioeconomicInfo(socioeconomicData: Partial<SocioeconomicData>): FormErrors {
    const errors: FormErrors = {};

    // Location validation
    const locationResult = this.validateField(socioeconomicData.location, {
      required: true,
      minLength: 2,
      maxLength: 100,
    }, 'Location');
    if (!locationResult.isValid) errors.location = locationResult.errors;

    // Family background validation
    const familyBackgroundResult = this.validateField(socioeconomicData.familyBackground, {
      required: true,
      minLength: 10,
      maxLength: 500,
    }, 'Family Background');
    if (!familyBackgroundResult.isValid) errors.familyBackground = familyBackgroundResult.errors;

    // Economic factors validation
    const economicFactorsResult = this.validateField(socioeconomicData.economicFactors, {
      required: true,
      minItems: 1,
    }, 'Economic Factors');
    if (!economicFactorsResult.isValid) errors.economicFactors = economicFactorsResult.errors;

    // Rural/Urban validation
    const ruralUrbanResult = this.validateField(socioeconomicData.ruralUrban, {
      required: true,
      custom: (value) => {
        if (value && !['rural', 'urban', 'semi-urban'].includes(value)) {
          return 'Area type must be rural, urban, or semi-urban';
        }
        return null;
      }
    }, 'Area Type');
    if (!ruralUrbanResult.isValid) errors.ruralUrban = ruralUrbanResult.errors;

    // Internet access validation
    const internetAccessResult = this.validateField(socioeconomicData.internetAccess, {
      required: true,
      custom: (value) => {
        if (typeof value !== 'boolean') {
          return 'Internet access must be specified';
        }
        return null;
      }
    }, 'Internet Access');
    if (!internetAccessResult.isValid) errors.internetAccess = internetAccessResult.errors;

    // Device access validation
    const deviceAccessResult = this.validateField(socioeconomicData.deviceAccess, {
      required: true,
      minItems: 1,
    }, 'Device Access');
    if (!deviceAccessResult.isValid) errors.deviceAccess = deviceAccessResult.errors;

    // Household size validation (optional)
    if (socioeconomicData.householdSize !== undefined) {
      const householdSizeResult = this.validateField(socioeconomicData.householdSize, {
        custom: (value) => {
          const size = Number(value);
          if (isNaN(size) || size < 1 || size > 20) {
            return 'Household size must be between 1 and 20';
          }
          return null;
        }
      }, 'Household Size');
      if (!householdSizeResult.isValid) errors.householdSize = householdSizeResult.errors;
    }

    return errors;
  }

  /**
   * Validate family income
   */
  static validateFamilyIncome(familyIncome: string): FormErrors {
    const errors: FormErrors = {};

    const incomeResult = this.validateField(familyIncome, {
      required: true,
    }, 'Family Income');
    if (!incomeResult.isValid) errors.familyIncome = incomeResult.errors;

    return errors;
  }

  /**
   * Validate entire student profile
   */
  static validateStudentProfile(profile: Partial<StudentProfile>): FormErrors {
    const allErrors: FormErrors = {};

    // Validate personal info
    if (profile.personalInfo) {
      const personalErrors = this.validatePersonalInfo(profile.personalInfo);
      Object.assign(allErrors, personalErrors);
    } else {
      allErrors.personalInfo = ['Personal information is required'];
    }

    // Validate academic data
    if (profile.academicData) {
      const academicErrors = this.validateAcademicInfo(profile.academicData);
      Object.assign(allErrors, academicErrors);
    } else {
      allErrors.academicData = ['Academic information is required'];
    }

    // Validate socioeconomic data
    if (profile.socioeconomicData) {
      const socioeconomicErrors = this.validateSocioeconomicInfo(profile.socioeconomicData);
      Object.assign(allErrors, socioeconomicErrors);
    } else {
      allErrors.socioeconomicData = ['Background information is required'];
    }

    // Validate family income
    if (profile.familyIncome) {
      const incomeErrors = this.validateFamilyIncome(profile.familyIncome);
      Object.assign(allErrors, incomeErrors);
    } else {
      allErrors.familyIncome = ['Family income is required'];
    }

    return allErrors;
  }

  /**
   * Check if form has any errors
   */
  static hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).some(key => errors[key] && errors[key].length > 0);
  }

  /**
   * Get first error message for a field
   */
  static getFirstError(errors: FormErrors, fieldName: string): string | undefined {
    const fieldErrors = errors[fieldName];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
  }

  /**
   * Count total number of errors
   */
  static countErrors(errors: FormErrors): number {
    return Object.values(errors).reduce((count, fieldErrors) => {
      return count + (fieldErrors ? fieldErrors.length : 0);
    }, 0);
  }

  /**
   * Sanitize form input
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Sanitize array input
   */
  static sanitizeArrayInput(input: string[]): string[] {
    return input.map(item => this.sanitizeInput(item)).filter(item => item.length > 0);
  }
}