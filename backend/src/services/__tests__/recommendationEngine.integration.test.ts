/**
 * Integration tests for RecommendationEngine
 * Tests the complete flow with real database and mock AI
 */

import { RecommendationEngine, RecommendationEngineConfig } from '../recommendationEngine';
import { StudentProfile } from '../../types/studentProfile';
import { DatabaseService } from '../databaseService';
import * as fs from 'fs';
import * as path from 'path';

describe('RecommendationEngine Integration Tests', () => {
  let engine: RecommendationEngine;
  let databaseService: DatabaseService;

  const testConfig: RecommendationEngineConfig = {
    useOpenAI: false, // Use mock for integration tests
    maxRecommendations: 3,
    minMatchScore: 50,
    enableDatabaseEnrichment: true
  };

  beforeAll(() => {
    // Ensure test data files exist
    const dataPath = path.join(__dirname, '../../../data');
    
    // Create test data if it doesn't exist
    if (!fs.existsSync(path.join(dataPath, 'colleges.json'))) {
      console.log('Creating test data files for integration tests');
      createTestDataFiles(dataPath);
    }

    databaseService = DatabaseService.getInstance();
    engine = new RecommendationEngine(testConfig);
  });

  describe('End-to-End Recommendation Generation', () => {
    it('should generate complete recommendations for a science student', async () => {
      const scienceStudent: StudentProfile = {
        id: 'science-student-001',
        timestamp: new Date(),
        personalInfo: {
          name: 'Arjun Sharma',
          grade: '12',
          board: 'CBSE',
          languagePreference: 'english',
          age: 17,
          gender: 'male',
          category: 'General'
        },
        academicData: {
          interests: ['Physics', 'Mathematics', 'Computer Science', 'Engineering'],
          subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
          performance: 'Excellent',
          favoriteSubjects: ['Physics', 'Mathematics'],
          difficultSubjects: ['Chemistry'],
          extracurricularActivities: ['Science Club', 'Robotics', 'Coding'],
          achievements: ['State Science Fair Winner']
        },
        socioeconomicData: {
          location: 'Delhi',
          familyBackground: 'Middle class family, both parents working',
          economicFactors: ['Stable income', 'Education priority', 'Technology access'],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: ['Laptop', 'Smartphone', 'Tablet'],
          householdSize: 4,
          parentOccupation: {
            father: 'Software Engineer',
            mother: 'Teacher'
          }
        },
        familyIncome: '8-12 Lakh per annum',
        aspirations: {
          preferredCareers: ['Software Engineer', 'Data Scientist', 'Research Scientist'],
          preferredLocations: ['Delhi', 'Bangalore', 'Hyderabad'],
          salaryExpectations: '10-15 LPA',
          workLifeBalance: 'medium'
        },
        constraints: {
          financialConstraints: false,
          locationConstraints: [],
          familyExpectations: ['Stable career', 'Good growth prospects']
        }
      };

      const result = await engine.generateRecommendations(scienceStudent);

      // Verify basic structure
      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
      expect(result.context).toBeDefined();
      expect(result.metadata).toBeDefined();

      // Verify recommendations quality
      result.recommendations.forEach(rec => {
        expect(rec.matchScore).toBeGreaterThanOrEqual(50);
        expect(rec.title).toBeDefined();
        expect(rec.description.length).toBeGreaterThan(50);
        expect(rec.requirements.education).toHaveLength.greaterThan(0);
        expect(rec.requirements.skills).toHaveLength.greaterThan(0);
        expect(rec.prospects.averageSalary.entry).toBeGreaterThan(0);
        expect(rec.visualData).toBeDefined();
        expect(rec.visualData.salaryTrends).toBeDefined();
        expect(rec.visualData.educationPath).toBeDefined();
      });

      // Verify database enrichment
      const hasColleges = result.recommendations.some(rec => 
        rec.recommendedColleges && rec.recommendedColleges.length > 0
      );
      expect(hasColleges).toBe(true);

      // Verify context generation
      expect(result.context.studentProfile.interests).toEqual(scienceStudent.academicData.interests);
      expect(result.context.reasoningFactors.interestMatch).toBeGreaterThan(0);
      expect(result.context.reasoningFactors.skillAlignment).toBeGreaterThan(0);

      console.log('Science student recommendations:', result.recommendations.map(r => ({
        title: r.title,
        matchScore: r.matchScore,
        colleges: r.recommendedColleges.length,
        scholarships: r.scholarships.length
      })));
    });

    it('should generate appropriate recommendations for a commerce student', async () => {
      const commerceStudent: StudentProfile = {
        id: 'commerce-student-001',
        timestamp: new Date(),
        personalInfo: {
          name: 'Priya Patel',
          grade: '12',
          board: 'CBSE',
          languagePreference: 'english',
          age: 17,
          gender: 'female',
          category: 'OBC'
        },
        academicData: {
          interests: ['Business', 'Economics', 'Accounting', 'Finance'],
          subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics'],
          performance: 'Good',
          favoriteSubjects: ['Business Studies', 'Economics'],
          difficultSubjects: ['Mathematics'],
          extracurricularActivities: ['Debate Club', 'Business Quiz', 'Student Council'],
          achievements: ['Best Speaker Award']
        },
        socioeconomicData: {
          location: 'Mumbai',
          familyBackground: 'Business family background',
          economicFactors: ['Family business', 'Financial awareness', 'Investment knowledge'],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: ['Smartphone', 'Laptop'],
          householdSize: 5,
          parentOccupation: {
            father: 'Business Owner',
            mother: 'Homemaker'
          }
        },
        familyIncome: '15-20 Lakh per annum',
        aspirations: {
          preferredCareers: ['Chartered Accountant', 'Investment Banker', 'Business Analyst'],
          preferredLocations: ['Mumbai', 'Delhi', 'Pune'],
          salaryExpectations: '12-18 LPA',
          workLifeBalance: 'medium'
        },
        constraints: {
          financialConstraints: false,
          locationConstraints: [],
          familyExpectations: ['Professional qualification', 'Financial independence']
        }
      };

      const result = await engine.generateRecommendations(commerceStudent);

      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);

      // Verify commerce-relevant recommendations
      const hasCommerceCareer = result.recommendations.some(rec =>
        rec.title.toLowerCase().includes('account') ||
        rec.title.toLowerCase().includes('business') ||
        rec.title.toLowerCase().includes('finance')
      );
      expect(hasCommerceCareer).toBe(true);

      console.log('Commerce student recommendations:', result.recommendations.map(r => ({
        title: r.title,
        matchScore: r.matchScore,
        nepAlignment: r.nepAlignment.substring(0, 100) + '...'
      })));
    });

    it('should generate recommendations for a rural student with financial constraints', async () => {
      const ruralStudent: StudentProfile = {
        id: 'rural-student-001',
        timestamp: new Date(),
        personalInfo: {
          name: 'Ravi Kumar',
          grade: '12',
          board: 'State Board',
          languagePreference: 'hindi',
          age: 18,
          gender: 'male',
          category: 'SC'
        },
        academicData: {
          interests: ['Agriculture', 'Teaching', 'Government Service'],
          subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
          performance: 'Average',
          favoriteSubjects: ['Biology', 'Physics'],
          difficultSubjects: ['Chemistry'],
          extracurricularActivities: ['Sports', 'Community Service'],
          achievements: ['District Level Sports Champion']
        },
        socioeconomicData: {
          location: 'Rajasthan',
          familyBackground: 'Agricultural family',
          economicFactors: ['Seasonal income', 'Limited resources', 'Education aspiration'],
          ruralUrban: 'rural',
          internetAccess: false,
          deviceAccess: ['Basic phone'],
          householdSize: 7,
          parentOccupation: {
            father: 'Farmer',
            mother: 'Homemaker'
          }
        },
        familyIncome: 'Below 2 Lakh per annum',
        aspirations: {
          preferredCareers: ['Teacher', 'Government Officer', 'Agricultural Officer'],
          preferredLocations: ['Local area', 'District headquarters'],
          salaryExpectations: '4-6 LPA',
          workLifeBalance: 'high'
        },
        constraints: {
          financialConstraints: true,
          locationConstraints: ['Cannot relocate far from home'],
          familyExpectations: ['Stable government job', 'Support family']
        }
      };

      const result = await engine.generateRecommendations(ruralStudent);

      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);

      // Verify appropriate recommendations for rural/constrained student
      result.recommendations.forEach(rec => {
        // Should have realistic salary expectations
        expect(rec.prospects.averageSalary.entry).toBeLessThan(800000);
        
        // Should include scholarship information
        expect(rec.scholarships).toBeDefined();
      });

      // Should have government/teaching related careers
      const hasAppropriateCareer = result.recommendations.some(rec =>
        rec.title.toLowerCase().includes('teacher') ||
        rec.title.toLowerCase().includes('government') ||
        rec.title.toLowerCase().includes('officer')
      );
      expect(hasAppropriateCareer).toBe(true);

      console.log('Rural student recommendations:', result.recommendations.map(r => ({
        title: r.title,
        matchScore: r.matchScore,
        entrySalary: r.prospects.averageSalary.entry,
        scholarships: r.scholarships.length
      })));
    });

    it('should handle students with diverse interests', async () => {
      const diverseStudent: StudentProfile = {
        id: 'diverse-student-001',
        timestamp: new Date(),
        personalInfo: {
          name: 'Ananya Singh',
          grade: '11',
          board: 'ICSE',
          languagePreference: 'english',
          age: 16,
          gender: 'female',
          category: 'General'
        },
        academicData: {
          interests: ['Arts', 'Technology', 'Social Work', 'Environment', 'Writing'],
          subjects: ['English', 'History', 'Psychology', 'Computer Science'],
          performance: 'Good',
          favoriteSubjects: ['English', 'Psychology'],
          difficultSubjects: ['Mathematics'],
          extracurricularActivities: ['Drama Club', 'Environmental Club', 'School Magazine'],
          achievements: ['Best Article Writer', 'Environmental Awareness Campaign Leader']
        },
        socioeconomicData: {
          location: 'Bangalore',
          familyBackground: 'Professional family with diverse interests',
          economicFactors: ['Stable income', 'Cultural exposure', 'Social awareness'],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: ['Laptop', 'Smartphone'],
          householdSize: 4,
          parentOccupation: {
            father: 'Doctor',
            mother: 'Social Worker'
          }
        },
        familyIncome: '12-15 Lakh per annum',
        aspirations: {
          preferredCareers: ['Psychologist', 'Content Writer', 'Social Worker'],
          preferredLocations: ['Bangalore', 'Delhi', 'Mumbai'],
          salaryExpectations: '6-10 LPA',
          workLifeBalance: 'high'
        },
        constraints: {
          financialConstraints: false,
          locationConstraints: [],
          familyExpectations: ['Meaningful work', 'Social contribution']
        }
      };

      const result = await engine.generateRecommendations(diverseStudent);

      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);

      // Should handle diverse interests appropriately
      const hasCreativeCareer = result.recommendations.some(rec =>
        rec.title.toLowerCase().includes('writer') ||
        rec.title.toLowerCase().includes('psychologist') ||
        rec.title.toLowerCase().includes('social') ||
        rec.title.toLowerCase().includes('counselor')
      );
      expect(hasCreativeCareer).toBe(true);

      console.log('Diverse interests student recommendations:', result.recommendations.map(r => ({
        title: r.title,
        matchScore: r.matchScore,
        workLifeBalance: r.prospects.workLifeBalance
      })));
    });
  });

  describe('Database Integration', () => {
    it('should successfully integrate with college database', async () => {
      const colleges = databaseService.getAllColleges();
      expect(colleges.length).toBeGreaterThan(0);

      const testProfile = createTestProfile();
      const result = await engine.generateRecommendations(testProfile);

      const hasCollegeRecommendations = result.recommendations.some(rec =>
        rec.recommendedColleges.length > 0
      );
      expect(hasCollegeRecommendations).toBe(true);
    });

    it('should successfully integrate with scholarship database', async () => {
      const scholarships = databaseService.getAllScholarships();
      expect(scholarships.length).toBeGreaterThan(0);

      const testProfile = createTestProfile();
      const result = await engine.generateRecommendations(testProfile);

      const hasScholarshipRecommendations = result.recommendations.some(rec =>
        rec.scholarships.length > 0
      );
      expect(hasScholarshipRecommendations).toBe(true);
    });

    it('should successfully integrate with career database', async () => {
      const careers = databaseService.getAllCareers();
      expect(careers.length).toBeGreaterThan(0);

      const testProfile = createTestProfile();
      const result = await engine.generateRecommendations(testProfile);

      // Should enhance recommendations with database career data
      result.recommendations.forEach(rec => {
        expect(rec.prospects.averageSalary.entry).toBeGreaterThan(0);
        expect(rec.requirements.education.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should generate recommendations within acceptable time', async () => {
      const testProfile = createTestProfile();
      const startTime = Date.now();

      const result = await engine.generateRecommendations(testProfile);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metadata.processingTime).toBeLessThan(5000);

      console.log(`Recommendation generation took ${processingTime}ms`);
    });

    it('should handle multiple concurrent requests', async () => {
      const profiles = [
        createTestProfile('student-1'),
        createTestProfile('student-2'),
        createTestProfile('student-3')
      ];

      const startTime = Date.now();
      const promises = profiles.map(profile => engine.generateRecommendations(profile));
      const results = await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.recommendations).toHaveLength(3);
      });

      console.log(`Concurrent recommendation generation took ${totalTime}ms`);
    });
  });

  describe('Error Resilience', () => {
    it('should handle corrupted database gracefully', async () => {
      // Temporarily corrupt database
      const originalGetColleges = databaseService.getAllColleges;
      databaseService.getAllColleges = jest.fn().mockImplementation(() => {
        throw new Error('Database corrupted');
      });

      const testProfile = createTestProfile();
      const result = await engine.generateRecommendations(testProfile);

      // Should still return recommendations
      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Restore original method
      databaseService.getAllColleges = originalGetColleges;
    });

    it('should handle incomplete profile data', async () => {
      const incompleteProfile: Partial<StudentProfile> = {
        id: 'incomplete-profile',
        timestamp: new Date(),
        personalInfo: {
          name: 'Test Student',
          grade: '12',
          board: 'CBSE',
          languagePreference: 'english'
        },
        academicData: {
          interests: ['Technology'],
          subjects: ['Physics'],
          performance: 'Good',
          favoriteSubjects: [],
          difficultSubjects: [],
          extracurricularActivities: []
        },
        socioeconomicData: {
          location: 'Delhi',
          familyBackground: 'Middle class',
          economicFactors: [],
          ruralUrban: 'urban',
          internetAccess: true,
          deviceAccess: ['Smartphone']
        },
        familyIncome: '5-8 Lakh'
      };

      const result = await engine.generateRecommendations(incompleteProfile as StudentProfile);

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions
function createTestProfile(id: string = 'test-profile'): StudentProfile {
  return {
    id,
    timestamp: new Date(),
    personalInfo: {
      name: 'Test Student',
      grade: '12',
      board: 'CBSE',
      languagePreference: 'english',
      age: 17,
      gender: 'male',
      category: 'General'
    },
    academicData: {
      interests: ['Technology', 'Science', 'Mathematics'],
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
      performance: 'Good',
      favoriteSubjects: ['Mathematics', 'Computer Science'],
      difficultSubjects: ['Chemistry'],
      extracurricularActivities: ['Coding Club', 'Science Fair']
    },
    socioeconomicData: {
      location: 'Delhi',
      familyBackground: 'Middle class family',
      economicFactors: ['Stable income', 'Education priority'],
      ruralUrban: 'urban',
      internetAccess: true,
      deviceAccess: ['Laptop', 'Smartphone'],
      householdSize: 4
    },
    familyIncome: '8-12 Lakh per annum',
    aspirations: {
      preferredCareers: ['Software Engineer'],
      preferredLocations: ['Delhi', 'Bangalore'],
      salaryExpectations: '10-15 LPA',
      workLifeBalance: 'medium'
    },
    constraints: {
      financialConstraints: false,
      locationConstraints: [],
      familyExpectations: ['Stable career']
    }
  };
}

function createTestDataFiles(dataPath: string) {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  // Create minimal test data files
  const testColleges = {
    colleges: [
      {
        id: 'test-college-1',
        name: 'Test Engineering College',
        location: 'Delhi',
        type: 'government',
        courses: ['BTech Computer Science', 'BTech Mechanical'],
        entranceExams: ['JEE Main'],
        fees: { annual: 100000, currency: 'INR' },
        rankings: { nirf: 50, category: 'Engineering' }
      }
    ]
  };

  const testCareers = {
    careers: [
      {
        id: 'test-career-1',
        title: 'Software Engineer',
        description: 'Develop software applications',
        nepCategory: 'Technology',
        requiredEducation: ['BTech Computer Science'],
        skills: ['Programming', 'Problem Solving'],
        averageSalary: { entry: 600000, mid: 1200000, senior: 2500000 },
        growthProjection: '25%',
        relatedExams: ['JEE Main']
      }
    ]
  };

  const testScholarships = {
    scholarships: [
      {
        id: 'test-scholarship-1',
        name: 'Test Merit Scholarship',
        provider: 'Test Government',
        type: 'merit',
        amount: 50000,
        eligibility: {
          categories: ['General', 'OBC'],
          incomeLimit: 800000,
          courses: ['BTech'],
          minimumMarks: 80
        }
      }
    ]
  };

  fs.writeFileSync(path.join(dataPath, 'colleges.json'), JSON.stringify(testColleges, null, 2));
  fs.writeFileSync(path.join(dataPath, 'careers.json'), JSON.stringify(testCareers, null, 2));
  fs.writeFileSync(path.join(dataPath, 'scholarships.json'), JSON.stringify(testScholarships, null, 2));
}