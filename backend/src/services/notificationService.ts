/**
 * Notification Service for webhook notifications
 * Handles parent/counselor alerts when students receive career recommendations
 */

import { StudentProfile } from '../types/studentProfile';
import { CareerRecommendation } from '../types/careerRecommendation';
import { CustomError } from '../middleware/errorHandler';

export interface WebhookPayload {
  event: 'career_recommendations_generated';
  timestamp: string;
  student: {
    name: string;
    grade: string;
    board: string;
    location: string;
    profileId: string;
  };
  recommendations: {
    title: string;
    matchScore: number;
    demandLevel: string;
    averageSalary: number;
  }[];
  metadata: {
    totalRecommendations: number;
    averageMatchScore: number;
    processingTime: number;
    language: string;
  };
  n8nWorkflow?: {
    workflowId?: string;
    executionId?: string;
    triggerUrl?: string;
  };
}

export interface NotificationConfig {
  webhookUrl?: string | undefined;
  webhookSecret?: string | undefined;
  enableConsoleLogging: boolean;
  enableN8nIntegration: boolean;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface NotificationResult {
  success: boolean;
  webhookDelivered: boolean;
  consoleLogged: boolean;
  n8nTriggered: boolean;
  error?: string;
  deliveryTime: number;
  attempts: number;
}

export class NotificationService {
  private config: NotificationConfig;
  private notificationCount: number = 0;
  private successCount: number = 0;
  private failureCount: number = 0;

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      webhookUrl: process.env.WEBHOOK_URL,
      webhookSecret: process.env.WEBHOOK_SECRET,
      enableConsoleLogging: true,
      enableN8nIntegration: process.env.ENABLE_N8N_INTEGRATION === 'true',
      retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000'),
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000'),
      ...config
    };

    console.log('NotificationService initialized:', {
      webhookConfigured: !!this.config.webhookUrl,
      consoleLogging: this.config.enableConsoleLogging,
      n8nIntegration: this.config.enableN8nIntegration,
      retryAttempts: this.config.retryAttempts
    });
  }

  /**
   * Send notification when career recommendations are generated
   */
  async notifyCareerRecommendations(
    profile: StudentProfile,
    recommendations: CareerRecommendation[],
    processingTime: number = 0
  ): Promise<NotificationResult> {
    const startTime = Date.now();
    this.notificationCount++;

    try {
      console.log(`Sending career recommendation notification for profile: ${profile.id}`);

      // Build webhook payload
      const payload = this.buildWebhookPayload(profile, recommendations, processingTime);

      // Initialize result
      const result: NotificationResult = {
        success: false,
        webhookDelivered: false,
        consoleLogged: false,
        n8nTriggered: false,
        deliveryTime: 0,
        attempts: 0
      };

      // Execute notifications in parallel (don't let one failure affect others)
      const notificationPromises: Promise<void>[] = [];

      // Console logging (always enabled for debugging)
      if (this.config.enableConsoleLogging) {
        notificationPromises.push(
          this.logToConsole(payload).then(() => {
            result.consoleLogged = true;
          }).catch(error => {
            console.error('Console logging failed:', error);
          })
        );
      }

      // Webhook delivery
      if (this.config.webhookUrl) {
        notificationPromises.push(
          this.deliverWebhook(payload).then(() => {
            result.webhookDelivered = true;
          }).catch(error => {
            console.error('Webhook delivery failed:', error);
            result.error = error.message;
          })
        );
      }

      // n8n workflow trigger
      if (this.config.enableN8nIntegration) {
        notificationPromises.push(
          this.triggerN8nWorkflow(payload).then(() => {
            result.n8nTriggered = true;
          }).catch(error => {
            console.error('n8n workflow trigger failed:', error);
          })
        );
      }

      // Wait for all notifications to complete (with timeout)
      await Promise.allSettled(notificationPromises);

      // Calculate delivery time
      result.deliveryTime = Date.now() - startTime;

      // Determine overall success
      result.success = result.consoleLogged || result.webhookDelivered || result.n8nTriggered;

      if (result.success) {
        this.successCount++;
        console.log(`Notification sent successfully for profile ${profile.id}:`, {
          webhookDelivered: result.webhookDelivered,
          consoleLogged: result.consoleLogged,
          n8nTriggered: result.n8nTriggered,
          deliveryTime: result.deliveryTime
        });
      } else {
        this.failureCount++;
        console.error(`All notification methods failed for profile ${profile.id}`);
      }

      return result;

    } catch (error) {
      this.failureCount++;
      const deliveryTime = Date.now() - startTime;
      
      console.error('Notification service error:', error);
      
      return {
        success: false,
        webhookDelivered: false,
        consoleLogged: false,
        n8nTriggered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryTime,
        attempts: 1
      };
    }
  }

  /**
   * Build webhook payload from profile and recommendations
   */
  private buildWebhookPayload(
    profile: StudentProfile,
    recommendations: CareerRecommendation[],
    processingTime: number
  ): WebhookPayload {
    const averageMatchScore = recommendations.length > 0
      ? Math.round(recommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / recommendations.length)
      : 0;

    return {
      event: 'career_recommendations_generated',
      timestamp: new Date().toISOString(),
      student: {
        name: profile.personalInfo.name,
        grade: profile.personalInfo.grade,
        board: profile.personalInfo.board,
        location: profile.socioeconomicData.location,
        profileId: profile.id
      },
      recommendations: recommendations.map(rec => ({
        title: rec.title,
        matchScore: rec.matchScore,
        demandLevel: rec.prospects.demandLevel,
        averageSalary: rec.prospects.averageSalary.entry
      })),
      metadata: {
        totalRecommendations: recommendations.length,
        averageMatchScore,
        processingTime,
        language: profile.personalInfo.languagePreference
      },
      n8nWorkflow: this.config.enableN8nIntegration ? {
        triggerUrl: process.env.N8N_WEBHOOK_URL
      } : undefined
    };
  }

  /**
   * Log notification to console
   */
  private async logToConsole(payload: WebhookPayload): Promise<void> {
    const logEntry = {
      timestamp: payload.timestamp,
      event: payload.event,
      student: payload.student.name,
      grade: payload.student.grade,
      location: payload.student.location,
      recommendations: payload.recommendations.length,
      averageMatch: payload.metadata.averageMatchScore,
      topCareer: payload.recommendations[0]?.title || 'None',
      language: payload.metadata.language
    };

    console.log('🔔 CAREER RECOMMENDATION NOTIFICATION:', JSON.stringify(logEntry, null, 2));
    
    // Also log in a format suitable for log aggregation
    console.log(`NOTIFICATION_EVENT student="${payload.student.name}" grade="${payload.student.grade}" location="${payload.student.location}" recommendations=${payload.recommendations.length} avgMatch=${payload.metadata.averageMatchScore} topCareer="${payload.recommendations[0]?.title || 'None'}" language="${payload.metadata.language}"`);
  }

  /**
   * Deliver webhook to configured URL
   */
  private async deliverWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Career-Counseling-Webhook/1.0',
      'X-Event-Type': payload.event,
      'X-Timestamp': payload.timestamp
    };

    // Add webhook signature if secret is configured
    if (this.config.webhookSecret) {
      const signature = this.generateWebhookSignature(JSON.stringify(payload), this.config.webhookSecret);
      headers['X-Webhook-Signature'] = signature;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`Webhook delivery attempt ${attempt}/${this.config.retryAttempts} to ${this.config.webhookUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
        }

        console.log(`Webhook delivered successfully on attempt ${attempt}`);
        return;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown webhook error');
        console.error(`Webhook delivery attempt ${attempt} failed:`, lastError.message);

        if (attempt < this.config.retryAttempts) {
          await this.sleep(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Webhook delivery failed after all attempts');
  }

  /**
   * Trigger n8n workflow
   */
  private async triggerN8nWorkflow(payload: WebhookPayload): Promise<void> {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nUrl) {
      console.log('n8n webhook URL not configured, skipping n8n trigger');
      return;
    }

    try {
      console.log('Triggering n8n workflow:', n8nUrl);

      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Career-Counseling-n8n/1.0'
        },
        body: JSON.stringify({
          ...payload,
          source: 'ai-career-counseling',
          workflowTrigger: true
        })
      });

      if (!response.ok) {
        throw new Error(`n8n workflow trigger failed: ${response.status} ${response.statusText}`);
      }

      console.log('n8n workflow triggered successfully');

    } catch (error) {
      console.error('n8n workflow trigger failed:', error);
      throw error;
    }
  }

  /**
   * Generate webhook signature for security
   */
  private generateWebhookSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get notification service statistics
   */
  getStats(): {
    totalNotifications: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    config: NotificationConfig;
  } {
    return {
      totalNotifications: this.notificationCount,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: this.notificationCount > 0 ? (this.successCount / this.notificationCount) * 100 : 0,
  config: { ...(this.config as any), webhookSecret: this.config.webhookSecret ? '[REDACTED]' : undefined } as NotificationConfig
    };
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(): Promise<{ success: boolean; message: string; responseTime: number }> {
    if (!this.config.webhookUrl) {
      return {
        success: false,
        message: 'Webhook URL not configured',
        responseTime: 0
      };
    }

    const startTime = Date.now();

    try {
      const testPayload = {
        event: 'webhook_test',
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook from AI Career Counseling system'
      };

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Career-Counseling-Test/1.0'
        },
        body: JSON.stringify(testPayload)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `Webhook test successful (${response.status})`,
          responseTime
        };
      } else {
        return {
          success: false,
          message: `Webhook test failed: ${response.status} ${response.statusText}`,
          responseTime
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: `Webhook test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('NotificationService configuration updated');
  }
}