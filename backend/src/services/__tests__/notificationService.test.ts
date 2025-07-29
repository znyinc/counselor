/**
 * Tests for NotificationService
 */

import { NotificationService, NotificationConfig } from '../notificationService';
import { StudentProfile } from '../../types/studentProfile';
import { CareerRecommendation } from '../../types/careerRecommendation';

// Mock fetch globally
global.fetch = jest.fn();

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockStudentProfile: StudentProfile;
  let mockRecommendations: CareerRecommendation[];

  const testConfig: NotificationConfig = {
    webhookUrl: 'https://example.com/webhook',
    webhookSecret: 'test-secret',
    enableConsoleLogging: true,
    enableN8nIntegration: false,
    retryAttempts: 2,
    retryDelay: 100,
    timeout: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    notificationService = new NotificationService(testConfig);

    mockStudentProfile = {
      id: 'test-profile-123',
      timestamp: new Date(),
      personalInfo: {
        name: 'Test Student',
        grade: '12',
        board: 'CBSE',
        languagePreference: 'english'
      },
      academicData: {
        interests: ['Technology', 'Science'],
        subjects: ['Physics', 'Mathematics'],
        performance: 'Good',
        favoriteSubjects: ['Mathematics'],
        difficultSubjects: ['Chemistry'],
        extracurricularActivities: ['Coding Club']
      },
      socioeconomicData: {
        location: 'Delhi',
        familyBackground: 'Middle class',
        economicFactors: ['Stable income'],
        ruralUrban: 'urban',
        internetAccess: true,
        deviceAccess: ['Laptop']
      },
      familyIncome: '5-10 Lakh per annum'
    };

    mockRecommendations = [
      {
        id: 'rec-1',
        title: 'Software Engineer',
        description: 'Develop software applications',
        nepAlignment: 'NEP 2020 aligned',
        matchScore: 85,
        requirements: {
          education: ['BTech'],
          skills: ['Programming'],
          entranceExams: ['JEE']
        },
        prospects: {
          averageSalary: { entry: 600000, mid: 1200000, senior: 2500000, currency: 'INR' },
          growthRate: '25%',
          jobMarket: 'High demand',
          demandLevel: 'high',
          futureOutlook: 'Excellent',
          workLifeBalance: 'good'
        },
        recommendedColleges: [],
        scholarships: [],
        visualData: {
          salaryTrends: { labels: [], datasets: [] },
          educationPath: { steps: [], totalDuration: '4 years' },
          requirements: {
            education: { level: 'BTech', subjects: [], minimumMarks: '60%', preferredBoards: [] },
            skills: { technical: [], soft: [], certifications: [] },
            experience: { internships: [], projects: [], competitions: [] }
          }
        },
        pros: ['High salary'],
        cons: ['Long hours']
      }
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const service = new NotificationService();
      const stats = service.getStats();
      
      expect(stats.config.enableConsoleLogging).toBe(true);
      expect(stats.config.retryAttempts).toBe(3);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enableConsoleLogging: false,
        retryAttempts: 5
      };
      
      const service = new NotificationService(customConfig);
      const stats = service.getStats();
      
      expect(stats.config.enableConsoleLogging).toBe(false);
      expect(stats.config.retryAttempts).toBe(5);
    });
  });

  describe('notifyCareerRecommendations', () => {
    it('should send notification successfully with all methods', async () => {
      // Mock successful webhook response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const result = await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations,
        1000
      );

      expect(result.success).toBe(true);
      expect(result.consoleLogged).toBe(true);
      expect(result.webhookDelivered).toBe(true);
      expect(result.deliveryTime).toBeGreaterThan(0);
      expect(global.fetch).toHaveBeenCalledWith(
        testConfig.webhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Event-Type': 'career_recommendations_generated'
          })
        })
      );
    });

    it('should handle webhook delivery failure gracefully', async () => {
      // Mock failed webhook response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      expect(result.success).toBe(true); // Should still succeed due to console logging
      expect(result.consoleLogged).toBe(true);
      expect(result.webhookDelivered).toBe(false);
      expect(result.error).toContain('Webhook delivery failed');
    });

    it('should retry webhook delivery on failure', async () => {
      // Mock first call to fail, second to succeed
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK'
        });

      const result = await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      expect(result.success).toBe(true);
      expect(result.webhookDelivered).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      expect(result.success).toBe(true); // Should still succeed due to console logging
      expect(result.consoleLogged).toBe(true);
      expect(result.webhookDelivered).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should work without webhook URL configured', async () => {
      const serviceWithoutWebhook = new NotificationService({
        webhookUrl: undefined,
        enableConsoleLogging: true
      });

      const result = await serviceWithoutWebhook.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      expect(result.success).toBe(true);
      expect(result.consoleLogged).toBe(true);
      expect(result.webhookDelivered).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should include webhook signature when secret is configured', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      expect(global.fetch).toHaveBeenCalledWith(
        testConfig.webhookUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Webhook-Signature': expect.stringMatching(/^sha256=/)
          })
        })
      );
    });

    it('should build correct webhook payload', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations,
        1500
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload).toMatchObject({
        event: 'career_recommendations_generated',
        student: {
          name: 'Test Student',
          grade: '12',
          board: 'CBSE',
          location: 'Delhi',
          profileId: 'test-profile-123'
        },
        recommendations: [
          {
            title: 'Software Engineer',
            matchScore: 85,
            demandLevel: 'high',
            averageSalary: 600000
          }
        ],
        metadata: {
          totalRecommendations: 1,
          averageMatchScore: 85,
          processingTime: 1500,
          language: 'english'
        }
      });
      expect(payload.timestamp).toBeDefined();
    });
  });

  describe('testWebhook', () => {
    it('should test webhook connectivity successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const result = await notificationService.testWebhook();

      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle webhook test failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await notificationService.testWebhook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('404 Not Found');
    });

    it('should handle webhook test when URL not configured', async () => {
      const serviceWithoutWebhook = new NotificationService({
        webhookUrl: undefined
      });

      const result = await serviceWithoutWebhook.testWebhook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('not configured');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Send a few notifications to generate stats
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      const stats = notificationService.getStats();

      expect(stats.totalNotifications).toBe(1);
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.config).toBeDefined();
      expect(stats.config.webhookSecret).toBe('[REDACTED]');
    });

    it('should calculate success rate correctly', async () => {
      // Mock one success and one failure
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK'
        })
        .mockRejectedValueOnce(new Error('Network error'));

      await notificationService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      // Create service without console logging to force failure
      const failingService = new NotificationService({
        webhookUrl: 'https://example.com/webhook',
        enableConsoleLogging: false
      });

      await failingService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      const stats1 = notificationService.getStats();
      const stats2 = failingService.getStats();

      expect(stats1.successRate).toBe(100);
      expect(stats2.successRate).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        retryAttempts: 5,
        timeout: 2000
      };

      notificationService.updateConfig(newConfig);
      const stats = notificationService.getStats();

      expect(stats.config.retryAttempts).toBe(5);
      expect(stats.config.timeout).toBe(2000);
      expect(stats.config.webhookUrl).toBe(testConfig.webhookUrl); // Should preserve existing values
    });
  });

  describe('n8n Integration', () => {
    it('should trigger n8n workflow when enabled', async () => {
      const n8nService = new NotificationService({
        ...testConfig,
        enableN8nIntegration: true
      });

      // Mock environment variable
      process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const result = await n8nService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      expect(result.success).toBe(true);
      expect(result.n8nTriggered).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Career-Counseling-n8n/1.0'
          })
        })
      );

      // Clean up
      delete process.env.N8N_WEBHOOK_URL;
    });

    it('should skip n8n when URL not configured', async () => {
      const n8nService = new NotificationService({
        ...testConfig,
        enableN8nIntegration: true
      });

      // Ensure N8N_WEBHOOK_URL is not set
      delete process.env.N8N_WEBHOOK_URL;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const result = await n8nService.notifyCareerRecommendations(
        mockStudentProfile,
        mockRecommendations
      );

      expect(result.success).toBe(true);
      expect(result.n8nTriggered).toBe(false);
    });
  });
});