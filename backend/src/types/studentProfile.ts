/**
 * Student Profile data models and interfaces
 */

export interface SocioeconomicData {
  location: string;
  familyBackground: string;
  economicFactors: string[];
  parentOccupation?: {
    father?: string;
    mother?: string;
  };
  householdSize?: number;
  ruralUrban: 'rural' | 'urban' | 'semi-urban';
  transportMode?: string;
  internetAccess: boolean;
  deviceAccess: string[];
}

export interface AcademicData {
  interests: string[];
  subjects: string[];
  performance: string;
  favoriteSubjects: string[];
  difficultSubjects: string[];
  extracurricularActivities: string[];
  achievements?: string[];
}

export interface PersonalInfo {
  name: string;
  grade: string;
  board: string;
  languagePreference: 'hindi' | 'english';
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  category?: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  physicallyDisabled?: boolean;
}

export interface StudentProfile {
  id: string;
  timestamp: Date;
  personalInfo: PersonalInfo;
  academicData: AcademicData;
  socioeconomicData: SocioeconomicData;
  familyIncome: string;
  aspirations?: {
    preferredCareers: string[];
    preferredLocations: string[];
    salaryExpectations?: string;
    workLifeBalance?: 'high' | 'medium' | 'low';
  };
  constraints?: {
    financialConstraints: boolean;
    locationConstraints: string[];
    familyExpectations: string[];
    timeConstraints?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Student Profile validation functions
 */
export class StudentProfileValidator {
  static validatePersonalInfo(personalInfo: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!personalInfo.name || typeof personalInfo.name !== 'string' || personalInfo.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!personalInfo.grade || typeof personalInfo.grade !== 'string') {
      errors.push('Grade is required');
    }

    if (!personalInfo.board || typeof personalInfo.board !== 'string') {
      errors.push('Board is required');
    }

    if (!personalInfo.languagePreference || !['hindi', 'english'].includes(personalInfo.languagePreference)) {
      errors.push('Language preference must be either "hindi" or "english"');
    }

    if (personalInfo.age && (typeof personalInfo.age !== 'number' || personalInfo.age < 10 || personalInfo.age > 25)) {
      warnings.push('Age should be between 10 and 25 for typical students');
    }

    if (personalInfo.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(personalInfo.gender)) {
      errors.push('Invalid gender value');
    }

    if (personalInfo.category && !['General', 'OBC', 'SC', 'ST', 'EWS'].includes(personalInfo.category)) {
      errors.push('Invalid category value');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateAcademicData(academicData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!academicData.interests || !Array.isArray(academicData.interests) || academicData.interests.length === 0) {
      errors.push('At least one interest must be selected');
    }

    if (!academicData.subjects || !Array.isArray(academicData.subjects)) {
      errors.push('Subjects array is required');
    }

    if (!academicData.performance || typeof academicData.performance !== 'string') {
      errors.push('Academic performance is required');
    }

    if (academicData.favoriteSubjects && !Array.isArray(academicData.favoriteSubjects)) {
      errors.push('Favorite subjects must be an array');
    }

    if (academicData.difficultSubjects && !Array.isArray(academicData.difficultSubjects)) {
      errors.push('Difficult subjects must be an array');
    }

    if (academicData.extracurricularActivities && !Array.isArray(academicData.extracurricularActivities)) {
      errors.push('Extracurricular activities must be an array');
    }

    if (academicData.interests && academicData.interests.length > 10) {
      warnings.push('Too many interests selected, consider focusing on top priorities');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateSocioeconomicData(socioeconomicData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!socioeconomicData.location || typeof socioeconomicData.location !== 'string') {
      errors.push('Location is required');
    }

    if (!socioeconomicData.familyBackground || typeof socioeconomicData.familyBackground !== 'string') {
      errors.push('Family background is required');
    }

    if (!socioeconomicData.economicFactors || !Array.isArray(socioeconomicData.economicFactors)) {
      errors.push('Economic factors must be an array');
    }

    if (!socioeconomicData.ruralUrban || !['rural', 'urban', 'semi-urban'].includes(socioeconomicData.ruralUrban)) {
      errors.push('Rural/Urban classification is required');
    }

    if (typeof socioeconomicData.internetAccess !== 'boolean') {
      errors.push('Internet access must be specified as true or false');
    }

    if (!socioeconomicData.deviceAccess || !Array.isArray(socioeconomicData.deviceAccess)) {
      errors.push('Device access must be an array');
    }

    if (socioeconomicData.householdSize && (typeof socioeconomicData.householdSize !== 'number' || socioeconomicData.householdSize < 1)) {
      errors.push('Household size must be a positive number');
    }

    if (socioeconomicData.householdSize && socioeconomicData.householdSize > 15) {
      warnings.push('Unusually large household size');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateStudentProfile(profile: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!profile.id || typeof profile.id !== 'string') {
      errors.push('Profile ID is required');
    }

    if (!profile.timestamp || !(profile.timestamp instanceof Date)) {
      errors.push('Valid timestamp is required');
    }

    if (!profile.familyIncome || typeof profile.familyIncome !== 'string') {
      errors.push('Family income is required');
    }

    // Validate nested objects
    if (profile.personalInfo) {
      const personalInfoResult = this.validatePersonalInfo(profile.personalInfo);
      errors.push(...personalInfoResult.errors);
      if (personalInfoResult.warnings) warnings.push(...personalInfoResult.warnings);
    } else {
      errors.push('Personal information is required');
    }

    if (profile.academicData) {
      const academicDataResult = this.validateAcademicData(profile.academicData);
      errors.push(...academicDataResult.errors);
      if (academicDataResult.warnings) warnings.push(...academicDataResult.warnings);
    } else {
      errors.push('Academic data is required');
    }

    if (profile.socioeconomicData) {
      const socioeconomicResult = this.validateSocioeconomicData(profile.socioeconomicData);
      errors.push(...socioeconomicResult.errors);
      if (socioeconomicResult.warnings) warnings.push(...socioeconomicResult.warnings);
    } else {
      errors.push('Socioeconomic data is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Utility functions for student profile processing
 */
export class StudentProfileUtils {
  static generateProfileId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `profile_${timestamp}_${randomStr}`;
  }

  static sanitizeProfile(profile: StudentProfile): StudentProfile {
    return {
      ...profile,
      personalInfo: {
        ...profile.personalInfo,
        name: profile.personalInfo.name.trim(),
        grade: profile.personalInfo.grade.trim(),
        board: profile.personalInfo.board.trim()
      },
      academicData: {
        ...profile.academicData,
        interests: profile.academicData.interests.map(interest => interest.trim()),
        subjects: profile.academicData.subjects.map(subject => subject.trim()),
        performance: profile.academicData.performance.trim()
      },
      socioeconomicData: {
        ...profile.socioeconomicData,
        location: profile.socioeconomicData.location.trim(),
        familyBackground: profile.socioeconomicData.familyBackground.trim(),
        economicFactors: profile.socioeconomicData.economicFactors.map(factor => factor.trim())
      }
    };
  }

  static getProfileSummary(profile: StudentProfile): string {
    const { personalInfo, academicData, socioeconomicData } = profile;
    return `${personalInfo.name}, Grade ${personalInfo.grade} (${personalInfo.board}), ` +
           `from ${socioeconomicData.location}, interested in ${academicData.interests.slice(0, 3).join(', ')}`;
  }

  static calculateProfileCompleteness(profile: StudentProfile): number {
    let totalFields = 0;
    let completedFields = 0;

    // Check personal info completeness
    const personalFields = ['name', 'grade', 'board', 'languagePreference'];
    totalFields += personalFields.length;
    completedFields += personalFields.filter(field => 
      profile.personalInfo[field as keyof PersonalInfo]
    ).length;

    // Check academic data completeness
    const academicFields = ['interests', 'subjects', 'performance'];
    totalFields += academicFields.length;
    completedFields += academicFields.filter(field => {
      const value = profile.academicData[field as keyof AcademicData];
      return Array.isArray(value) ? value.length > 0 : !!value;
    }).length;

    // Check socioeconomic data completeness
    const socioFields = ['location', 'familyBackground', 'economicFactors', 'ruralUrban', 'internetAccess'];
    totalFields += socioFields.length;
    completedFields += socioFields.filter(field => {
      const value = profile.socioeconomicData[field as keyof SocioeconomicData];
      return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
    }).length;

    // Check family income
    totalFields += 1;
    if (profile.familyIncome) completedFields += 1;

    return Math.round((completedFields / totalFields) * 100);
  }

  static extractKeywords(profile: StudentProfile): string[] {
    const keywords: string[] = [];
    
    // Add interests
    keywords.push(...profile.academicData.interests);
    
    // Add subjects
    keywords.push(...profile.academicData.subjects);
    
    // Add favorite subjects
    if (profile.academicData.favoriteSubjects) {
      keywords.push(...profile.academicData.favoriteSubjects);
    }
    
    // Add extracurricular activities
    if (profile.academicData.extracurricularActivities) {
      keywords.push(...profile.academicData.extracurricularActivities);
    }
    
    // Add economic factors
    keywords.push(...profile.socioeconomicData.economicFactors);
    
    // Add aspirations
    if (profile.aspirations?.preferredCareers) {
      keywords.push(...profile.aspirations.preferredCareers);
    }
    
    // Remove duplicates and return
    return [...new Set(keywords.map(keyword => keyword.toLowerCase()))];
  }
}