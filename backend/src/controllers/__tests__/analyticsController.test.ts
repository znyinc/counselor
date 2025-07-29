/**
 * Analytics Controller Tests
 * Tests for analytics API endpoints and request handling
 */

import { Request, Response } from 'express';
import { AnalyticsController, AnalyticsRequest } from '../analyticsController';
import { AnalyticsService } from '../../services/analyticsService';

// Mock the AnalyticsService
jest.mock('../../services/analyticsService');
const MockAnalyticsService = AnalyticsService as jest.MockedClass<typeof AnalyticsService>;

describe('AnalyticsController', () => {
  let analyticsController: AnalyticsController;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockRequest: Partial<AnalyticsRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock analytics service instance
    mockAnalyticsService = {
      getAggregatedData: jest.fn(),
      getDashboardData: jest.fn(),
      getAnalyticsStats: jest.fn(),
      exportData: jest.fn(),
      cleanupOldData: jest.fn(),
      collectAnalytics: jest.fn()
    } as any;

    MockAnalyticsService.mockImplementation(() => mockAnalyticsService);
    
    analyticsController = new AnalyticsController();

    // Mock request and response objects
    mockRequest = {
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('getAnalytics', () => {
    it('should return aggregated analytics data successfully', async () => {
      const mockAggregatedData = {
        totalProfiles: 100,
        dateRange: { from: '2024-01-01', to: '2024-01-31' },
        demographics: { byGrade: { '12': 50, '11': 30, '10': 20 } },
        socioeconomic: { byIncomeRange: { '5-10 lakhs': 40, '10-20 lakhs': 35 } },
        academic: { popularInterests: { 'Science': 60, 'Commerce': 25 } },
        recommendations: { 
          topCareers: { 'Software Engineer': 30, 'Doctor': 25 },
          averageMatchScores: { overall: 78 }
        },
        processing: { averageProcessingTime: 1200, successRate: 98 }
      };

      mockAnalyticsService.getAggregatedData.mockResolvedValue(mockAggregatedData);

      mockRequest.query = {
        grade: '12',
        board: 'CBSE',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      };

      await analyticsController.getAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.getAggregatedData).toHaveBeenCalledWith({
        grade: '12',
        board: 'CBSE',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAggregatedData,
        metadata: {
          totalRecords: 100,
          filteredRecords: 100,
          generatedAt: expect.any(String),
          filters: {
            grade: '12',
            board: 'CBSE',
            dateFrom: '2024-01-01',
            dateTo: '2024-01-31'
          }
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle analytics service errors', async () => {
      const error = new Error('Analytics service failed');
      mockAnalyticsService.getAggregatedData.mockRejectedValue(error);

      await analyticsController.getAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ANALYTICS_REQUEST_ERROR',
          message: 'Failed to process analytics request',
          details: undefined // Should be undefined in production
        },
        timestamp: expect.any(String)
      });
    });

    it('should apply pagination filters correctly', async () => {
      mockRequest.query = {
        limit: '50',
        offset: '10'
      };

      mockAnalyticsService.getAggregatedData.mockResolvedValue({
        totalProfiles: 0,
        dateRange: { from: '', to: '' },
        demographics: { byGrade: {}, byBoard: {}, byLocation: {}, byRuralUrban: {}, byLanguage: {}, byCategory: {}, byGender: {} },
        socioeconomic: { byIncomeRange: {}, byInternetAccess: {}, byDeviceAccess: {}, economicFactorsTrends: {} },
        academic: { popularInterests: {}, popularSubjects: {}, performanceDistribution: {}, extracurricularTrends: {} },
        recommendations: { 
          topCareers: {}, 
          averageMatchScores: { overall: 0, byGrade: {}, byBoard: {}, byLocation: {} },
          demandLevelDistribution: {},
          salaryTrends: { averageEntry: 0, averageMid: 0, averageSenior: 0, byCareer: {} }
        },
        processing: { averageProcessingTime: 0, aiModelUsage: {}, successRate: 100 }
      });

      await analyticsController.getAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.getAggregatedData).toHaveBeenCalledWith({
        limit: 50,
        offset: 10
      });
    });

    it('should cap limit at 1000 for performance', async () => {
      mockRequest.query = {
        limit: '5000' // Should be capped at 1000
      };

      mockAnalyticsService.getAggregatedData.mockResolvedValue({
        totalProfiles: 0,
        dateRange: { from: '', to: '' },
        demographics: { byGrade: {}, byBoard: {}, byLocation: {}, byRuralUrban: {}, byLanguage: {}, byCategory: {}, byGender: {} },
        socioeconomic: { byIncomeRange: {}, byInternetAccess: {}, byDeviceAccess: {}, economicFactorsTrends: {} },
        academic: { popularInterests: {}, popularSubjects: {}, performanceDistribution: {}, extracurricularTrends: {} },
        recommendations: { 
          topCareers: {}, 
          averageMatchScores: { overall: 0, byGrade: {}, byBoard: {}, byLocation: {} },
          demandLevelDistribution: {},
          salaryTrends: { averageEntry: 0, averageMid: 0, averageSenior: 0, byCareer: {} }
        },
        processing: { averageProcessingTime: 0, aiModelUsage: {}, successRate: 100 }
      });

      await analyticsController.getAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.getAggregatedData).toHaveBeenCalledWith({
        limit: 1000 // Should be capped
      });
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data successfully', async () => {
      const mockDashboardData = {
        summary: {
          totalUsers: 150,
          totalRecommendations: 450,
          averageMatchScore: 82,
          topCareer: 'Software Engineer',
          growthRate: 15
        },
        trends: {
          dailyUsers: [{ date: '2024-01-15', count: 25 }],
          popularCareers: [{ career: 'Software Engineer', count: 45, percentage: 30 }],
          locationDistribution: [{ location: 'Maharashtra', count: 60, percentage: 40 }],
          gradeDistribution: [{ grade: '12', count: 75, percentage: 50 }]
        },
        insights: {
          ruralVsUrban: {
            rural: { count: 45, topCareers: ['Agriculture', 'Teaching'] },
            urban: { count: 105, topCareers: ['Software Engineer', 'Doctor'] }
          },
          languagePreference: {
            hindi: { count: 90, percentage: 60 },
            english: { count: 60, percentage: 40 }
          },
          incomeImpact: [
            { range: '5-10 lakhs', count: 60, averageMatchScore: 80, topCareers: ['Engineer'] }
          ]
        }
      };

      mockAnalyticsService.getDashboardData.mockResolvedValue(mockDashboardData);

      await analyticsController.getDashboard(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.getDashboardData).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDashboardData,
        metadata: {
          totalRecords: 150,
          filteredRecords: 150,
          generatedAt: expect.any(String),
          filters: {}
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle dashboard generation errors', async () => {
      const error = new Error('Dashboard generation failed');
      mockAnalyticsService.getDashboardData.mockRejectedValue(error);

      await analyticsController.getDashboard(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DASHBOARD_REQUEST_ERROR',
          message: 'Failed to generate dashboard data'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('getAnalyticsStats', () => {
    it('should return analytics statistics', async () => {
      const mockStats = {
        totalEntries: 500,
        dateRange: { from: '2024-01-01', to: '2024-01-31' },
        storageSize: 2048,
        lastUpdated: '2024-01-31T10:00:00Z'
      };

      mockAnalyticsService.getAnalyticsStats.mockResolvedValue(mockStats);

      await analyticsController.getAnalyticsStats(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAnalyticsService.getAnalyticsStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockStats,
          controller: {
            requestCount: expect.any(Number),
            uptime: expect.any(Number)
          }
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle stats retrieval errors', async () => {
      const error = new Error('Stats retrieval failed');
      mockAnalyticsService.getAnalyticsStats.mockRejectedValue(error);

      await analyticsController.getAnalyticsStats(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to retrieve analytics statistics'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics data as JSON', async () => {
      const mockExportData = [
        {
          id: 'analytics_1',
          timestamp: '2024-01-15T10:00:00Z',
          anonymizedData: {
            demographics: { grade: '12', board: 'CBSE' },
            recommendations: { totalCount: 3 }
          }
        }
      ];

      mockAnalyticsService.exportData.mockResolvedValue(mockExportData);

      mockRequest.query = { format: 'json' };

      await analyticsController.exportAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith({});
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/attachment; filename="analytics_export_.*\.json"/)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockExportData,
        metadata: {
          totalRecords: 1,
          exportedAt: expect.any(String),
          format: 'json',
          filters: {}
        }
      });
    });

    it('should export analytics data as CSV', async () => {
      const mockExportData = [
        {
          id: 'analytics_1',
          timestamp: '2024-01-15T10:00:00Z',
          anonymizedData: {
            profileHash: 'hash1',
            demographics: { grade: '12', board: 'CBSE', location: 'Maharashtra', ruralUrban: 'urban', languagePreference: 'english', category: 'General', gender: 'Female' },
            socioeconomic: { incomeRange: '5-10 lakhs', familyBackground: 'service', internetAccess: true, deviceAccess: ['Smartphone'], economicFactors: ['Middle class'] },
            academic: { interests: ['Science'], subjects: ['Physics'], performance: 'Good', favoriteSubjects: ['Physics'], difficultSubjects: ['Chemistry'], extracurricularActivities: ['Debate'] },
            recommendations: { totalCount: 3, averageMatchScore: 85, topCareerTitles: ['Software Engineer'], demandLevels: ['High'] },
            processing: { aiModel: 'gpt-4', processingTime: 1500, generatedAt: '2024-01-15T10:01:30Z' }
          }
        }
      ];

      mockAnalyticsService.exportData.mockResolvedValue(mockExportData);

      mockRequest.query = { format: 'csv' };

      await analyticsController.exportAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith({});
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/attachment; filename="analytics_export_.*\.csv"/)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('id,timestamp'));
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      mockAnalyticsService.exportData.mockRejectedValue(error);

      await analyticsController.exportAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export analytics data'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('cleanupAnalytics', () => {
    it('should cleanup old analytics data', async () => {
      mockAnalyticsService.cleanupOldData.mockResolvedValue(25);

      mockRequest.query = { retentionDays: '180' };

      await analyticsController.cleanupAnalytics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAnalyticsService.cleanupOldData).toHaveBeenCalledWith(180);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          removedEntries: 25,
          retentionDays: 180,
          cleanupDate: expect.any(String)
        },
        message: 'Successfully cleaned up 25 old analytics entries',
        timestamp: expect.any(String)
      });
    });

    it('should use default retention period if not specified', async () => {
      mockAnalyticsService.cleanupOldData.mockResolvedValue(10);

      await analyticsController.cleanupAnalytics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAnalyticsService.cleanupOldData).toHaveBeenCalledWith(365); // Default
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup failed');
      mockAnalyticsService.cleanupOldData.mockRejectedValue(error);

      await analyticsController.cleanupAnalytics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Failed to cleanup analytics data'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when service is working', async () => {
      const mockStats = {
        totalEntries: 100,
        dateRange: { from: '2024-01-01', to: '2024-01-31' },
        storageSize: 1024,
        lastUpdated: '2024-01-31T10:00:00Z'
      };

      mockAnalyticsService.getAnalyticsStats.mockResolvedValue(mockStats);

      await analyticsController.healthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'healthy',
        services: {
          analyticsService: 'healthy',
          dataStorage: 'healthy',
          processing: 'healthy'
        },
        stats: {
          totalEntries: 100,
          dateRange: { from: '2024-01-01', to: '2024-01-31' },
          storageSize: 1024,
          requestCount: expect.any(Number)
        },
        timestamp: expect.any(String)
      });
    });

    it('should return unhealthy status when service fails', async () => {
      const error = new Error('Health check failed');
      mockAnalyticsService.getAnalyticsStats.mockRejectedValue(error);

      await analyticsController.healthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: expect.any(String)
      });
    });

    it('should indicate empty data storage', async () => {
      const mockStats = {
        totalEntries: 0,
        dateRange: { from: '', to: '' },
        storageSize: 0,
        lastUpdated: ''
      };

      mockAnalyticsService.getAnalyticsStats.mockResolvedValue(mockStats);

      await analyticsController.healthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          services: expect.objectContaining({
            dataStorage: 'empty'
          })
        })
      );
    });
  });

  describe('Filter Parsing', () => {
    it('should parse all filter parameters correctly', async () => {
      mockRequest.query = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        grade: '12',
        board: 'CBSE',
        location: 'Maharashtra',
        ruralUrban: 'urban',
        languagePreference: 'english',
        incomeRange: '5-10 lakhs',
        limit: '100',
        offset: '20'
      };

      mockAnalyticsService.getAggregatedData.mockResolvedValue({
        totalProfiles: 0,
        dateRange: { from: '', to: '' },
        demographics: { byGrade: {}, byBoard: {}, byLocation: {}, byRuralUrban: {}, byLanguage: {}, byCategory: {}, byGender: {} },
        socioeconomic: { byIncomeRange: {}, byInternetAccess: {}, byDeviceAccess: {}, economicFactorsTrends: {} },
        academic: { popularInterests: {}, popularSubjects: {}, performanceDistribution: {}, extracurricularTrends: {} },
        recommendations: { 
          topCareers: {}, 
          averageMatchScores: { overall: 0, byGrade: {}, byBoard: {}, byLocation: {} },
          demandLevelDistribution: {},
          salaryTrends: { averageEntry: 0, averageMid: 0, averageSenior: 0, byCareer: {} }
        },
        processing: { averageProcessingTime: 0, aiModelUsage: {}, successRate: 100 }
      });

      await analyticsController.getAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.getAggregatedData).toHaveBeenCalledWith({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        grade: '12',
        board: 'CBSE',
        location: 'Maharashtra',
        ruralUrban: 'urban',
        languagePreference: 'english',
        incomeRange: '5-10 lakhs',
        limit: 100,
        offset: 20
      });
    });

    it('should ignore invalid numeric parameters', async () => {
      mockRequest.query = {
        limit: 'invalid',
        offset: 'invalid'
      };

      mockAnalyticsService.getAggregatedData.mockResolvedValue({
        totalProfiles: 0,
        dateRange: { from: '', to: '' },
        demographics: { byGrade: {}, byBoard: {}, byLocation: {}, byRuralUrban: {}, byLanguage: {}, byCategory: {}, byGender: {} },
        socioeconomic: { byIncomeRange: {}, byInternetAccess: {}, byDeviceAccess: {}, economicFactorsTrends: {} },
        academic: { popularInterests: {}, popularSubjects: {}, performanceDistribution: {}, extracurricularTrends: {} },
        recommendations: { 
          topCareers: {}, 
          averageMatchScores: { overall: 0, byGrade: {}, byBoard: {}, byLocation: {} },
          demandLevelDistribution: {},
          salaryTrends: { averageEntry: 0, averageMid: 0, averageSenior: 0, byCareer: {} }
        },
        processing: { averageProcessingTime: 0, aiModelUsage: {}, successRate: 100 }
      });

      await analyticsController.getAnalytics(
        mockRequest as AnalyticsRequest,
        mockResponse as Response
      );

      expect(mockAnalyticsService.getAggregatedData).toHaveBeenCalledWith({});
    });
  });
});