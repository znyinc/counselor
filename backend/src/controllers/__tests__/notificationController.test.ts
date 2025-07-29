/**
 * Tests for NotificationController
 */

import request from 'supertest';
import express from 'express';
import { NotificationController } from '../notificationController';
import { NotificationService } from '../../services/notificationService';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the notification service
jest.mock('../../services/notificationService');

describe('NotificationController', () => {
  let app: express.Application;
  let notificationController: NotificationController;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const validNotificationRequest = {
    studentProfile: {
      id: 'test-profile-123',
      timestamp: new Date().toISOString(),
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
        favoriteSubjects: ['Physics'],
        difficultSubjects: [],
        extracurricularActivities: []
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
    },
    recommendations: [
      {
        id: 'rec-1',
        title: 'Software Engineer',
        description: 'Develop software',
        matchScore: 85,
        prospects: {
          demandLevel: 'high',
          averageSalary: {
            entry: 600000,
            mid: 1200000,
            senior: 2500000,
            currency: 'INR'
          }
        }
      }
    ],
    processingTime: 1000,
    metadata: {
      source: 'profile-controller',
      requestId: 'req-123'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock notification service
    mockNotificationService = {
      notifyCareerRecommendations: jest.fn().mockResolvedValue({
        success: true,
        webhookDelivered: true,
        consoleLogged: true,
        n8nTriggered: false,
        deliveryTime: 500,
        attempts: 1
      }),
      testWebhook: jest.fn().mockResolvedValue({
        success: true,
        message: 'Webhook test successful',
        responseTime: 200
      }),
      getStats: jest.fn().mockReturnValue({
        totalNotifications: 5,
        successCount: 4,
        failureCount: 1,
        successRate: 80,
        config: {
          webhookUrl: 'https://example.com/webhook',
          enableConsoleLogging: true,
          retryAttempts: 3
        }
      }),
      updateConfig: jest.fn()
    } as any;

    (NotificationService as jest.Mock).mockImplementation(() => mockNotificationService);

    // Setup Express app
    app = express();
    app.use(express.json());
    
    notificationController = new NotificationController();
    
    // Setup routes
    app.post('/api/notify', notificationController.sendNotification);
    app.get('/api/notify/test', notificationController.testWebhook);
    app.get('/api/notify/stats', notificationController.getNotificationStats);
    app.get('/api/notify/health', notificationController.healthCheck);
    app.post('/api/notify/receive', notificationController.receiveWebhook);
    
    // Error handling
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/notify', () => {
    it('should send notification successfully', async () => {
      const response = await request(app)
        .post('/api/notify')
        .send(validNotificationRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.notificationId).toBeDefined();
      expect(response.body.data.deliveryStatus).toMatchObject({
        webhookDelivered: true,
        consoleLogged: true,
        n8nTriggered: false
      });
      expect(response.body.data.deliveryTime).toBe(500);
      expect(response.body.timestamp).toBeDefined();

      expect(mockNotificationService.notifyCareerRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-profile-123',
          personalInfo: expect.objectContaining({
            name: 'Test Student'
          })
        }),
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Software Engineer',
            matchScore: 85
          })
        ]),
        1000
      );
    });

    it('should handle missing required fields', async () => {
      const incompleteRequest = {
        studentProfile: {
          id: 'test-profile-123'
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/notify')
        .send(incompleteRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should handle invalid recommendations array', async () => {
      const invalidRequest = {
        ...validNotificationRequest,
        recommendations: [] // Empty array
      };

      const response = await request(app)
        .post('/api/notify')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RECOMMENDATIONS');
    });

    it('should handle notification service failure', async () => {
      mockNotificationService.notifyCareerRecommendations.mockResolvedValue({
        success: false,
        webhookDelivered: false,
        consoleLogged: true,
        n8nTriggered: false,
        error: 'Webhook delivery failed',
        deliveryTime: 100,
        attempts: 3
      });

      const response = await request(app)
        .post('/api/notify')
        .send(validNotificationRequest)
        .expect(207); // Partial success

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('NOTIFICATION_DELIVERY_FAILED');
      expect(response.body.data.deliveryStatus.consoleLogged).toBe(true);
      expect(response.body.data.deliveryStatus.webhookDelivered).toBe(false);
    });

    it('should handle notification service errors', async () => {
      mockNotificationService.notifyCareerRecommendations.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .post('/api/notify')
        .send(validNotificationRequest)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_REQUEST_ERROR');
    });

    it('should handle requests without optional fields', async () => {
      const minimalRequest = {
        studentProfile: validNotificationRequest.studentProfile,
        recommendations: validNotificationRequest.recommendations
        // No processingTime or metadata
      };

      const response = await request(app)
        .post('/api/notify')
        .send(minimalRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockNotificationService.notifyCareerRecommendations).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array),
        0 // Default processing time
      );
    });
  });

  describe('GET /api/notify/test', () => {
    it('should test webhook successfully', async () => {
      const response = await request(app)
        .get('/api/notify/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.responseTime).toBe(200);
      expect(response.body.data.status).toBe('Webhook test successful');
      expect(mockNotificationService.testWebhook).toHaveBeenCalledTimes(1);
    });

    it('should handle webhook test failure', async () => {
      mockNotificationService.testWebhook.mockResolvedValue({
        success: false,
        message: 'Connection failed',
        responseTime: 0
      });

      const response = await request(app)
        .get('/api/notify/test')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WEBHOOK_TEST_FAILED');
      expect(response.body.error.message).toBe('Connection failed');
    });

    it('should handle webhook test errors', async () => {
      mockNotificationService.testWebhook.mockRejectedValue(new Error('Test failed'));

      const response = await request(app)
        .get('/api/notify/test')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WEBHOOK_TEST_ERROR');
    });
  });

  describe('GET /api/notify/stats', () => {
    it('should return notification statistics', async () => {
      const response = await request(app)
        .get('/api/notify/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalNotifications).toBe(5);
      expect(response.body.data.successCount).toBe(4);
      expect(response.body.data.failureCount).toBe(1);
      expect(response.body.data.successRate).toBe(80);
      expect(response.body.data.controller).toBeDefined();
      expect(response.body.data.controller.requestCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle stats retrieval errors', async () => {
      mockNotificationService.getStats.mockImplementation(() => {
        throw new Error('Stats unavailable');
      });

      const response = await request(app)
        .get('/api/notify/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STATS_ERROR');
    });
  });

  describe('GET /api/notify/health', () => {
    it('should return healthy status when all services work', async () => {
      const response = await request(app)
        .get('/api/notify/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.services.notificationService).toBe('healthy');
      expect(response.body.services.webhook).toBe('healthy');
      expect(response.body.stats).toBeDefined();
    });

    it('should return unhealthy status when webhook fails', async () => {
      mockNotificationService.testWebhook.mockResolvedValue({
        success: false,
        message: 'Webhook failed',
        responseTime: 0
      });

      const response = await request(app)
        .get('/api/notify/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.services.webhook).toBe('unhealthy');
    });

    it('should handle health check errors', async () => {
      mockNotificationService.testWebhook.mockRejectedValue(new Error('Health check failed'));

      const response = await request(app)
        .get('/api/notify/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('POST /api/notify/receive', () => {
    it('should receive webhook successfully', async () => {
      const webhookPayload = {
        event: 'career_recommendations_generated',
        timestamp: new Date().toISOString(),
        student: {
          name: 'Test Student',
          grade: '12'
        },
        recommendations: [
          {
            title: 'Software Engineer',
            matchScore: 85
          }
        ]
      };

      const response = await request(app)
        .post('/api/notify/receive')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Webhook received successfully');
      expect(response.body.event).toBe('career_recommendations_generated');
    });

    it('should handle webhook signature validation', async () => {
      // Mock environment variable for webhook secret
      process.env.WEBHOOK_SECRET = 'test-secret';

      const webhookPayload = {
        event: 'test_event',
        data: 'test'
      };

      // Generate correct signature
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'test-secret');
      hmac.update(JSON.stringify(webhookPayload));
      const signature = `sha256=${hmac.digest('hex')}`;

      const response = await request(app)
        .post('/api/notify/receive')
        .set('X-Webhook-Signature', signature)
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Clean up
      delete process.env.WEBHOOK_SECRET;
    });

    it('should reject invalid webhook signature', async () => {
      // Mock environment variable for webhook secret
      process.env.WEBHOOK_SECRET = 'test-secret';

      const webhookPayload = {
        event: 'test_event',
        data: 'test'
      };

      const response = await request(app)
        .post('/api/notify/receive')
        .set('X-Webhook-Signature', 'sha256=invalid-signature')
        .send(webhookPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');

      // Clean up
      delete process.env.WEBHOOK_SECRET;
    });

    it('should handle webhook receive errors', async () => {
      // Send malformed payload
      const response = await request(app)
        .post('/api/notify/receive')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Request Validation', () => {
    it('should validate student profile structure', async () => {
      const invalidRequest = {
        ...validNotificationRequest,
        studentProfile: {
          id: 'test-profile-123'
          // Missing required personalInfo
        }
      };

      const response = await request(app)
        .post('/api/notify')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STUDENT_PROFILE');
    });

    it('should validate recommendation structure', async () => {
      const invalidRequest = {
        ...validNotificationRequest,
        recommendations: [
          {
            id: 'rec-1',
            title: 'Software Engineer'
            // Missing required matchScore and prospects
          }
        ]
      };

      const response = await request(app)
        .post('/api/notify')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle metadata correctly', async () => {
      const requestWithMetadata = {
        ...validNotificationRequest,
        metadata: {
          source: 'test-source',
          requestId: 'test-request-123',
          userAgent: 'Test-Agent/1.0'
        }
      };

      const response = await request(app)
        .post('/api/notify')
        .send(requestWithMetadata)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification ID Generation', () => {
    it('should generate unique notification IDs', async () => {
      const response1 = await request(app)
        .post('/api/notify')
        .send(validNotificationRequest)
        .expect(200);

      const response2 = await request(app)
        .post('/api/notify')
        .send(validNotificationRequest)
        .expect(200);

      expect(response1.body.data.notificationId).not.toBe(response2.body.data.notificationId);
      expect(response1.body.data.notificationId).toMatch(/^notify_/);
      expect(response2.body.data.notificationId).toMatch(/^notify_/);
    });
  });
});