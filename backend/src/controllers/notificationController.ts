/**
 * Notification Controller for webhook endpoints
 * Handles webhook notifications and n8n workflow integration
 */

import { Request, Response } from 'express';
import { NotificationService, WebhookPayload } from '../services/notificationService';
import { StudentProfile } from '../types/studentProfile';
import { CareerRecommendation } from '../types/careerRecommendation';
import { CustomError } from '../middleware/errorHandler';

export interface NotifyRequest extends Request {
  body: {
    studentProfile: StudentProfile;
    recommendations: CareerRecommendation[];
    processingTime?: number;
    metadata?: {
      source?: string;
      requestId?: string;
      userAgent?: string;
    };
  };
}

export interface NotifyResponse {
  success: boolean;
  data?: {
    notificationId: string;
    deliveryStatus: {
      webhookDelivered: boolean;
      consoleLogged: boolean;
      n8nTriggered: boolean;
    };
    deliveryTime: number;
    attempts: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface WebhookTestResponse {
  success: boolean;
  data?: {
    webhookUrl: string;
    responseTime: number;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export class NotificationController {
  private notificationService: NotificationService;
  private requestCount: number = 0;

  constructor() {
    this.notificationService = new NotificationService();
    console.log('NotificationController initialized');
  }

  /**
   * Send notification webhook
   * POST /api/notify
   */
  sendNotification = async (req: NotifyRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    this.requestCount++;

    try {
      console.log('Processing notification request');

      // Validate request body
      const { studentProfile, recommendations, processingTime = 0, metadata } = req.body;

      if (!studentProfile || !recommendations) {
        throw new CustomError(
          'Missing required fields: studentProfile and recommendations',
          400,
          'MISSING_REQUIRED_FIELDS'
        );
      }

      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new CustomError(
          'Recommendations must be a non-empty array',
          400,
          'INVALID_RECOMMENDATIONS'
        );
      }

      // Validate student profile structure
      if (!studentProfile.personalInfo?.name || !studentProfile.id) {
        throw new CustomError(
          'Invalid student profile: missing name or id',
          400,
          'INVALID_STUDENT_PROFILE'
        );
      }

      // Generate notification ID
      const notificationId = this.generateNotificationId();

      // Send notification
      const result = await this.notificationService.notifyCareerRecommendations(
        studentProfile,
        recommendations,
        processingTime
      );

      const totalTime = Date.now() - startTime;

      // Prepare response
      const response: NotifyResponse = {
        success: result.success,
        data: {
          notificationId,
          deliveryStatus: {
            webhookDelivered: result.webhookDelivered,
            consoleLogged: result.consoleLogged,
            n8nTriggered: result.n8nTriggered
          },
          deliveryTime: result.deliveryTime,
          attempts: result.attempts
        },
        timestamp: new Date().toISOString()
      };

      if (!result.success && result.error) {
        response.error = {
          code: 'NOTIFICATION_DELIVERY_FAILED',
          message: result.error
        };
      }

      // Log request metadata
      if (metadata) {
        console.log('Notification request metadata:', {
          notificationId,
          source: metadata.source,
          requestId: metadata.requestId,
          userAgent: metadata.userAgent,
          processingTime: totalTime
        });
      }

      const statusCode = result.success ? 200 : 207; // 207 for partial success
      res.status(statusCode).json(response);

      console.log(`Notification request processed in ${totalTime}ms:`, {
        notificationId,
        success: result.success,
        webhookDelivered: result.webhookDelivered,
        consoleLogged: result.consoleLogged,
        n8nTriggered: result.n8nTriggered
      });

    } catch (error) {
      console.error('Notification request failed:', error);

      const totalTime = Date.now() - startTime;

      if (error instanceof CustomError) {
        const response: NotifyResponse = {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: (error as any).details
          },
          timestamp: new Date().toISOString()
        };

        res.status(error.statusCode).json(response);
      } else {
        const response: NotifyResponse = {
          success: false,
          error: {
            code: 'NOTIFICATION_REQUEST_ERROR',
            message: 'Failed to process notification request',
            details: process.env.NODE_ENV === 'development' ? error : undefined
          },
          timestamp: new Date().toISOString()
        };

        res.status(500).json(response);
      }

      console.log(`Notification request failed in ${totalTime}ms`);
    }
  };

  /**
   * Test webhook connectivity
   * GET /api/notify/test
   */
  testWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Testing webhook connectivity');

      const testResult = await this.notificationService.testWebhook();

      const response: WebhookTestResponse = {
        success: testResult.success,
        data: testResult.success ? ({
          webhookUrl: process.env.WEBHOOK_URL || 'Not configured',
          responseTime: testResult.responseTime,
          status: testResult.message
        } as any) : undefined,
        error: !testResult.success ? ({
          code: 'WEBHOOK_TEST_FAILED',
          message: testResult.message
        } as any) : undefined,
        timestamp: new Date().toISOString()
      };

      res.status(testResult.success ? 200 : 503).json(response);

    } catch (error) {
      console.error('Webhook test failed:', error);

      const response: WebhookTestResponse = {
        success: false,
        error: {
          code: 'WEBHOOK_TEST_ERROR',
          message: 'Failed to test webhook connectivity'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  };

  /**
   * Get notification service statistics
   * GET /api/notify/stats
   */
  getNotificationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = this.notificationService.getStats();

      const response = {
        success: true,
        data: {
          ...stats,
          controller: {
            requestCount: this.requestCount,
            uptime: process.uptime()
          }
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Failed to get notification stats:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to retrieve notification statistics'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Health check for notification service
   * GET /api/notify/health
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = this.notificationService.getStats();
      const webhookTest = await this.notificationService.testWebhook();

      const isHealthy = webhookTest.success || !process.env.WEBHOOK_URL; // Healthy if webhook works or not configured

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        services: {
          notificationService: 'healthy',
          webhook: webhookTest.success ? 'healthy' : 'unhealthy',
          console: 'healthy',
          n8n: process.env.N8N_WEBHOOK_URL ? 'configured' : 'not-configured'
        },
        stats: {
          totalNotifications: stats.totalNotifications,
          successRate: stats.successRate,
          requestCount: this.requestCount
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Notification health check failed:', error);

      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Receive webhook (for testing webhook delivery)
   * POST /api/notify/receive
   */
  receiveWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const headers = req.headers;

      console.log('Webhook received:', {
        timestamp: new Date().toISOString(),
        event: payload.event,
        contentType: headers['content-type'],
        userAgent: headers['user-agent'],
        signature: headers['x-webhook-signature'],
        payloadSize: JSON.stringify(payload).length
      });

      // Verify webhook signature if secret is configured
      if (process.env.WEBHOOK_SECRET && headers['x-webhook-signature']) {
        const expectedSignature = this.generateWebhookSignature(
          JSON.stringify(payload),
          process.env.WEBHOOK_SECRET
        );

        if (headers['x-webhook-signature'] !== expectedSignature) {
          throw new CustomError(
            'Invalid webhook signature',
            401,
            'INVALID_WEBHOOK_SIGNATURE'
          );
        }
      }

      // Log webhook details
      if (payload.event === 'career_recommendations_generated') {
        console.log('Career recommendation webhook received:', {
          student: payload.student?.name,
          grade: payload.student?.grade,
          recommendations: payload.recommendations?.length,
          averageMatch: payload.metadata?.averageMatchScore
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook received successfully',
        receivedAt: new Date().toISOString(),
        event: payload.event
      });

    } catch (error) {
      console.error('Webhook receive error:', error);

      if (error instanceof CustomError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'WEBHOOK_RECEIVE_ERROR',
            message: 'Failed to process webhook'
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `notify_${timestamp}_${randomStr}`;
  }

  /**
   * Generate webhook signature for verification
   */
  private generateWebhookSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }
}