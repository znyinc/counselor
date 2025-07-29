/**
 * Mock Server for Integration Tests
 * Sets up MSW (Mock Service Worker) for API mocking
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { mockStudentProfile, mockCareerRecommendations, mockAnalyticsData } from './data';

export const handlers = [
  // Profile submission endpoint
  rest.post('/api/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          recommendations: mockCareerRecommendations,
          profileId: 'test-profile-123',
          timestamp: new Date().toISOString(),
        },
      })
    );
  }),

  // Profile submission with validation error
  rest.post('/api/profile/invalid', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile data',
          details: {
            name: ['Name is required'],
            grade: ['Grade must be selected'],
          },
        },
      })
    );
  }),

  // Profile submission with AI service error
  rest.post('/api/profile/ai-error', (req, res, ctx) => {
    return res(
      ctx.status(503),
      ctx.json({
        success: false,
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'AI service is temporarily unavailable',
        },
      })
    );
  }),

  // Analytics endpoint
  rest.get('/api/analytics', (req, res, ctx) => {
    const region = req.url.searchParams.get('region');
    const board = req.url.searchParams.get('board');
    const timeRange = req.url.searchParams.get('timeRange');

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          ...mockAnalyticsData,
          filters: { region, board, timeRange },
        },
      })
    );
  }),

  // Analytics endpoint with error
  rest.get('/api/analytics/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      })
    );
  }),

  // Notification webhook endpoint
  rest.post('/api/notify', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          notificationId: 'notification-123',
          status: 'sent',
        },
      })
    );
  }),

  // Notification webhook with error
  rest.post('/api/notify/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: {
          code: 'NOTIFICATION_FAILED',
          message: 'Failed to send notification',
        },
      })
    );
  }),

  // Network timeout simulation
  rest.post('/api/profile/timeout', (req, res, ctx) => {
    return res(
      ctx.delay(35000), // Longer than typical timeout
      ctx.status(408),
      ctx.json({
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out',
        },
      })
    );
  }),

  // Rate limit simulation
  rest.post('/api/profile/rate-limit', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
        },
      })
    );
  }),
];

export const server = setupServer(...handlers);