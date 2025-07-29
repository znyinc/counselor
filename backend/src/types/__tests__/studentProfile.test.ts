/**
 * Unit tests for StudentProfile types and validation
 */

import { 
  StudentProfile, 
  StudentProfileValidator, 
  StudentProfileUtils,
  PersonalInfo,
  AcademicData,
  SocioeconomicData
} from '../studentProfile';

describe('StudentProfileValidator', () => {
  describe('validatePersonalInfo', () => {
    const validPersonalInfo: PersonalInfo = {
      name: 'Rahul Sharma',
      grade: '12',
      board: 'CBSE',
      languagePreference: 'english',
      age: 17,
      gender: 'male',
      category: 'General'
    };

    test('should validate correct personal info', () => {
      const result = StudentProfileValidator.validatePersonalInfo(validPersonalInfo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty name', () => {
      const invalidInfo = { ...validPersonalInfo, name: '' };
      const result = StudentProfileValidator.validatePersonalInfo(invalidInfo);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters long');
    });

    test('should reject invalid language preference', () => {
      const invalidInfo = { ...validPersonalInfo, languagePreference: 'spanish' };
      const result = StudentProfileValidator.validatePersonalInfo(invalidInfo);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Language preference must be either "hindi" or "english"');
    });

    test('should warn about unusual age', () => {
      const invalidInfo = { ...validPersonalInfo, age: 30 };
      const result = StudentProfileValidator.validatePersonalInfo(invalidInfo);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Age should be between 10 and 25 for typical students');
    });

    test('should reject invalid gender', () => {
      const invalidInfo = { ...validPersonalInfo, gender: 'invalid' as any };
      const result = StudentProfileValidator.validatePersonalInfo(invalidInfo);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid gender value');
    });

    test('should reject invalid category', () => {
      const invalidInfo = { ...validPersonalInfo, category: 'Invalid' as any };
      const result = StudentProfileValidator.validatePersonalInfo(invalidInfo);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid category value');
    });
  });

  describe('validateAcademicData', () => {
    const validAcademicData: AcademicData = {
      interests: ['Science', 'Technology'],
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      performance: 'Good',
      favoriteSubjects: ['Physics'],
      difficultSubjects: ['Chemistry'],
      extracurricularActivities: ['Debate', 'Sports']
    };

    test('should validate correct academic data', () => {
      const result = StudentProfileValidator.validateAcademicData(validAcademicData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty interests', () => {
      const invalidData = { ...validAcademicData, interests: [] };
      const result = StudentProfileValidator.validateAcademicData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one interest must be selected');
    });

    test('should reject non-array subjects', () => {
      const invalidData = { ...validAcademicData, subjects: 'Physics' as any };
      const result = StudentProfileValidator.validateAcademicData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subjects array is required');
    });

    test('should warn about too many interests', () => {
      const manyInterests = Array.from({ length: 12 }, (_, i) => `Interest ${i + 1}`);
      const invalidData = { ...validAcademicData, interests: manyInterests };
      const result = StudentProfileValidator.validateAcademicData(invalidData);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Too many interests selected, consider focusing on top priorities');
    });
  });

  describe('validateSocioeconomicData', () => {
    const validSocioeconomicData: SocioeconomicData = {
      location: 'Delhi',
      familyBackground: 'Middle class family',
      economicFactors: ['Dual Income Family'],
      ruralUrban: 'urban',
      internetAccess: true,
      deviceAccess: ['Smartphone', 'Laptop'],
      householdSize: 4
    };

    test('should validate correct socioeconomic data', () => {
      const result = StudentProfileValidator.validateSocioeconomicData(validSocioeconomicData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing location', () => {
      const invalidData = { ...validSocioeconomicData, location: '' };
      const result = StudentProfileValidator.validateSocioeconomicData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location is required');
    });

    test('should reject invalid rural/urban classification', () => {
      const invalidData = { ...validSocioeconomicData, ruralUrban: 'suburban' as any };
      const result = StudentProfileValidator.validateSocioeconomicData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rural/Urban classification is required');
    });

    test('should reject non-boolean internet access', () => {
      const invalidData = { ...validSocioeconomicData, internetAccess: 'yes' as any };
      const result = StudentProfileValidator.validateSocioeconomicData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Internet access must be specified as true or false');
    });

    test('should warn about large household size', () => {
      const invalidData = { ...validSocioeconomicData, householdSize: 20 };
      const result = StudentProfileValidator.validateSocioeconomicData(invalidData);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Unusually large household size');
    });
  });

  describe('validateStudentProfile', () => {
    const validProfile: StudentProfile = {
      id: 'profile_123',
      timestamp: new Date(),
      personalInfo: {
        name: 'Priya Patel',
        grade: '11',
        board: 'CBSE',
        languagePreference: 'hindi',
        category: 'OBC'
      },
      academicData: {
        interests: ['Mathematics', 'Science'],
        subjects: ['Math', 'Physics', 'Chemistry'],
        performance: 'Excellent',
        favoriteSubjects: ['Math'],
        difficultSubjects: [],
        extracurricularActivities: ['Math Olympiad']
      },
      socioeconomicData: {
        location: 'Mumbai',
        familyBackground: 'Business family',
        economicFactors: ['Business Family'],
        ruralUrban: 'urban',
        internetAccess: true,
        deviceAccess: ['Smartphone']
      },
      familyIncome: '5-10 Lakhs'
    };

    test('should validate complete student profile', () => {
      const result = StudentProfileValidator.validateStudentProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject profile without ID', () => {
      const invalidProfile = { ...validProfile, id: '' };
      const result = StudentProfileValidator.validateStudentProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile ID is required');
    });

    test('should reject profile without timestamp', () => {
      const invalidProfile = { ...validProfile, timestamp: null as any };
      const result = StudentProfileValidator.validateStudentProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid timestamp is required');
    });

    test('should reject profile without personal info', () => {
      const invalidProfile = { ...validProfile, personalInfo: null as any };
      const result = StudentProfileValidator.validateStudentProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Personal information is required');
    });
  });
});

describe('StudentProfileUtils', () => {
  describe('generateProfileId', () => {
    test('should generate unique profile IDs', () => {
      const id1 = StudentProfileUtils.generateProfileId();
      const id2 = StudentProfileUtils.generateProfileId();
      
      expect(id1).toMatch(/^profile_[a-z0-9]+_[a-z0-9]+$/);
      expect(id2).toMatch(/^profile_[a-z0-9]+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('sanitizeProfile', () => {
    test('should trim whitespace from string fields', () => {
      const profile: StudentProfile = {
        id: 'test',
        timestamp: new Date(),
        personalInfo: {
          name: '  John Doe  ',
          grade: ' 12 ',
          board: ' CBSE ',
          languagePreference: 'english'
        },
        academicData: {
          interests: [' Science ', ' Math '],
          subjects: [' Physics '],
          performance: ' Good ',
          favoriteSubjects: [],
          difficultSubjects: [],
          extracurricularActivities: []
        },
        socioeconomicData: {
          location: ' Delhi ',
          familyBackground: ' Middle class ',
          economicFactors: [' Dual Income '],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: []
        },
        familyIncome: '5-10 Lakhs'
      };

      const sanitized = StudentProfileUtils.sanitizeProfile(profile);
      
      expect(sanitized.personalInfo.name).toBe('John Doe');
      expect(sanitized.personalInfo.grade).toBe('12');
      expect(sanitized.personalInfo.board).toBe('CBSE');
      expect(sanitized.academicData.interests).toEqual(['Science', 'Math']);
      expect(sanitized.academicData.performance).toBe('Good');
      expect(sanitized.socioeconomicData.location).toBe('Delhi');
      expect(sanitized.socioeconomicData.familyBackground).toBe('Middle class');
      expect(sanitized.socioeconomicData.economicFactors).toEqual(['Dual Income']);
    });
  });

  describe('getProfileSummary', () => {
    test('should generate readable profile summary', () => {
      const profile: StudentProfile = {
        id: 'test',
        timestamp: new Date(),
        personalInfo: {
          name: 'Amit Kumar',
          grade: '12',
          board: 'CBSE',
          languagePreference: 'hindi'
        },
        academicData: {
          interests: ['Engineering', 'Technology', 'Mathematics'],
          subjects: [],
          performance: 'Good',
          favoriteSubjects: [],
          difficultSubjects: [],
          extracurricularActivities: []
        },
        socioeconomicData: {
          location: 'Bangalore',
          familyBackground: 'Tech family',
          economicFactors: [],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: []
        },
        familyIncome: '10-20 Lakhs'
      };

      const summary = StudentProfileUtils.getProfileSummary(profile);
      expect(summary).toBe('Amit Kumar, Grade 12 (CBSE), from Bangalore, interested in Engineering, Technology, Mathematics');
    });
  });

  describe('calculateProfileCompleteness', () => {
    test('should calculate completeness percentage correctly', () => {
      const completeProfile: StudentProfile = {
        id: 'test',
        timestamp: new Date(),
        personalInfo: {
          name: 'Test User',
          grade: '12',
          board: 'CBSE',
          languagePreference: 'english'
        },
        academicData: {
          interests: ['Science'],
          subjects: ['Physics'],
          performance: 'Good',
          favoriteSubjects: [],
          difficultSubjects: [],
          extracurricularActivities: []
        },
        socioeconomicData: {
          location: 'Delhi',
          familyBackground: 'Middle class',
          economicFactors: ['Dual Income'],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: ['Smartphone']
        },
        familyIncome: '5-10 Lakhs'
      };

      const completeness = StudentProfileUtils.calculateProfileCompleteness(completeProfile);
      expect(completeness).toBe(100);
    });

    test('should handle incomplete profiles', () => {
      const incompleteProfile: StudentProfile = {
        id: 'test',
        timestamp: new Date(),
        personalInfo: {
          name: 'Test User',
          grade: '12',
          board: 'CBSE',
          languagePreference: 'english'
        },
        academicData: {
          interests: [],
          subjects: [],
          performance: '',
          favoriteSubjects: [],
          difficultSubjects: [],
          extracurricularActivities: []
        },
        socioeconomicData: {
          location: '',
          familyBackground: '',
          economicFactors: [],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: []
        },
        familyIncome: ''
      };

      const completeness = StudentProfileUtils.calculateProfileCompleteness(incompleteProfile);
      expect(completeness).toBeLessThan(100);
    });
  });

  describe('extractKeywords', () => {
    test('should extract unique keywords from profile', () => {
      const profile: StudentProfile = {
        id: 'test',
        timestamp: new Date(),
        personalInfo: {
          name: 'Test User',
          grade: '12',
          board: 'CBSE',
          languagePreference: 'english'
        },
        academicData: {
          interests: ['Science', 'Technology'],
          subjects: ['Physics', 'Chemistry'],
          performance: 'Good',
          favoriteSubjects: ['Physics'],
          difficultSubjects: [],
          extracurricularActivities: ['Robotics']
        },
        socioeconomicData: {
          location: 'Delhi',
          familyBackground: 'Tech family',
          economicFactors: ['Tech Background'],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: []
        },
        familyIncome: '10-20 Lakhs',
        aspirations: {
          preferredCareers: ['Engineering'],
          preferredLocations: []
        }
      };

      const keywords = StudentProfileUtils.extractKeywords(profile);
      expect(keywords).toContain('science');
      expect(keywords).toContain('technology');
      expect(keywords).toContain('physics');
      expect(keywords).toContain('chemistry');
      expect(keywords).toContain('robotics');
      expect(keywords).toContain('tech background');
      expect(keywords).toContain('engineering');
      
      // Should not have duplicates
      const uniqueKeywords = [...new Set(keywords)];
      expect(keywords.length).toBe(uniqueKeywords.length);
    });
  });
});