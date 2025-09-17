/**
 * Mock Server for Integration Tests
 * Sets up MSW (Mock Service Worker) for API mocking
 */

import { setupServer } from 'msw/node';
import { http, delay } from 'msw';
import { mockStudentProfile, mockCareerRecommendations, mockAnalyticsData } from './data';

export const handlers = [
  // Profile submission endpoint
  http.post('/api/profile', () => {
    return new Response(JSON.stringify({
      success: true,
      data: {
        recommendations: mockCareerRecommendations,
        profileId: 'test-profile-123',
        timestamp: new Date().toISOString(),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Profile submission with validation error
  http.post('/api/profile/invalid', () => {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid profile data',
        details: {
          name: ['Name is required'],
          grade: ['Grade must be selected'],
        },
      },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Profile submission with AI service error
  http.post('/api/profile/ai-error', () => {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service is temporarily unavailable',
      },
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Analytics endpoint
  http.get('/api/analytics', ({ request }) => {
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    const board = url.searchParams.get('board');
    const timeRange = url.searchParams.get('timeRange');

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...mockAnalyticsData,
        filters: { region, board, timeRange },
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Analytics endpoint with error
  http.get('/api/analytics/error', () => {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Notification webhook endpoint
  http.post('/api/notify', () => {
    return new Response(JSON.stringify({
      success: true,
      data: {
        notificationId: 'notification-123',
        status: 'sent',
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Notification webhook with error
  http.post('/api/notify/error', () => {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'NOTIFICATION_FAILED',
        message: 'Failed to send notification',
      },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Network timeout simulation
  http.post('/api/profile/timeout', async () => {
    await delay(35000); // Longer than typical timeout
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'TIMEOUT',
        message: 'Request timed out',
      },
    }), {
      status: 408,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Rate limit simulation
  http.post('/api/profile/rate-limit', () => {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      },
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }),
];

export const server = setupServer(...handlers);