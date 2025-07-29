/**
 * Analytics Service Tests
 * Tests for analytics data collection, aggregation, and privacy compliance
 */

import { AnalyticsService, AnalyticsEntry, AnalyticsFilter } from '../analyticsService';
import { StudentProfile } from '../../types/studentProfile';
import { CareerRecommendation } from '../../types/careerRecommendation';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockStudentProfile: StudentProfile;
  let mockRecommendations: CareerRecommendation[];

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService();

    // Mock student profile
    mockStudentProfile = {
      id: 'test-profile-123',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      personalInfo: {
        name: 'Test Student',
        grade: '12',
        board: 'CBSE',
        languagePreference: 'english' as const,
        category: 'General',
        gender: 'Female'
      },
      familyIncome: '5-10 lakhs',
      academicData: {
        interests: ['Science', 'Technology'],
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        performance: 'Good',
        favoriteSubjects: ['Physics'],
        difficultSubjects: ['Chemistry'],
        extracurricularActivities: ['Debate', 'Science Club']
      },
      socioeconomicData: {
        location: 'Mumbai, Maharashtra',
        ruralUrban: 'urban' as const,
        familyBackground: 'Service',
        economicFactors: ['Middle class', 'Urban'],
        internetAccess: true,
        deviceAccess: ['Smartphone', 'Laptop']
      }
    };

    // Mock career recommendations
    mockRecommendations = [
      {
        id: 'career-1',
        title: 'Software Engineer',
        description: 'Develop software applications',
        matchScore: 85,
        nepAlignment: 'High',
        requirements: {
          education: ['B.Tech Computer Science'],
          skills: ['Programming', 'Problem Solving'],
          entranceExams: ['JEE Main']
        },
        prospects: {
          averageSalary: {
            entry: 600000,
            mid: 1200000,
            senior: 2500000
          },
          growthRate: 'High',
          jobMarket: 'Excellent',
          demandLevel: 'High'
        },
        recommendedColleges: [],
        scholarships: [],
        visualData: {
          salaryTrends: { labels: [], datasets: [] },
          educationPath: { steps: [] },
          requirements: { categories: [] }
        },
        metadata: {
          aiModel: 'gpt-4',
          confidence: 0.85,
          processingTime: 1500,
          generatedAt: '2024-01-15T10:01:30Z'
        }
      }
    ];

    // Mock fs operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({
      size: 1024,
      mtime: new Date('2024-01-15T10:00:00Z')
    } as any);
  });

  describe('collectAnalytics', () => {
    it('should collect and store anonymized analytics data', async () => {
      const processingMetadata = {
        aiModel: 'gpt-4',
        processingTime: 1500,
        generatedAt: '2024-01-15T10:01:30Z'
      };

      await analyticsService.collectAnalytics(
        mockStudentProfile,
        mockRecommendations,
        processingMetadata
      );

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('analytics'),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalled();

      const writeCall = mockFs.writeFile.mock.calls[0];
      const analyticsData = JSON.parse(writeCall[1] as string);
      
      expect(analyticsData).toHaveLength(1);
      expect(analyticsData[0]).toMatchObject({
        id: expect.stringMatching(/^analytics_/),
        timestamp: expect.any(String),
        anonymizedData: {
          profileHash: expect.any(String),
          demographics: {
            grade: '12',
            board: 'CBSE',
            location: 'Maharashtra', // Should be anonymized to state level
            ruralUrban: 'urban',
            languagePreference: 'english',
            category: 'General',
            gender: 'Female'
          },
          socioeconomic: {
            incomeRange: '5-10 lakhs',
            familyBackground: 'service', // Should be categorized
            economicFactors: ['Middle class', 'Urban'],
            internetAccess: true,
            deviceAccess: ['Smartphone', 'Laptop']
          },
          academic: {
            interests: ['Science', 'Technology'],
            subjects: ['Physics', 'Chemistry', 'Mathematics'],
            performance: 'Good',
            favoriteSubjects: ['Physics'],
            difficultSubjects: ['Chemistry'],
            extracurricularActivities: ['Debate', 'Science Club']
          },
          recommendations: {
            totalCount: 1,
            averageMatchScore: 85,
            topCareerTitles: ['Software Engineer'],
            demandLevels: ['High'],
            averageSalaryRanges: [600000]
          },
          processing: {
            aiModel: 'gpt-4',
            processingTime: 1500,
            generatedAt: '2024-01-15T10:01:30Z'
          }
        }
      });
    });

    it('should handle errors gracefully without throwing', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));

      const processingMetadata = {
        aiModel: 'gpt-4',
        processingTime: 1500,
        generatedAt: '2024-01-15T10:01:30Z'
      };

      // Should not throw error
      await expect(analyticsService.collectAnalytics(
        mockStudentProfile,
        mockRecommendations,
        processingMetadata
      )).resolves.toBeUndefined();
    });

    it('should anonymize location to state level', async () => {
      const processingMetadata = {
        aiModel: 'gpt-4',
        processingTime: 1500,
        generatedAt: '2024-01-15T10:01:30Z'
      };

      await analyticsService.collectAnalytics(
        mockStudentProfile,
        mockRecommendations,
        processingMetadata
      );

      const writeCall = mockFs.writeFile.mock.calls[0];
      const analyticsData = JSON.parse(writeCall[1] as string);
      
      expect(analyticsData[0].anonymizedData.demographics.location).toBe('Maharashtra');
    });

    it('should categorize family background', async () => {
      const processingMetadata = {
        aiModel: 'gpt-4',
        processingTime: 1500,
        generatedAt: '2024-01-15T10:01:30Z'
      };

      await analyticsService.collectAnalytics(
        mockStudentProfile,
        mockRecommendations,
        processingMetadata
      );

      const writeCall = mockFs.writeFile.mock.calls[0];
      const analyticsData = JSON.parse(writeCall[1] as string);
      
      expect(analyticsData[0].anonymizedData.socioeconomic.familyBackground).toBe('service');
    });
  });

  describe('getAggregatedData', () => {
    beforeEach(() => {
      // Mock analytics files
      mockFs.readdir.mockResolvedValue(['analytics_2024-01-15.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        {
          id: 'analytics_1',
          timestamp: '2024-01-15T10:00:00Z',
          anonymizedData: {
            profileHash: 'hash1',
            demographics: {
              grade: '12',
              board: 'CBSE',
              location: 'Maharashtra',
              ruralUrban: 'urban',
              languagePreference: 'english',
              category: 'General',
              gender: 'Female'
            },
            socioeconomic: {
              incomeRange: '5-10 lakhs',
              familyBackground: 'service',
              economicFactors: ['Middle class'],
              internetAccess: true,
              deviceAccess: ['Smartphone']
            },
            academic: {
              interests: ['Science'],
              subjects: ['Physics'],
              performance: 'Good',
              favoriteSubjects: ['Physics'],
              difficultSubjects: ['Chemistry'],
              extracurricularActivities: ['Debate']
            },
            recommendations: {
              totalCount: 3,
              averageMatchScore: 85,
              topCareerTitles: ['Software Engineer'],
              demandLevels: ['High'],
              averageSalaryRanges: [600000]
            },
            processing: {
              aiModel: 'gpt-4',
              processingTime: 1500,
              generatedAt: '2024-01-15T10:01:30Z'
            }
          }
        }
      ]));
    });

    it('should return aggregated analytics data', async () => {
      const result = await analyticsService.getAggregatedData();

      expect(result).toMatchObject({
        totalProfiles: 1,
        dateRange: {
          from: expect.any(String),
          to: expect.any(String)
        },
        demographics: {
          byGrade: { '12': 1 },
          byBoard: { 'CBSE': 1 },
          byLocation: { 'Maharashtra': 1 },
          byRuralUrban: { 'urban': 1 },
          byLanguage: { 'english': 1 },
          byCategory: { 'General': 1 },
          byGender: { 'Female': 1 }
        },
        socioeconomic: {
          byIncomeRange: { '5-10 lakhs': 1 },
          byInternetAccess: { 'true': 1 },
          byDeviceAccess: { 'Smartphone': 1 },
          economicFactorsTrends: { 'Middle class': 1 }
        },
        academic: {
          popularInterests: { 'Science': 1 },
          popularSubjects: { 'Physics': 1 },
          performanceDistribution: { 'Good': 1 },
          extracurricularTrends: { 'Debate': 1 }
        },
        recommendations: {
          topCareers: { 'Software Engineer': 1 },
          averageMatchScores: {
            overall: 85,
            byGrade: { '12': 85 },
            byBoard: { 'CBSE': 85 },
            byLocation: { 'Maharashtra': 85 }
          },
          demandLevelDistribution: { 'High': 1 },
          salaryTrends: {
            averageEntry: 600000,
            averageMid: 0,
            averageSenior: 0,
            byCareer: {}
          }
        },
        processing: {
          averageProcessingTime: 1500,
          aiModelUsage: { 'gpt-4': 1 },
          successRate: 100
        }
      });
    });

    it('should apply filters correctly', async () => {
      const filter: AnalyticsFilter = {
        grade: '12',
        board: 'CBSE',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z'
      };

      const result = await analyticsService.getAggregatedData(filter);

      expect(result.totalProfiles).toBe(1);
      expect(result.demographics.byGrade).toEqual({ '12': 1 });
    });

    it('should handle empty data gracefully', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const result = await analyticsService.getAggregatedData();

      expect(result.totalProfiles).toBe(0);
      expect(result.demographics.byGrade).toEqual({});
    });
  });

  describe('getDashboardData', () => {
    beforeEach(() => {
      mockFs.readdir.mockResolvedValue(['analytics_2024-01-15.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        {
          id: 'analytics_1',
          timestamp: '2024-01-15T10:00:00Z',
          anonymizedData: {
            demographics: {
              grade: '12',
              board: 'CBSE',
              location: 'Maharashtra',
              ruralUrban: 'urban',
              languagePreference: 'english'
            },
            recommendations: {
              totalCount: 3,
              averageMatchScore: 85,
              topCareerTitles: ['Software Engineer', 'Data Scientist', 'Doctor']
            }
          }
        }
      ]));
    });

    it('should generate dashboard data for visualization', async () => {
      const result = await analyticsService.getDashboardData();

      expect(result).toMatchObject({
        summary: {
          totalUsers: 1,
          totalRecommendations: expect.any(Number),
          averageMatchScore: 85,
          topCareer: 'Software Engineer',
          growthRate: 0
        },
        trends: {
          dailyUsers: [],
          popularCareers: expect.arrayContaining([
            expect.objectContaining({
              career: 'Software Engineer',
              count: expect.any(Number),
              percentage: expect.any(Number)
            })
          ]),
          locationDistribution: expect.any(Array),
          gradeDistribution: expect.any(Array)
        },
        insights: {
          ruralVsUrban: {
            rural: { count: 0, topCareers: expect.any(Array) },
            urban: { count: 1, topCareers: expect.any(Array) }
          },
          languagePreference: {
            hindi: { count: 0, percentage: 0 },
            english: { count: 1, percentage: 100 }
          },
          incomeImpact: expect.any(Array)
        }
      });
    });
  });

  describe('cleanupOldData', () => {
    it('should remove old analytics entries', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400); // 400 days old

      mockFs.readdir.mockResolvedValue(['analytics_2024-01-15.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        {
          id: 'analytics_old',
          timestamp: oldDate.toISOString(),
          anonymizedData: {}
        },
        {
          id: 'analytics_new',
          timestamp: new Date().toISOString(),
          anonymizedData: {}
        }
      ]));

      const removedCount = await analyticsService.cleanupOldData(365);

      expect(removedCount).toBe(1);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should not remove recent data', async () => {
      mockFs.readdir.mockResolvedValue(['analytics_2024-01-15.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        {
          id: 'analytics_recent',
          timestamp: new Date().toISOString(),
          anonymizedData: {}
        }
      ]));

      const removedCount = await analyticsService.cleanupOldData(365);

      expect(removedCount).toBe(0);
    });
  });

  describe('getAnalyticsStats', () => {
    it('should return analytics statistics', async () => {
      mockFs.readdir.mockResolvedValue(['analytics_2024-01-15.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        { id: 'analytics_1', timestamp: '2024-01-15T10:00:00Z', anonymizedData: {} }
      ]));

      const stats = await analyticsService.getAnalyticsStats();

      expect(stats).toMatchObject({
        totalEntries: 1,
        dateRange: {
          from: expect.any(String),
          to: expect.any(String)
        },
        storageSize: expect.any(Number),
        lastUpdated: expect.any(String)
      });
    });
  });

  describe('exportData', () => {
    it('should export analytics data with filters', async () => {
      mockFs.readdir.mockResolvedValue(['analytics_2024-01-15.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        {
          id: 'analytics_1',
          timestamp: '2024-01-15T10:00:00Z',
          anonymizedData: {
            demographics: { grade: '12' }
          }
        }
      ]));

      const filter: AnalyticsFilter = { grade: '12' };
      const result = await analyticsService.exportData(filter);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('analytics_1');
    });
  });

  describe('Privacy Compliance', () => {
    it('should anonymize profile ID using hash', async () => {
      const processingMetadata = {
        aiModel: 'gpt-4',
        processingTime: 1500,
        generatedAt: '2024-01-15T10:01:30Z'
      };

      await analyticsService.collectAnalytics(
        mockStudentProfile,
        mockRecommendations,
        processingMetadata
      );

      const writeCall = mockFs.writeFile.mock.calls[0];
      const analyticsData = JSON.parse(writeCall[1] as string);
      
      expect(analyticsData[0].anonymizedData.profileHash).not.toBe(mockStudentProfile.id);
      expect(analyticsData[0].anonymizedData.profileHash).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should not store personally identifiable information', async () => {
      const processingMetadata = {
        aiModel: 'gpt-4',
        processingTime: 1500,
        generatedAt: '2024-01-15T10:01:30Z'
      };

      await analyticsService.collectAnalytics(
        mockStudentProfile,
        mockRecommendations,
        processingMetadata
      );

      const writeCall = mockFs.writeFile.mock.calls[0];
      const analyticsData = JSON.parse(writeCall[1] as string);
      const storedData = JSON.stringify(analyticsData);
      
      // Should not contain student name or exact location
      expect(storedData).not.toContain('Test Student');
      expect(storedData).not.toContain('Mumbai');
    });

    it('should categorize sensitive information', async () => {
      const processingMetadata = {
        aiModel: 'gpt-4',
        processingTime: 1500,
        generatedAt: '2024-01-15T10:01:30Z'
      };

      await analyticsService.collectAnalytics(
        mockStudentProfile,
        mockRecommendations,
        processingMetadata
      );

      const writeCall = mockFs.writeFile.mock.calls[0];
      const analyticsData = JSON.parse(writeCall[1] as string);
      
      // Family background should be categorized, not specific
      expect(analyticsData[0].anonymizedData.socioeconomic.familyBackground).toBe('service');
      expect(analyticsData[0].anonymizedData.socioeconomic.familyBackground).not.toBe('Service');
    });
  });
});