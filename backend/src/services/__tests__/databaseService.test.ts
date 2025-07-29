/**
 * Unit tests for DatabaseService
 */

import { DatabaseService } from '../databaseService';
import { DataValidator } from '../../utils/dataValidation';

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeAll(() => {
    dbService = DatabaseService.getInstance();
  });

  describe('Data Loading', () => {
    test('should load colleges data successfully', () => {
      const colleges = dbService.getAllColleges();
      expect(colleges).toBeDefined();
      expect(Array.isArray(colleges)).toBe(true);
      expect(colleges.length).toBeGreaterThan(0);
    });

    test('should load careers data successfully', () => {
      const careers = dbService.getAllCareers();
      expect(careers).toBeDefined();
      expect(Array.isArray(careers)).toBe(true);
      expect(careers.length).toBeGreaterThan(0);
    });

    test('should load scholarships data successfully', () => {
      const scholarships = dbService.getAllScholarships();
      expect(scholarships).toBeDefined();
      expect(Array.isArray(scholarships)).toBe(true);
      expect(scholarships.length).toBeGreaterThan(0);
    });

    test('should validate all loaded data', () => {
      const colleges = dbService.getAllColleges();
      const careers = dbService.getAllCareers();
      const scholarships = dbService.getAllScholarships();

      colleges.forEach(college => {
        expect(DataValidator.validateCollege(college)).toBe(true);
      });

      careers.forEach(career => {
        expect(DataValidator.validateCareer(career)).toBe(true);
      });

      scholarships.forEach(scholarship => {
        expect(DataValidator.validateScholarship(scholarship)).toBe(true);
      });
    });
  });

  describe('Data Retrieval', () => {
    test('should find college by ID', () => {
      const college = dbService.getCollegeById('iit-delhi');
      expect(college).toBeDefined();
      expect(college?.name).toBe('Indian Institute of Technology Delhi');
    });

    test('should find career by ID', () => {
      const career = dbService.getCareerById('software-engineer');
      expect(career).toBeDefined();
      expect(career?.title).toBe('Software Engineer');
    });

    test('should find scholarship by ID', () => {
      const scholarship = dbService.getScholarshipById('inspire-scholarship');
      expect(scholarship).toBeDefined();
      expect(scholarship?.name).toBe('INSPIRE Scholarship');
    });

    test('should return undefined for non-existent IDs', () => {
      expect(dbService.getCollegeById('non-existent')).toBeUndefined();
      expect(dbService.getCareerById('non-existent')).toBeUndefined();
      expect(dbService.getScholarshipById('non-existent')).toBeUndefined();
    });
  });

  describe('Search Functionality', () => {
    test('should search colleges by type', () => {
      const governmentColleges = dbService.searchColleges({ type: 'government' });
      expect(governmentColleges.length).toBeGreaterThan(0);
      governmentColleges.forEach(college => {
        expect(college.type).toBe('government');
      });
    });

    test('should search colleges by location', () => {
      const delhiColleges = dbService.searchColleges({ location: 'Delhi' });
      expect(delhiColleges.length).toBeGreaterThan(0);
      delhiColleges.forEach(college => {
        expect(college.location.toLowerCase()).toContain('delhi');
      });
    });

    test('should search careers by NEP category', () => {
      const techCareers = dbService.searchCareers({ nepCategory: 'Science and Technology' });
      expect(techCareers.length).toBeGreaterThan(0);
      techCareers.forEach(career => {
        expect(career.nepCategory).toContain('Science and Technology');
      });
    });

    test('should search careers by minimum salary', () => {
      const highPayingCareers = dbService.searchCareers({ minSalary: 500000 });
      expect(highPayingCareers.length).toBeGreaterThan(0);
      highPayingCareers.forEach(career => {
        expect(career.averageSalary.entry).toBeGreaterThanOrEqual(500000);
      });
    });

    test('should search scholarships by category', () => {
      const scScholarships = dbService.searchScholarships({ category: 'SC' });
      expect(scScholarships.length).toBeGreaterThan(0);
      scScholarships.forEach(scholarship => {
        expect(scholarship.eligibility.categories).toContain('SC');
      });
    });
  });

  describe('Related Data Queries', () => {
    test('should get colleges for a specific career', () => {
      const colleges = dbService.getCollegesForCareer('software-engineer');
      expect(colleges.length).toBeGreaterThan(0);
      
      // Check if colleges offer relevant courses
      const hasRelevantCourse = colleges.some(college => 
        college.courses.some(course => 
          course.toLowerCase().includes('computer') || 
          course.toLowerCase().includes('information technology')
        )
      );
      expect(hasRelevantCourse).toBe(true);
    });

    test('should get applicable scholarships for student profile', () => {
      const profile = {
        category: 'SC',
        familyIncome: 200000,
        course: 'Engineering',
        gender: 'Female'
      };

      const scholarships = dbService.getApplicableScholarships(profile);
      expect(scholarships.length).toBeGreaterThan(0);
      
      scholarships.forEach(scholarship => {
        // Check category eligibility
        if (scholarship.eligibility.categories) {
          expect(scholarship.eligibility.categories).toContain('SC');
        }
        
        // Check income limit
        if (scholarship.eligibility.incomeLimit) {
          expect(scholarship.eligibility.incomeLimit).toBeGreaterThanOrEqual(200000);
        }
      });
    });
  });

  describe('Statistics', () => {
    test('should provide database statistics', () => {
      const stats = dbService.getStatistics();
      
      expect(stats.totalColleges).toBeGreaterThan(0);
      expect(stats.totalCareers).toBeGreaterThan(0);
      expect(stats.totalScholarships).toBeGreaterThan(0);
      
      expect(typeof stats.collegesByType).toBe('object');
      expect(typeof stats.careersByCategory).toBe('object');
      expect(typeof stats.scholarshipsByType).toBe('object');
      
      // Check if government colleges exist
      expect(stats.collegesByType.government).toBeGreaterThan(0);
    });
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});