/**
 * Backend API Integration Tests
 * Tests all API endpoints with realistic scenarios
 */

import request from 'supertest';
import express from 'express';
import { setupTestApp } from './testSetup';

describe('API Endpoints Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  describe('Profile Submission Endpoint', () => {
    const validProfile = {
      personalInfo: {
        name: 'Integration Test Student',
        grade: '12',
        board: 'CBSE',
        languagePreference: 'english',
        age: 17,
        gender: 'female',
        category: 'General',
        physicallyDisabled: false,
      },
      academicData: {
        interests: ['Science', 'Technology'],
        subjects: ['Physics', 'Mathematics', 'Computer Science'],
        performance: 'excellent',
        favoriteSubjects: ['Mathematics'],
        extracurricularActivities: ['Coding Club'],
      },
      socioeconomicData: {
        location: 'Mumbai, Maharashtra',
        familyBackground: 'Engineering family background',
        economicFactors: ['Middle class family'],
        ruralUrban: 'urban',
        internetAccess: true,
        deviceAccess: ['Laptop', 'Smartphone'],
        householdSize: 4,
      },
      familyIncome: '10-20l',
      aspirations: {
        preferredCareers: ['Software Engineering'],
        preferredLocations: ['Mumbai'],
        salaryExpectations: 'high',
        workLifeBalance: 'medium',
      },
      constraints: {
        financialConstraints: false,
        locationConstraints: [],
        familyExpectations: 'Engineering career expected',
        timeConstraints: 'None',
      },
    };

    it('should successfully process valid profile submission', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send(validProfile)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          recommendations: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              matchScore: expect.any(Number),
              salaryRange: expect.objectContaining({
                entry: expect.any(Number),
                mid: expect.any(Number),
                senior: expect.any(Number),
              }),
              educationPath: expect.objectContaining({
                degree: expect.any(String),
                duration: expect.any(String),
                topColleges: expect.any(Array),
              }),
            }),
          ]),
          profileId: expect.any(String),
          timestamp: expect.any(String),
        },
      });

      // Verify exactly 3 recommendations
      expect(response.body.data.recommendations).toHaveLength(3);

      // Verify match scores are reasonable
      response.body.data.recommendations.forEach((rec: any) => {
        expect(rec.matchScore).toBeGreaterThanOrEqual(0);
        expect(rec.matchScore).toBeLessThanOrEqual(100);
      });
    });

    it('should handle validation errors properly', async () => {
      const invalidProfile = {
        personalInfo: {
          // Missing required fields
          grade: '12',
        },
        academicData: {
          interests: [], // Empty array should fail validation
        },
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidProfile)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.any(Object),
        },
      });
    });

    it('should handle AI service failures gracefully', async () => {
      // Mock AI service failure by sending a profile that triggers error
      const profileTriggeringError = {
        ...validProfile,
        personalInfo: {
          ...validProfile.personalInfo,
          name: 'TRIGGER_AI_ERROR', // Special name to trigger mock error
        },
      };

      const response = await request(app)
        .post('/api/profile')
        .send(profileTriggeringError)
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: expect.any(String),
        },
      });
    });

    it('should process profiles in different languages', async () => {
      const hindiProfile = {
        ...validProfile,
        personalInfo: {
          ...validProfile.personalInfo,
          name: 'हिंदी परीक्षण छात्र',
          languagePreference: 'hindi',
        },
      };

      const response = await request(app)
        .post('/api/profile')
        .send(hindiProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(3);
    });

    it('should handle concurrent profile submissions', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => {
        const profile = {
          ...validProfile,
          personalInfo: {
            ...validProfile.personalInfo,
            name: `Concurrent Student ${i + 1}`,
          },
        };

        return request(app)
          .post('/api/profile')
          .send(profile);
      });

      const responses = await Promise.all(concurrentRequests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.recommendations).toHaveLength(3);
      });
    });
  });

  describe('Analytics Endpoint', () => {
    beforeEach(async () => {
      // Submit some test data for analytics
      const testProfiles = [
        {
          ...validProfile,
          personalInfo: { ...validProfile.personalInfo, name: 'Analytics Test 1', gender: 'male' },
        },
        {
          ...validProfile,
          personalInfo: { ...validProfile.personalInfo, name: 'Analytics Test 2', gender: 'female' },
        },
      ];

      for (const profile of testProfiles) {
        await request(app)
          .post('/api/profile')
          .send(profile);
      }
    });

    it('should return analytics data without filters', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          overview: {
            totalStudents: expect.any(Number),
            totalRecommendations: expect.any(Number),
            activeRegions: expect.any(Number),
            averageMatchScore: expect.any(Number),
          },
          demographics: {
            byGender: expect.any(Object),
            byCategory: expect.any(Object),
            byBoard: expect.any(Object),
          },
          trends: {
            popularCareers: expect.any(Array),
            regionalDistribution: expect.any(Array),
          },
        },
      });
    });

    it('should filter analytics data by region', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .query({ region: 'Maharashtra' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should filter analytics data by board', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .query({ board: 'CBSE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should filter analytics data by time range', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .query({ timeRange: '7d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle multiple filters simultaneously', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .query({
          region: 'Maharashtra',
          board: 'CBSE',
          timeRange: '30d',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle invalid filter values gracefully', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .query({ region: 'InvalidRegion' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return empty or default data for invalid filters
    });
  });

  describe('Notification Webhook Endpoint', () => {
    const validWebhookPayload = {
      event: 'profile_submitted',
      studentData: {
        name: 'Webhook Test Student',
        grade: '12',
        board: 'CBSE',
      },
      recommendations: [
        {
          title: 'Software Engineer',
          matchScore: 95,
        },
      ],
      timestamp: new Date().toISOString(),
      contactInfo: {
        notifyParents: true,
        notifyCounselors: false,
      },
    };

    it('should accept valid webhook notifications', async () => {
      const response = await request(app)
        .post('/api/notify')
        .send(validWebhookPayload)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          notificationId: expect.any(String),
          status: 'sent',
        },
      });
    });

    it('should validate webhook payload structure', async () => {
      const invalidPayload = {
        event: 'invalid_event',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/notify')
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should handle webhook delivery failures gracefully', async () => {
      const payloadTriggeringError = {
        ...validWebhookPayload,
        event: 'TRIGGER_WEBHOOK_ERROR', // Special event to trigger mock error
      };

      const response = await request(app)
        .post('/api/notify')
        .send(payloadTriggeringError)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOTIFICATION_FAILED',
          message: expect.any(String),
        },
      });
    });

    it('should support different notification types', async () => {
      const notificationTypes = [
        'profile_submitted',
        'recommendations_generated',
        'report_downloaded',
      ];

      for (const eventType of notificationTypes) {
        const payload = {
          ...validWebhookPayload,
          event: eventType,
        };

        const response = await request(app)
          .post('/api/notify')
          .send(payload)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.stringContaining('JSON'),
        },
      });
    });

    it('should handle requests with missing Content-Type', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send(validProfile)
        .unset('Content-Type')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle extremely large payloads', async () => {
      const largeProfile = {
        ...validProfile,
        academicData: {
          ...validProfile.academicData,
          achievements: 'A'.repeat(10000), // Very long string
        },
      };

      const response = await request(app)
        .post('/api/profile')
        .send(largeProfile)
        .expect(413); // Payload too large

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: expect.any(String),
        },
      });
    });

    it('should handle requests with invalid characters', async () => {
      const profileWithInvalidChars = {
        ...validProfile,
        personalInfo: {
          ...validProfile.personalInfo,
          name: 'Test\x00Student', // Null character
        },
      };

      const response = await request(app)
        .post('/api/profile')
        .send(profileWithInvalidChars)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on profile submissions', async () => {
      const requests = [];

      // Send many requests quickly to trigger rate limit
      for (let i = 0; i < 20; i++) {
        const profile = {
          ...validProfile,
          personalInfo: {
            ...validProfile.personalInfo,
            name: `Rate Limit Test ${i}`,
          },
        };

        requests.push(
          request(app)
            .post('/api/profile')
            .send(profile)
        );
      }

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limited responses should have proper error structure
      rateLimitedResponses.forEach(response => {
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: expect.any(String),
          },
        });
      });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send(validProfile);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/profile')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
      });
    });

    it('should include service dependencies status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toMatchObject({
        database: expect.any(String),
        ai: expect.any(String),
      });
    });
  });
});