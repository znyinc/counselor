/**
 * Tests for OpenAI Client Service
 */

import { OpenAIClient, OpenAIConfig } from '../openAIClient';
import { MockOpenAIClient } from '../mockOpenAIClient';
import { StudentProfile } from '../../types/studentProfile';

// Mock OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('OpenAIClient', () => {
  let mockConfig: OpenAIConfig;
  let mockProfile: StudentProfile;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      timeout: 30000,
    };

    mockProfile = {
      id: 'test-profile',
      timestamp: new Date(),
      personalInfo: {
        name: 'Test Student',
        grade: '12',
        board: 'CBSE',
        languagePreference: 'english',
        age: 17,
        gender: 'male',
        category: 'General',
        physicallyDisabled: false,
      },
      academicData: {
        interests: ['Science', 'Technology', 'Mathematics'],
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        performance: 'good',
        favoriteSubjects: ['Physics', 'Mathematics'],
        difficultSubjects: ['Chemistry'],
        extracurricularActivities: ['Robotics', 'Debate'],
        achievements: ['Science Fair Winner'],
      },
      socioeconomicData: {
        location: 'Delhi',
        familyBackground: 'Middle class family with engineering background',
        economicFactors: ['Dual Income Family'],
        ruralUrban: 'urban',
        internetAccess: true,
        deviceAccess: ['Smartphone', 'Laptop'],
        householdSize: 4,
        parentOccupation: {
          father: 'Engineer',
          mother: 'Teacher',
        },
        transportMode: 'Private Vehicle',
      },
      familyIncome: '10-20 Lakhs',
      aspirations: {
        preferredCareers: ['Engineering', 'Technology'],
        preferredLocations: ['Delhi', 'Bangalore'],
        salaryExpectations: 'high',
        workLifeBalance: 'medium',
      },
      constraints: {
        financialConstraints: false,
        locationConstraints: [],
        familyExpectations: ['Engineering career'],
        timeConstraints: '',
      },
    };
  });

  describe('Constructor', () => {
    test('should initialize with config', () => {
      const client = new OpenAIClient(mockConfig);
      expect(client).toBeInstanceOf(OpenAIClient);
    });
  });

  describe('buildPrompt', () => {
    test('should build comprehensive prompt from student profile', () => {
      const client = new OpenAIClient(mockConfig);
      const prompt = (client as any).buildPrompt(mockProfile);

      expect(prompt).toContain('Test Student');
      expect(prompt).toContain('Grade: 12');
      expect(prompt).toContain('CBSE');
      expect(prompt).toContain('Science, Technology, Mathematics');
      expect(prompt).toContain('Delhi');
      expect(prompt).toContain('10-20 Lakhs');
      expect(prompt).toContain('NEP 2020');
      expect(prompt).toContain('exactly 3 career recommendations');
    });

    test('should handle optional fields gracefully', () => {
      const incompleteProfile = {
        ...mockProfile,
        personalInfo: {
          ...mockProfile.personalInfo,
          age: undefined,
          gender: undefined,
        },
        academicData: {
          ...mockProfile.academicData,
          favoriteSubjects: undefined,
          achievements: undefined,
        },
      };

      const client = new OpenAIClient(mockConfig);
      const prompt = (client as any).buildPrompt(incompleteProfile);

      expect(prompt).toContain('Age: Not specified');
      expect(prompt).toContain('Gender: Not specified');
      expect(prompt).toContain('Favorite Subjects: None specified');
      expect(prompt).toContain('Achievements: None specified');
    });
  });

  describe('parseResponse', () => {
    test('should parse valid OpenAI response', () => {
      const mockResponse = JSON.stringify({
        recommendations: [
          {
            id: 'software-engineer',
            title: 'Software Engineer',
            description: 'Test description',
            nepAlignment: 'Test alignment',
            matchScore: 85,
            requirements: {
              education: ['BTech'],
              skills: ['Programming'],
              entranceExams: ['JEE'],
            },
            prospects: {
              averageSalary: {
                entry: 600000,
                mid: 1200000,
                senior: 2500000,
                currency: 'INR',
              },
              growthRate: '25%',
              jobMarket: 'High demand',
              demandLevel: 'high',
              futureOutlook: 'Excellent',
              workLifeBalance: 'good',
            },
            pros: ['High salary'],
            cons: ['Long hours'],
          },
          {
            id: 'data-scientist',
            title: 'Data Scientist',
            description: 'Test description 2',
            nepAlignment: 'Test alignment 2',
            matchScore: 80,
            requirements: {
              education: ['BTech'],
              skills: ['Python'],
              entranceExams: ['JEE'],
            },
            prospects: {
              averageSalary: {
                entry: 800000,
                mid: 1600000,
                senior: 3500000,
                currency: 'INR',
              },
              growthRate: '35%',
              jobMarket: 'Growing',
              demandLevel: 'high',
              futureOutlook: 'Excellent',
              workLifeBalance: 'good',
            },
            pros: ['High demand'],
            cons: ['Complex work'],
          },
          {
            id: 'teacher',
            title: 'Teacher',
            description: 'Test description 3',
            nepAlignment: 'Test alignment 3',
            matchScore: 75,
            requirements: {
              education: ['BEd'],
              skills: ['Teaching'],
              entranceExams: ['CTET'],
            },
            prospects: {
              averageSalary: {
                entry: 300000,
                mid: 600000,
                senior: 1200000,
                currency: 'INR',
              },
              growthRate: '12%',
              jobMarket: 'Stable',
              demandLevel: 'medium',
              futureOutlook: 'Good',
              workLifeBalance: 'excellent',
            },
            pros: ['Social impact'],
            cons: ['Lower salary'],
          },
        ],
        reasoning: 'Test reasoning',
        confidence: 85,
      });

      const client = new OpenAIClient(mockConfig);
      const result = (client as any).parseResponse(mockResponse, mockProfile);

      expect(result.recommendations).toHaveLength(3);
      expect(result.recommendations[0].title).toBe('Software Engineer');
      expect(result.recommendations[0].matchScore).toBe(85);
      expect(result.reasoning).toBe('Test reasoning');
      expect(result.confidence).toBe(85);
    });

    test('should throw error for invalid JSON', () => {
      const client = new OpenAIClient(mockConfig);
      
      expect(() => {
        (client as any).parseResponse('invalid json', mockProfile);
      }).toThrow('Failed to parse AI response');
    });

    test('should throw error for missing recommendations', () => {
      const invalidResponse = JSON.stringify({
        reasoning: 'Test reasoning',
        confidence: 85,
      });

      const client = new OpenAIClient(mockConfig);
      
      expect(() => {
        (client as any).parseResponse(invalidResponse, mockProfile);
      }).toThrow('Invalid response format: missing recommendations array');
    });

    test('should throw error for wrong number of recommendations', () => {
      const invalidResponse = JSON.stringify({
        recommendations: [
          { id: 'test', title: 'Test', matchScore: 80 },
        ],
        reasoning: 'Test reasoning',
        confidence: 85,
      });

      const client = new OpenAIClient(mockConfig);
      
      expect(() => {
        (client as any).parseResponse(invalidResponse, mockProfile);
      }).toThrow('Expected 3 recommendations, got 1');
    });
  });

  describe('validateRecommendation', () => {
    test('should validate correct recommendation', () => {
      const validRecommendation = {
        id: 'test-id',
        title: 'Test Career',
        description: 'Test description',
        matchScore: 85,
        requirements: {
          education: ['BTech'],
          skills: ['Programming'],
          entranceExams: ['JEE'],
        },
        prospects: {
          averageSalary: {
            entry: 600000,
            mid: 1200000,
            senior: 2500000,
          },
        },
      };

      const client = new OpenAIClient(mockConfig);
      
      expect(() => {
        (client as any).validateRecommendation(validRecommendation, 0);
      }).not.toThrow();
    });

    test('should throw error for missing required fields', () => {
      const invalidRecommendation = {
        id: 'test-id',
        title: 'Test Career',
        // missing description, matchScore, requirements, prospects
      };

      const client = new OpenAIClient(mockConfig);
      
      expect(() => {
        (client as any).validateRecommendation(invalidRecommendation, 0);
      }).toThrow('Recommendation 1 missing required field');
    });

    test('should throw error for invalid match score', () => {
      const invalidRecommendation = {
        id: 'test-id',
        title: 'Test Career',
        description: 'Test description',
        matchScore: 150, // Invalid score > 100
        requirements: {},
        prospects: {
          averageSalary: { entry: 600000 },
        },
      };

      const client = new OpenAIClient(mockConfig);
      
      expect(() => {
        (client as any).validateRecommendation(invalidRecommendation, 0);
      }).toThrow('Recommendation 1 has invalid match score: 150');
    });
  });

  describe('handleOpenAIError', () => {
    test('should handle quota exceeded error', () => {
      const client = new OpenAIClient(mockConfig);
      const error = { code: 'insufficient_quota' };
      
      const result = (client as any).handleOpenAIError(error);
      
      expect(result.code).toBe('AI_QUOTA_EXCEEDED');
      expect(result.statusCode).toBe(503);
    });

    test('should handle rate limit error', () => {
      const client = new OpenAIClient(mockConfig);
      const error = { code: 'rate_limit_exceeded' };
      
      const result = (client as any).handleOpenAIError(error);
      
      expect(result.code).toBe('AI_RATE_LIMIT_EXCEEDED');
      expect(result.statusCode).toBe(429);
    });

    test('should handle invalid API key error', () => {
      const client = new OpenAIClient(mockConfig);
      const error = { code: 'invalid_api_key' };
      
      const result = (client as any).handleOpenAIError(error);
      
      expect(result.code).toBe('AI_CONFIG_ERROR');
      expect(result.statusCode).toBe(500);
    });

    test('should handle timeout error', () => {
      const client = new OpenAIClient(mockConfig);
      const error = { message: 'Request timeout' };
      
      const result = (client as any).handleOpenAIError(error);
      
      expect(result.code).toBe('AI_TIMEOUT');
      expect(result.statusCode).toBe(504);
    });

    test('should handle generic error', () => {
      const client = new OpenAIClient(mockConfig);
      const error = { message: 'Unknown error' };
      
      const result = (client as any).handleOpenAIError(error);
      
      expect(result.code).toBe('AI_SERVICE_UNAVAILABLE');
      expect(result.statusCode).toBe(503);
    });
  });

  describe('getStats', () => {
    test('should return client statistics', () => {
      const client = new OpenAIClient(mockConfig);
      const stats = client.getStats();
      
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('lastRequestTime');
      expect(typeof stats.requestCount).toBe('number');
      expect(typeof stats.lastRequestTime).toBe('number');
    });
  });
});

describe('MockOpenAIClient', () => {
  let mockClient: MockOpenAIClient;
  let mockProfile: StudentProfile;

  beforeEach(() => {
    mockClient = new MockOpenAIClient();
    mockProfile = {
      id: 'test-profile',
      timestamp: new Date(),
      personalInfo: {
        name: 'Test Student',
        grade: '12',
        board: 'CBSE',
        languagePreference: 'english',
      },
      academicData: {
        interests: ['Science', 'Technology'],
        subjects: ['Physics', 'Mathematics'],
        performance: 'good',
        favoriteSubjects: [],
        difficultSubjects: [],
        extracurricularActivities: [],
        achievements: [],
      },
      socioeconomicData: {
        location: 'Delhi',
        familyBackground: 'Middle class',
        economicFactors: ['Dual Income'],
        ruralUrban: 'urban',
        internetAccess: true,
        deviceAccess: ['Smartphone'],
      },
      familyIncome: '5-10 Lakhs',
    } as StudentProfile;
  });

  describe('generateCareerRecommendations', () => {
    test('should generate mock recommendations successfully', async () => {
      mockClient.setMockDelay(0); // No delay for testing
      
      const result = await mockClient.generateCareerRecommendations(mockProfile);
      
      expect(result.recommendations).toHaveLength(3);
      expect(result.recommendations[0]).toHaveProperty('id');
      expect(result.recommendations[0]).toHaveProperty('title');
      expect(result.recommendations[0]).toHaveProperty('matchScore');
      expect(result.reasoning).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should select appropriate recommendations based on interests', async () => {
      mockClient.setMockDelay(0);
      
      const techProfile = {
        ...mockProfile,
        academicData: {
          ...mockProfile.academicData,
          interests: ['Technology', 'Engineering', 'Mathematics'],
        },
      };
      
      const result = await mockClient.generateCareerRecommendations(techProfile);
      
      const titles = result.recommendations.map(rec => rec.title);
      expect(titles).toContain('Software Engineer');
      expect(titles).toContain('Data Scientist');
    });

    test('should handle financial constraints', async () => {
      mockClient.setMockDelay(0);
      
      const constrainedProfile = {
        ...mockProfile,
        familyIncome: 'Below 1 Lakh',
      };
      
      const result = await mockClient.generateCareerRecommendations(constrainedProfile);
      
      // Should include government officer for financial stability
      const titles = result.recommendations.map(rec => rec.title);
      expect(titles.some(title => title.includes('Government') || title.includes('Teacher'))).toBe(true);
    });

    test('should throw error when configured to fail', async () => {
      mockClient.setShouldFail(true);
      mockClient.setMockDelay(0);
      
      await expect(mockClient.generateCareerRecommendations(mockProfile))
        .rejects.toThrow('Mock OpenAI API failure');
    });
  });

  describe('testConnection', () => {
    test('should always return true for mock client', async () => {
      const result = await mockClient.testConnection();
      expect(result).toBe(true);
    });
  });

  describe('getStats', () => {
    test('should return mock statistics', () => {
      const stats = mockClient.getStats();
      
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('lastRequestTime');
      expect(typeof stats.requestCount).toBe('number');
      expect(typeof stats.lastRequestTime).toBe('number');
    });

    test('should increment request count', async () => {
      mockClient.setMockDelay(0);
      
      const initialStats = mockClient.getStats();
      await mockClient.generateCareerRecommendations(mockProfile);
      const finalStats = mockClient.getStats();
      
      expect(finalStats.requestCount).toBe(initialStats.requestCount + 1);
    });
  });
});