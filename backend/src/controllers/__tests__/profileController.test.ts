/**
 * Tests for ProfileController
 */

import request from 'supertest';
import express from 'express';
import { ProfileController } from '../profileController';
import { RecommendationEngine } from '../../services/recommendationEngine';
import { StudentProfile } from '../../types/studentProfile';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the recommendation engine
jest.mock('../../services/recommendationEngine');

describe('ProfileController', () => {
  let app: express.Application;
  let profileController: ProfileController;
  let mockRecommendationEngine: jest.Mocked<RecommendationEngine>;

  const validProfileData: Partial<StudentProfile> = {
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
      interests: ['Technology', 'Science'],
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      performance: 'Good',
      favoriteSubjects: ['Mathematics'],
      difficultSubjects: ['Chemistry'],
      extracurricularActivities: ['Coding Club']
    },
    socioeconomicData: {
      location: 'Delhi',
      familyBackground: 'Middle class family',
      economicFactors: ['Stable income'],
      ruralUrban: 'urban',
      internetAccess: true,
      deviceAccess: ['Laptop', 'Smartphone'],
      householdSize: 4
    },
    familyIncome: '5-10 Lakh per annum'
  };

  const mockRecommendationResult = {
    recommendations: [
      {
        id: 'rec-1',
        title: 'Software Engineer',
        description: 'Develop software applications',
        matchScore: 85,
        requirements: {
          education: ['BTech Computer Science'],
          skills: ['Programming'],
          entranceExams: ['JEE Main']
        },
        prospects: {
          averageSalary: { entry: 600000, mid: 1200000, senior: 2500000, currency: 'INR' },
          demandLevel: 'high'
        },
        visualData: {},
        pros: ['High salary'],
        cons: ['Long hours']
      }
    ],
    context: {
      studentProfile: {
        interests: ['Technology', 'Science'],
        strengths: ['Mathematics'],
        preferences: [],
        constraints: []
      },
      reasoningFactors: {
        interestMatch: 90,
        skillAlignment: 80,
        marketDemand: 85,
        financialViability: 75,
        educationalFit: 80
      }
    },
    metadata: {
      generatedAt: new Date(),
      profileId: 'test-profile-123',
      aiModel: 'mock',
      processingTime: 1000
    }
  };

  beforeEach(() => {
    // Setup mock recommendation engine
    mockRecommendationEngine = {
      generateRecommendations: jest.fn().mockResolvedValue(mockRecommendationResult),
      getStats: jest.fn().mockReturnValue({
        config: { useOpenAI: false },
        aiClientStats: { requestCount: 0 },
        databaseStats: { totalColleges: 100 }
      }),
      testEngine: jest.fn().mockResolvedValue(true)
    } as any;

    (RecommendationEngine as jest.Mock).mockImplementation(() => mockRecommendationEngine);

    // Setup Express app
    app = express();
    app.use(express.json());
    
    profileController = new ProfileController();
    
    // Setup routes
    app.post('/api/profile', profileController.processProfile);
    app.get('/api/profile/stats', profileController.getProfileStats);
    app.get('/api/profile/test', profileController.testEngine);
    app.get('/api/profile/health', profileController.healthCheck);
    
    // Error handling
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/profile', () => {
    it('should process valid profile and return recommendations', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.profileId).toBeDefined();
      expect(response.body.data.recommendations).toHaveLength(1);
      expect(response.body.data.context).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      expect(mockRecommendationEngine.generateRecommendations).toHaveBeenCalledTimes(1);
    });

    it('should handle missing required fields', async () => {
      const incompleteProfile = {
        personalInfo: {
          name: 'Test Student'
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(incompleteProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('PROFILE_VALIDATION_ERROR');
    });

    it('should handle invalid data types', async () => {
      const invalidProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          age: 'invalid-age' // Should be number
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle recommendation engine failures', async () => {
      mockRecommendationEngine.generateRecommendations.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const response = await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('PROFILE_PROCESSING_ERROR');
    });

    it('should sanitize input data', async () => {
      const profileWithMaliciousContent = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          name: 'Test Student   ' // Extra spaces should be trimmed
        },
        socioeconomicData: {
          ...validProfileData.socioeconomicData,
          familyBackground: '  Middle class family  ' // Should be trimmed
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(profileWithMaliciousContent)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify that the recommendation engine was called with sanitized data
      const calledProfile = mockRecommendationEngine.generateRecommendations.mock.calls[0]?.[0];
      expect(calledProfile?.personalInfo.name).toBe('Test Student');
      expect(calledProfile?.socioeconomicData.familyBackground).toBe('Middle class family');
    });

    it('should generate unique profile IDs', async () => {
      const response1 = await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(200);

      const response2 = await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(200);

      expect(response1.body.data.profileId).not.toBe(response2.body.data.profileId);
    });

    it('should handle large profile data', async () => {
      const largeProfile = {
        ...validProfileData,
        academicData: {
          ...validProfileData.academicData,
          interests: Array(20).fill('Interest'), // Too many interests
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(largeProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate family income format', async () => {
      const invalidIncomeProfile = {
        ...validProfileData,
        familyIncome: 'Invalid income format'
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidIncomeProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle different language preferences', async () => {
      const hindiProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          languagePreference: 'hindi' as const
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(hindiProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const calledProfile = mockRecommendationEngine.generateRecommendations.mock.calls[0]?.[0];
      expect(calledProfile?.personalInfo.languagePreference).toBe('hindi');
    });
  });

  describe('GET /api/profile/stats', () => {
    it('should return profile processing statistics', async () => {
      const response = await request(app)
        .get('/api/profile/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.engine).toBeDefined();
      expect(response.body.data.server).toBeDefined();
      expect(response.body.data.server.uptime).toBeDefined();
      expect(response.body.data.server.memoryUsage).toBeDefined();
    });

    it('should handle stats retrieval errors', async () => {
      mockRecommendationEngine.getStats.mockImplementation(() => {
        throw new Error('Stats unavailable');
      });

      const response = await request(app)
        .get('/api/profile/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STATS_ERROR');
    });
  });

  describe('GET /api/profile/test', () => {
    it('should test recommendation engine connectivity', async () => {
      const response = await request(app)
        .get('/api/profile/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.engineStatus).toBe('healthy');
      expect(mockRecommendationEngine.testEngine).toHaveBeenCalledTimes(1);
    });

    it('should handle engine test failures', async () => {
      mockRecommendationEngine.testEngine.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/profile/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.engineStatus).toBe('unhealthy');
    });

    it('should handle engine test errors', async () => {
      mockRecommendationEngine.testEngine.mockRejectedValue(new Error('Test failed'));

      const response = await request(app)
        .get('/api/profile/test')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENGINE_TEST_ERROR');
    });
  });

  describe('GET /api/profile/health', () => {
    it('should return healthy status when all services are working', async () => {
      const response = await request(app)
        .get('/api/profile/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.services.recommendationEngine).toBe('healthy');
      expect(response.body.services.database).toBe('healthy');
      expect(response.body.services.ai).toBe('healthy');
    });

    it('should return degraded status when AI service is down', async () => {
      mockRecommendationEngine.testEngine.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/profile/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.recommendationEngine).toBe('unhealthy');
      expect(response.body.services.ai).toBe('degraded');
    });

    it('should handle health check errors', async () => {
      mockRecommendationEngine.testEngine.mockRejectedValue(new Error('Health check failed'));

      const response = await request(app)
        .get('/api/profile/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('Profile Validation', () => {
    it('should validate personal information correctly', async () => {
      const invalidPersonalInfo = {
        ...validProfileData,
        personalInfo: {
          name: '', // Empty name
          grade: 'invalid-grade',
          board: 'invalid-board',
          languagePreference: 'invalid-language'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidPersonalInfo)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details.errors).toContain(
        expect.stringContaining('Name')
      );
    });

    it('should validate academic data correctly', async () => {
      const invalidAcademicData = {
        ...validProfileData,
        academicData: {
          interests: [], // Empty interests
          subjects: [], // Empty subjects
          performance: 'invalid-performance'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidAcademicData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate socioeconomic data correctly', async () => {
      const invalidSocioeconomicData = {
        ...validProfileData,
        socioeconomicData: {
          location: '', // Empty location
          familyBackground: '', // Empty background
          economicFactors: [], // Empty factors
          ruralUrban: 'invalid-classification',
          internetAccess: 'not-boolean',
          deviceAccess: []
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidSocioeconomicData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    it('should reject profiles with potentially malicious content', async () => {
      const maliciousProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          name: '<script>alert("xss")</script>'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(maliciousProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONTENT');
    });

    it('should handle extremely long content', async () => {
      const longContentProfile = {
        ...validProfileData,
        socioeconomicData: {
          ...validProfileData.socioeconomicData,
          familyBackground: 'A'.repeat(1000) // Very long content
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(longContentProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTENT_TOO_LONG');
    });
  });

  describe('Analytics Logging', () => {
    it('should log analytics data for successful profile processing', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analytics data logged:'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should not break processing if analytics logging fails', async () => {
      // Mock console.log to throw an error
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Logging failed');
      });

      const response = await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(200);

      expect(response.body.success).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});