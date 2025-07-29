/**
 * Profile Controller for handling student profile processing and career recommendations
 */

import { Request, Response } from 'express';
import { StudentProfile, StudentProfileValidator, StudentProfileUtils } from '../types/studentProfile';
import { RecommendationEngine, RecommendationEngineConfig } from '../services/recommendationEngine';
import { NotificationService } from '../services/notificationService';
import { AnalyticsService } from '../services/analyticsService';
import { CustomError } from '../middleware/errorHandler';

export interface ProfileProcessingRequest extends Request {
  body: Partial<StudentProfile>;
}

export interface ProfileProcessingResponse {
  success: boolean;
  data?: {
    profileId: string;
    recommendations: any[];
    context: any;
    metadata: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export class ProfileController {
  private recommendationEngine: RecommendationEngine;
  private notificationService: NotificationService;
  private analyticsService: AnalyticsService;

  constructor() {
    // Initialize recommendation engine with configuration
    const useOpenAI = process.env.NODE_ENV === 'production' && !!process.env.OPENAI_API_KEY;
    const config: RecommendationEngineConfig = {
      useOpenAI,
      maxRecommendations: 3,
      minMatchScore: parseInt(process.env.MIN_MATCH_SCORE || '60'),
      enableDatabaseEnrichment: true
    };

    if (useOpenAI && process.env.OPENAI_API_KEY) {
      config.openAIConfig = {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000')
      };
    }

    this.recommendationEngine = new RecommendationEngine(config);
    this.notificationService = new NotificationService();
    this.analyticsService = new AnalyticsService();
    console.log('ProfileController initialized with recommendation engine and notification service');
  }

  /**
   * Process student profile and generate career recommendations
   * POST /api/profile
   */
  processProfile = async (req: ProfileProcessingRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      console.log('Processing student profile submission');
      
      // Step 1: Validate and sanitize the profile data
      const validatedProfile = await this.validateAndSanitizeProfile(req.body);
      
      // Step 2: Generate career recommendations
      const recommendationResult = await this.recommendationEngine.generateRecommendations(validatedProfile);
      
      // Step 3: Log the successful processing
      const processingTime = Date.now() - startTime;
      console.log(`Profile processed successfully in ${processingTime}ms for profile: ${validatedProfile.id}`);
      
      // Step 4: Prepare response
      const response: ProfileProcessingResponse = {
        success: true,
        data: {
          profileId: validatedProfile.id,
          recommendations: recommendationResult.recommendations,
          context: recommendationResult.context,
          metadata: {
            ...recommendationResult.metadata,
            totalProcessingTime: processingTime
          }
        },
        timestamp: new Date().toISOString()
      };

      // Step 5: Log analytics data (anonymized) - don't await to avoid blocking response
      this.logAnalyticsData(validatedProfile, recommendationResult.recommendations);

      // Step 6: Send notification (don't let notification failures affect response)
      this.sendNotificationAsync(validatedProfile, recommendationResult.recommendations, processingTime);

      res.status(200).json(response);
      
    } catch (error) {
      console.error('Error processing profile:', error);
      
      const processingTime = Date.now() - startTime;
      
      if (error instanceof CustomError) {
        const response: ProfileProcessingResponse = {
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
        const response: ProfileProcessingResponse = {
          success: false,
          error: {
            code: 'PROFILE_PROCESSING_ERROR',
            message: 'Failed to process student profile',
            details: process.env.NODE_ENV === 'development' ? error : undefined
          },
          timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
      }
      
      console.log(`Profile processing failed in ${processingTime}ms`);
    }
  };

  /**
   * Get profile processing statistics
   * GET /api/profile/stats
   */
  getProfileStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const engineStats = this.recommendationEngine.getStats();
      
      const stats = {
        engine: engineStats,
        server: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting profile stats:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to retrieve profile statistics'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Test the recommendation engine connectivity
   * GET /api/profile/test
   */
  testEngine = async (req: Request, res: Response): Promise<void> => {
    try {
      const testResult = await this.recommendationEngine.testEngine();
      
      res.status(200).json({
        success: true,
        data: {
          engineStatus: testResult ? 'healthy' : 'unhealthy',
          message: testResult ? 'Recommendation engine is working correctly' : 'Recommendation engine test failed'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error testing engine:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'ENGINE_TEST_ERROR',
          message: 'Failed to test recommendation engine'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Validate and sanitize student profile data
   */
  private async validateAndSanitizeProfile(profileData: Partial<StudentProfile>): Promise<StudentProfile> {
    // Step 1: Basic structure validation
    if (!profileData || typeof profileData !== 'object') {
      throw new CustomError(
        'Invalid profile data format',
        400,
        'INVALID_PROFILE_FORMAT'
      );
    }

    // Step 2: Generate profile ID and timestamp if not provided
    const profile: StudentProfile = {
      id: profileData.id || StudentProfileUtils.generateProfileId(),
      timestamp: profileData.timestamp || new Date(),
      ...profileData
    } as StudentProfile;

    // Step 3: Validate profile structure
    const validationResult = StudentProfileValidator.validateStudentProfile(profile);
    
    if (!validationResult.isValid) {
      const error = new CustomError(
        'Profile validation failed',
        400,
        'PROFILE_VALIDATION_ERROR'
      );
      (error as any).details = {
        errors: validationResult.errors,
        warnings: validationResult.warnings
      };
      throw error;
    }

    // Step 4: Sanitize profile data
    const sanitizedProfile = StudentProfileUtils.sanitizeProfile(profile);

    // Step 5: Additional security checks for sensitive data
    this.validateSensitiveData(sanitizedProfile);

    console.log(`Profile validated and sanitized: ${sanitizedProfile.id} (${StudentProfileUtils.getProfileSummary(sanitizedProfile)})`);
    
    return sanitizedProfile;
  }

  /**
   * Validate sensitive socioeconomic data
   */
  private validateSensitiveData(profile: StudentProfile): void {
    // Check for potentially harmful or inappropriate content
    const sensitiveFields = [
      profile.personalInfo.name,
      profile.socioeconomicData.familyBackground,
      profile.socioeconomicData.location
    ];

    for (const field of sensitiveFields) {
      if (field && typeof field === 'string') {
        // Basic content validation (can be extended with more sophisticated checks)
        if (field.length > 500) {
          throw new CustomError(
            'Field content too long',
            400,
            'CONTENT_TOO_LONG'
          );
        }

        // Check for potentially malicious content
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /data:text\/html/i
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(field)) {
            throw new CustomError(
              'Invalid content detected',
              400,
              'INVALID_CONTENT'
            );
          }
        }
      }
    }

    // Validate family income format
    if (profile.familyIncome && typeof profile.familyIncome === 'string') {
      const validIncomePatterns = [
        /below \d+ lakh/i,
        /\d+-\d+ lakh/i,
        /above \d+ lakh/i,
        /\d+ crore/i
      ];

      const isValidIncome = validIncomePatterns.some(pattern => 
        pattern.test(profile.familyIncome)
      );

      if (!isValidIncome) {
        console.warn(`Unusual family income format: ${profile.familyIncome}`);
      }
    }
  }

  /**
   * Log anonymized analytics data for trend analysis
   */
  private async logAnalyticsData(profile: StudentProfile, recommendations: any[]): Promise<void> {
    try {
      // Prepare processing metadata
      const processingMetadata = {
        aiModel: recommendations[0]?.metadata?.aiModel || 'unknown',
        processingTime: Date.now() - profile.timestamp.getTime(),
        generatedAt: new Date().toISOString()
      };

      // Use the analytics service to collect anonymized data
      await this.analyticsService.collectAnalytics(
        profile,
        recommendations,
        processingMetadata
      );

      console.log('Analytics data collected successfully:', {
        profileId: profile.id,
        recommendationCount: recommendations.length,
        avgMatchScore: recommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / recommendations.length,
        processingTime: processingMetadata.processingTime
      });

    } catch (error) {
      console.error('Error collecting analytics data:', error);
      // Don't throw error as analytics logging shouldn't break the main flow
    }
  }

  /**
   * Send notification asynchronously (don't block response)
   */
  private sendNotificationAsync(
    profile: StudentProfile, 
    recommendations: any[], 
    processingTime: number
  ): void {
    // Send notification in background without blocking the response
    setImmediate(async () => {
      try {
        console.log(`Sending notification for profile: ${profile.id}`);
        
        const result = await this.notificationService.notifyCareerRecommendations(
          profile,
          recommendations,
          processingTime
        );

        if (result.success) {
          console.log(`Notification sent successfully for profile ${profile.id}:`, {
            webhookDelivered: result.webhookDelivered,
            consoleLogged: result.consoleLogged,
            n8nTriggered: result.n8nTriggered,
            deliveryTime: result.deliveryTime
          });
        } else {
          console.warn(`Notification failed for profile ${profile.id}:`, result.error);
        }

      } catch (error) {
        console.error(`Notification error for profile ${profile.id}:`, error);
        // Don't throw error as this shouldn't affect the main profile processing flow
      }
    });
  }

  /**
   * Health check for the profile controller
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const engineTest = await this.recommendationEngine.testEngine();
      const notificationStats = this.notificationService.getStats();
      
      res.status(200).json({
        status: 'healthy',
        services: {
          recommendationEngine: engineTest ? 'healthy' : 'unhealthy',
          database: 'healthy', // Assuming database is healthy if we reach this point
          ai: engineTest ? 'healthy' : 'degraded',
          notifications: 'healthy'
        },
        stats: {
          notificationStats: {
            totalNotifications: notificationStats.totalNotifications,
            successRate: notificationStats.successRate
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Service health check failed',
        timestamp: new Date().toISOString()
      });
    }
  };
}