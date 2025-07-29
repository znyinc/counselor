/**
 * Tests for RecommendationEngine
 */

import { RecommendationEngine, RecommendationEngineConfig } from '../recommendationEngine';
import { StudentProfile } from '../../types/studentProfile';
import { DatabaseService } from '../databaseService';
import { MockOpenAIClient } from '../mockOpenAIClient';

// Mock the database service
jest.mock('../databaseService');
jest.mock('../openAIClient');

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let testProfile: StudentProfile;

  const testConfig: RecommendationEngineConfig = {
    useOpenAI: false, // Use mock for testing
    maxRecommendations: 3,
    minMatchScore: 60,
    enableDatabaseEnrichment: true
  };

  beforeEach(() => {
    // Setup mock database service
    mockDatabaseService = {
      getInstance: jest.fn().mockReturnThis(),
      getAllColleges: jest.fn().mockReturnValue([
        {
          id: 'iit-delhi',
          name: 'IIT Delhi',
          location: 'Delhi',
          type: 'government',
          courses: ['BTech Computer Science', 'BTech Electrical'],
          entranceExams: ['JEE Advanced'],
          fees: { annual: 200000, currency: 'INR' },
          rankings: { nirf: 2, category: 'Engineering' }
        },
        {
          id: 'bits-pilani',
          name: 'BITS Pilani',
          location: 'Pilani',
          type: 'private',
          courses: ['BTech Computer Science', 'BTech Mechanical'],
          entranceExams: ['BITSAT'],
          fees: { annual: 400000, currency: 'INR' },
          rankings: { nirf: 25, category: 'Engineering' }
        }
      ]),
      getAllCareers: jest.fn().mockReturnValue([
        {
          id: 'software-engineer',
          title: 'Software Engineer',
          description: 'Develop software applications',
          nepCategory: 'Technology',
          requiredEducation: ['BTech Computer Science'],
          skills: ['Programming', 'Problem Solving'],
          averageSalary: { entry: 600000, mid: 1200000, senior: 2500000 },
          growthProjection: '25%',
          relatedExams: ['JEE Main', 'JEE Advanced']
        }
      ]),
      getAllScholarships: jest.fn().mockReturnValue([
        {
          id: 'merit-scholarship',
          name: 'Merit Based Scholarship',
          provider: 'Government of India',
          type: 'merit',
          amount: 50000,
          eligibility: {
            categories: ['General', 'OBC'],
            incomeLimit: 800000,
            courses: ['BTech'],
            minimumMarks: 85
          }
        }
      ]),
      getApplicableScholarships: jest.fn().mockReturnValue([
        {
          id: 'merit-scholarship',
          name: 'Merit Based Scholarship',
          provider: 'Government of India',
          type: 'merit',
          amount: 50000,
          eligibility: {
            categories: ['General', 'OBC'],
            incomeLimit: 800000,
            courses: ['BTech'],
            minimumMarks: 85
          }
        }
      ]),
      getStatistics: jest.fn().mockReturnValue({
        totalColleges: 2,
        totalCareers: 1,
        totalScholarships: 1,
        collegesByType: { government: 1, private: 1 },
        careersByCategory: { Technology: 1 },
        scholarshipsByType: { merit: 1 }
      })
    } as any;

    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);

    // Create test profile
    testProfile = {
      id: 'test-profile-123',
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
        interests: ['Technology', 'Programming', 'Mathematics'],
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
        performance: 'Excellent',
        favoriteSubjects: ['Mathematics', 'Computer Science'],
        difficultSubjects: ['Chemistry'],
        extracurricularActivities: ['Coding Club', 'Robotics']
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
      familyIncome: '5-10 Lakh per annum',
      aspirations: {
        preferredCareers: ['Software Engineer', 'Data Scientist'],
        preferredLocations: ['Delhi', 'Bangalore'],
        salaryExpectations: '8-12 LPA',
        workLifeBalance: 'medium'
      },
      constraints: {
        financialConstraints: false,
        locationConstraints: [],
        familyExpectations: ['Stable career', 'Good salary']
      }
    };

    engine = new RecommendationEngine(testConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with mock client when useOpenAI is false', () => {
      const config = { ...testConfig, useOpenAI: false };
      const testEngine = new RecommendationEngine(config);
      expect(testEngine).toBeDefined();
    });

    it('should initialize with OpenAI client when useOpenAI is true and config provided', () => {
      const config = {
        ...testConfig,
        useOpenAI: true,
        openAIConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
          maxTokens: 2000,
          temperature: 0.7,
          timeout: 30000
        }
      };
      const testEngine = new RecommendationEngine(config);
      expect(testEngine).toBeDefined();
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations successfully', async () => {
      const result = await engine.generateRecommendations(testProfile);

      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
      expect(result.context).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.profileId).toBe(testProfile.id);
      expect(result.metadata.aiModel).toBe('mock');
    });

    it('should enrich recommendations with database information', async () => {
      const result = await engine.generateRecommendations(testProfile);

      const recommendation = result.recommendations[0];
      expect(recommendation.recommendedColleges).toBeDefined();
      expect(recommendation.scholarships).toBeDefined();
      expect(recommendation.recommendedColleges.length).toBeGreaterThan(0);
    });

    it('should filter recommendations by minimum match score', async () => {
      const highScoreConfig = { ...testConfig, minMatchScore: 90 };
      const highScoreEngine = new RecommendationEngine(highScoreConfig);

      const result = await highScoreEngine.generateRecommendations(testProfile);

      result.recommendations.forEach(rec => {
        expect(rec.matchScore).toBeGreaterThanOrEqual(90);
      });
    });

    it('should limit recommendations to maximum count', async () => {
      const limitedConfig = { ...testConfig, maxRecommendations: 2 };
      const limitedEngine = new RecommendationEngine(limitedConfig);

      const result = await limitedEngine.generateRecommendations(testProfile);

      expect(result.recommendations.length).toBeLessThanOrEqual(2);
    });

    it('should handle AI service failures gracefully', async () => {
      // Mock AI client to fail
      const failingEngine = new RecommendationEngine(testConfig);
      const mockClient = new MockOpenAIClient(true); // Set to fail
      (failingEngine as any).aiClient = mockClient;

      const result = await failingEngine.generateRecommendations(testProfile);

      expect(result).toBeDefined();
      expect(result.metadata.aiModel).toBe('fallback-mock');
    });
  });

  describe('Prompt Template Selection', () => {
    it('should select financial constraints prompt for low income students', async () => {
      const lowIncomeProfile = {
        ...testProfile,
        familyIncome: 'Below 1 Lakh per annum',
        constraints: { ...testProfile.constraints, financialConstraints: true }
      };

      const result = await engine.generateRecommendations(lowIncomeProfile);
      expect(result).toBeDefined();
    });

    it('should select rural student prompt for rural students', async () => {
      const ruralProfile = {
        ...testProfile,
        socioeconomicData: {
          ...testProfile.socioeconomicData,
          ruralUrban: 'rural' as const
        }
      };

      const result = await engine.generateRecommendations(ruralProfile);
      expect(result).toBeDefined();
    });

    it('should select inclusive prompt for students with disabilities', async () => {
      const disabledProfile = {
        ...testProfile,
        personalInfo: {
          ...testProfile.personalInfo,
          physicallyDisabled: true
        }
      };

      const result = await engine.generateRecommendations(disabledProfile);
      expect(result).toBeDefined();
    });

    it('should select tech-focused prompt for technology interests', async () => {
      const techProfile = {
        ...testProfile,
        academicData: {
          ...testProfile.academicData,
          interests: ['Programming', 'Artificial Intelligence', 'Computer Science']
        }
      };

      const result = await engine.generateRecommendations(techProfile);
      expect(result).toBeDefined();
    });

    it('should select creative prompt for arts interests', async () => {
      const creativeProfile = {
        ...testProfile,
        academicData: {
          ...testProfile.academicData,
          interests: ['Arts', 'Design', 'Music', 'Literature']
        }
      };

      const result = await engine.generateRecommendations(creativeProfile);
      expect(result).toBeDefined();
    });
  });

  describe('Database Enrichment', () => {
    it('should find relevant colleges based on education requirements', async () => {
      const result = await engine.generateRecommendations(testProfile);
      const recommendation = result.recommendations[0];

      expect(recommendation.recommendedColleges).toBeDefined();
      expect(recommendation.recommendedColleges.length).toBeGreaterThan(0);
      
      // Should include IIT Delhi for computer science
      const hasRelevantCollege = recommendation.recommendedColleges.some(
        college => college.courses.some(course => 
          course.toLowerCase().includes('computer')
        )
      );
      expect(hasRelevantCollege).toBe(true);
    });

    it('should find applicable scholarships based on profile', async () => {
      const result = await engine.generateRecommendations(testProfile);
      const recommendation = result.recommendations[0];

      expect(recommendation.scholarships).toBeDefined();
      expect(mockDatabaseService.getApplicableScholarships).toHaveBeenCalledWith({
        category: 'General',
        familyIncome: expect.any(Number),
        course: expect.any(String),
        gender: 'male',
        class: '12'
      });
    });

    it('should enhance recommendations with database career data', async () => {
      const result = await engine.generateRecommendations(testProfile);
      const recommendation = result.recommendations[0];

      // Should have enhanced salary data from database
      expect(recommendation.prospects.averageSalary).toBeDefined();
      expect(recommendation.requirements.education).toBeDefined();
      expect(recommendation.requirements.skills).toBeDefined();
    });

    it('should work without database enrichment when disabled', async () => {
      const noEnrichmentConfig = { ...testConfig, enableDatabaseEnrichment: false };
      const noEnrichmentEngine = new RecommendationEngine(noEnrichmentConfig);

      const result = await noEnrichmentEngine.generateRecommendations(testProfile);

      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
    });
  });

  describe('Recommendation Context Generation', () => {
    it('should generate comprehensive context', async () => {
      const result = await engine.generateRecommendations(testProfile);

      expect(result.context).toBeDefined();
      expect(result.context.studentProfile).toBeDefined();
      expect(result.context.reasoningFactors).toBeDefined();

      const { studentProfile, reasoningFactors } = result.context;
      
      expect(studentProfile.interests).toEqual(testProfile.academicData.interests);
      expect(studentProfile.strengths).toContain('Mathematics');
      expect(studentProfile.preferences).toContain('Software Engineer');
      
      expect(reasoningFactors.interestMatch).toBeGreaterThan(0);
      expect(reasoningFactors.skillAlignment).toBeGreaterThan(0);
      expect(reasoningFactors.marketDemand).toBeGreaterThan(0);
      expect(reasoningFactors.financialViability).toBeGreaterThan(0);
      expect(reasoningFactors.educationalFit).toBeGreaterThan(0);
    });
  });

  describe('Validation and Filtering', () => {
    it('should validate recommendation structure', async () => {
      const result = await engine.generateRecommendations(testProfile);

      result.recommendations.forEach(rec => {
        expect(rec.id).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.matchScore).toBeGreaterThanOrEqual(0);
        expect(rec.matchScore).toBeLessThanOrEqual(100);
        expect(rec.requirements).toBeDefined();
        expect(rec.prospects).toBeDefined();
        expect(rec.visualData).toBeDefined();
      });
    });

    it('should sort recommendations by match score', async () => {
      const result = await engine.generateRecommendations(testProfile);

      for (let i = 1; i < result.recommendations.length; i++) {
        expect(result.recommendations[i-1].matchScore)
          .toBeGreaterThanOrEqual(result.recommendations[i].matchScore);
      }
    });
  });

  describe('Helper Methods', () => {
    it('should parse family income correctly', () => {
      const engine = new RecommendationEngine(testConfig);
      
      // Access private method for testing
      const parseFamilyIncome = (engine as any).parseFamilyIncome.bind(engine);
      
      expect(parseFamilyIncome('5-10 Lakh per annum')).toBe(500000);
      expect(parseFamilyIncome('2 Crore per annum')).toBe(20000000);
      expect(parseFamilyIncome('Below 1 Lakh')).toBe(100000);
    });

    it('should merge unique arrays correctly', () => {
      const engine = new RecommendationEngine(testConfig);
      
      // Access private method for testing
      const mergeUniqueArrays = (engine as any).mergeUniqueArrays.bind(engine);
      
      const result = mergeUniqueArrays(['A', 'B'], ['B', 'C']);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should identify education matches correctly', () => {
      const engine = new RecommendationEngine(testConfig);
      
      // Access private method for testing
      const isEducationMatch = (engine as any).isEducationMatch.bind(engine);
      
      expect(isEducationMatch('BTech Computer Science', 'Computer Science')).toBe(true);
      expect(isEducationMatch('Engineering', 'BTech Mechanical')).toBe(true);
      expect(isEducationMatch('Medicine', 'Computer Science')).toBe(false);
    });
  });

  describe('Statistics and Testing', () => {
    it('should return engine statistics', () => {
      const stats = engine.getStats();

      expect(stats).toBeDefined();
      expect(stats.config).toBeDefined();
      expect(stats.aiClientStats).toBeDefined();
      expect(stats.databaseStats).toBeDefined();
    });

    it('should test engine connectivity', async () => {
      const testResult = await engine.testEngine();
      expect(testResult).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database service errors gracefully', async () => {
      mockDatabaseService.getAllColleges.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await engine.generateRecommendations(testProfile);
      
      // Should still return recommendations even if database enrichment fails
      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
    });

    it('should handle invalid recommendation data', async () => {
      // Mock AI client to return invalid data
      const mockClient = new MockOpenAIClient();
      (engine as any).aiClient = mockClient;
      
      // Override generateCareerRecommendations to return invalid data
      jest.spyOn(mockClient, 'generateCareerRecommendations').mockResolvedValue({
        recommendations: [
          { id: '', title: '', description: '', matchScore: -1 } // Invalid data
        ],
        reasoning: 'Test reasoning',
        confidence: 80
      } as any);

      const result = await engine.generateRecommendations(testProfile);
      
      // Should filter out invalid recommendations
      expect(result.recommendations.length).toBe(0);
    });
  });

  describe('Different Profile Types', () => {
    it('should handle high-achieving student profiles', async () => {
      const highAchieverProfile = {
        ...testProfile,
        academicData: {
          ...testProfile.academicData,
          performance: 'Outstanding',
          achievements: ['National Olympiad Winner', 'Science Fair Champion']
        }
      };

      const result = await engine.generateRecommendations(highAchieverProfile);
      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
    });

    it('should handle financially constrained student profiles', async () => {
      const constrainedProfile = {
        ...testProfile,
        familyIncome: 'Below 2 Lakh per annum',
        constraints: {
          ...testProfile.constraints,
          financialConstraints: true
        }
      };

      const result = await engine.generateRecommendations(constrainedProfile);
      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
    });

    it('should handle profiles with diverse interests', async () => {
      const diverseProfile = {
        ...testProfile,
        academicData: {
          ...testProfile.academicData,
          interests: ['Technology', 'Arts', 'Sports', 'Social Work', 'Business']
        }
      };

      const result = await engine.generateRecommendations(diverseProfile);
      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
    });
  });
});