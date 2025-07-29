/**
 * Data validation schemas and utilities for JSON databases
 */

export interface College {
  id: string;
  name: string;
  location: string;
  type: 'government' | 'private' | 'deemed';
  courses: string[];
  entranceExams: string[];
  fees: {
    annual: number;
    currency: string;
  };
  rankings: {
    nirf: number;
    category: string;
  };
  website?: string;
  established?: number;
}

export interface Career {
  id: string;
  title: string;
  description: string;
  nepCategory: string;
  requiredEducation: string[];
  skills: string[];
  averageSalary: {
    entry: number;
    mid: number;
    senior: number;
  };
  growthProjection: string;
  relatedExams: string[];
  workEnvironment?: string;
  jobMarket?: string;
}

export interface Scholarship {
  id: string;
  name: string;
  description: string;
  provider: string;
  eligibility: {
    categories?: string[];
    classes?: string[];
    courses?: string[];
    subjects?: string[];
    incomeLimit?: number;
    academicCriteria?: string;
    gender?: string;
    ageLimit?: number;
    qualification?: string[];
    disabilityPercentage?: number;
  };
  amount: {
    [key: string]: number | string;
    currency: string;
  };
  applicationPeriod: string;
  website?: string;
  renewable: boolean;
  type: 'Merit-based' | 'Need-based' | 'Merit-cum-Means';
}

export interface DatabaseStructure {
  colleges: College[];
  careers: Career[];
  scholarships: Scholarship[];
}

/**
 * Validation functions for database structures
 */
export class DataValidator {
  static validateCollege(college: any): college is College {
    return (
      typeof college.id === 'string' &&
      typeof college.name === 'string' &&
      typeof college.location === 'string' &&
      ['government', 'private', 'deemed'].includes(college.type) &&
      Array.isArray(college.courses) &&
      Array.isArray(college.entranceExams) &&
      typeof college.fees === 'object' &&
      typeof college.fees.annual === 'number' &&
      typeof college.fees.currency === 'string' &&
      typeof college.rankings === 'object' &&
      typeof college.rankings.nirf === 'number' &&
      typeof college.rankings.category === 'string'
    );
  }

  static validateCareer(career: any): career is Career {
    return (
      typeof career.id === 'string' &&
      typeof career.title === 'string' &&
      typeof career.description === 'string' &&
      typeof career.nepCategory === 'string' &&
      Array.isArray(career.requiredEducation) &&
      Array.isArray(career.skills) &&
      typeof career.averageSalary === 'object' &&
      typeof career.averageSalary.entry === 'number' &&
      typeof career.averageSalary.mid === 'number' &&
      typeof career.averageSalary.senior === 'number' &&
      typeof career.growthProjection === 'string' &&
      Array.isArray(career.relatedExams)
    );
  }

  static validateScholarship(scholarship: any): scholarship is Scholarship {
    return (
      typeof scholarship.id === 'string' &&
      typeof scholarship.name === 'string' &&
      typeof scholarship.description === 'string' &&
      typeof scholarship.provider === 'string' &&
      typeof scholarship.eligibility === 'object' &&
      typeof scholarship.amount === 'object' &&
      typeof scholarship.amount.currency === 'string' &&
      typeof scholarship.applicationPeriod === 'string' &&
      typeof scholarship.renewable === 'boolean' &&
      ['Merit-based', 'Need-based', 'Merit-cum-Means'].includes(scholarship.type)
    );
  }

  static validateDatabase(data: any): data is DatabaseStructure {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Validate colleges array
    if (data.colleges && Array.isArray(data.colleges)) {
      for (const college of data.colleges) {
        if (!this.validateCollege(college)) {
          console.error('Invalid college data:', college);
          return false;
        }
      }
    }

    // Validate careers array
    if (data.careers && Array.isArray(data.careers)) {
      for (const career of data.careers) {
        if (!this.validateCareer(career)) {
          console.error('Invalid career data:', career);
          return false;
        }
      }
    }

    // Validate scholarships array
    if (data.scholarships && Array.isArray(data.scholarships)) {
      for (const scholarship of data.scholarships) {
        if (!this.validateScholarship(scholarship)) {
          console.error('Invalid scholarship data:', scholarship);
          return false;
        }
      }
    }

    return true;
  }
}

/**
 * Utility functions for data processing
 */
export class DataUtils {
  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }

  static validateId(id: string): boolean {
    return /^[a-z0-9-]+$/.test(id);
  }

  static formatCurrency(amount: number, currency: string = 'INR'): string {
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }

  static categorizeByIncome(incomeLimit: number): string {
    if (incomeLimit <= 100000) return 'Low Income';
    if (incomeLimit <= 500000) return 'Middle Income';
    if (incomeLimit <= 1000000) return 'Upper Middle Income';
    return 'High Income';
  }

  static getEducationLevel(course: string): string {
    const lowerCourse = course.toLowerCase();
    if (lowerCourse.includes('phd') || lowerCourse.includes('doctorate')) {
      return 'Doctoral';
    }
    if (lowerCourse.includes('master') || lowerCourse.includes('mtech') || 
        lowerCourse.includes('msc') || lowerCourse.includes('ma') || 
        lowerCourse.includes('mba')) {
      return 'Masters';
    }
    if (lowerCourse.includes('bachelor') || lowerCourse.includes('btech') || 
        lowerCourse.includes('bsc') || lowerCourse.includes('ba') || 
        lowerCourse.includes('bcom') || lowerCourse.includes('be')) {
      return 'Bachelors';
    }
    if (lowerCourse.includes('diploma')) {
      return 'Diploma';
    }
    return 'Other';
  }
}