/**
 * Test Setup for Backend Integration Tests
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import middleware
import { errorHandler, notFound } from '../../middleware/errorHandler';
import { requestLogger } from '../../middleware/logging';
import { securityHeaders } from '../../middleware/security';

// Import controllers
import { profileController } from '../../controllers/profileController';
import { analyticsController } from '../../controllers/analyticsController';
import { notificationController } from '../../controllers/notificationController';

// Mock services for testing
import { MockOpenAIClient } from '../../services/mockOpenAIClient';
import { RecommendationEngine } from '../../services/recommendationEngine';
import { AnalyticsService } from '../../services/analyticsService';
import { NotificationService } from '../../services/notificationService';

export async function setupTestApp(): Promise<express.Application> {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // Request logging
  app.use(requestLogger);

  // Initialize mock services
  const mockOpenAI = new MockOpenAIClient();
  const recommendationEngine = new RecommendationEngine(mockOpenAI);
  const analyticsService = new AnalyticsService();
  const notificationService = new NotificationService();

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected',
        ai: mockOpenAI.isHealthy() ? 'connected' : 'disconnected',
      },
    });
  });

  // API routes
  app.post('/api/profile', async (req, res, next) => {
    try {
      await profileController(req, res, recommendationEngine, analyticsService);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/analytics', async (req, res, next) => {
    try {
      await analyticsController(req, res, analyticsService);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/notify', async (req, res, next) => {
    try {
      await notificationController(req, res, notificationService);
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// Test data helpers
export const createTestProfile = (overrides: any = {}) => {
  return {
    personalInfo: {
      name: 'Test Student',
      grade: '12',
      board: 'CBSE',
      languagePreference: 'english',
      age: 17,
      gender: 'female',
      category: 'General',
      physicallyDisabled: false,
      ...overrides.personalInfo,
    },
    academicData: {
      interests: ['Science', 'Technology'],
      subjects: ['Physics', 'Mathematics'],
      performance: 'excellent',
      favoriteSubjects: ['Mathematics'],
      extracurricularActivities: ['Coding Club'],
      ...overrides.academicData,
    },
    socioeconomicData: {
      location: 'Mumbai, Maharashtra',
      familyBackground: 'Engineering family',
      economicFactors: ['Middle class'],
      ruralUrban: 'urban',
      internetAccess: true,
      deviceAccess: ['Laptop'],
      householdSize: 4,
      ...overrides.socioeconomicData,
    },
    familyIncome: '10-20l',
    aspirations: {
      preferredCareers: ['Software Engineering'],
      preferredLocations: ['Mumbai'],
      salaryExpectations: 'high',
      workLifeBalance: 'medium',
      ...overrides.aspirations,
    },
    constraints: {
      financialConstraints: false,
      locationConstraints: [],
      familyExpectations: 'Engineering career',
      timeConstraints: 'None',
      ...overrides.constraints,
    },
    ...overrides,
  };
};

export const createTestWebhookPayload = (overrides: any = {}) => {
  return {
    event: 'profile_submitted',
    studentData: {
      name: 'Test Student',
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
    ...overrides,
  };
};

// Test utilities
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const expectValidRecommendation = (recommendation: any) => {
  expect(recommendation).toMatchObject({
    id: expect.any(String),
    title: expect.any(String),
    description: expect.any(String),
    matchScore: expect.any(Number),
    salaryRange: {
      entry: expect.any(Number),
      mid: expect.any(Number),
      senior: expect.any(Number),
    },
    educationPath: {
      degree: expect.any(String),
      duration: expect.any(String),
      topColleges: expect.any(Array),
      entranceExams: expect.any(Array),
    },
    skills: expect.any(Array),
    jobMarket: {
      demand: expect.any(String),
      growth: expect.any(String),
      opportunities: expect.any(Number),
    },
  });

  // Validate match score range
  expect(recommendation.matchScore).toBeGreaterThanOrEqual(0);
  expect(recommendation.matchScore).toBeLessThanOrEqual(100);

  // Validate salary ranges
  expect(recommendation.salaryRange.entry).toBeGreaterThan(0);
  expect(recommendation.salaryRange.mid).toBeGreaterThan(recommendation.salaryRange.entry);
  expect(recommendation.salaryRange.senior).toBeGreaterThan(recommendation.salaryRange.mid);
};

export const expectValidAnalyticsData = (data: any) => {
  expect(data).toMatchObject({
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
  });

  // Validate overview metrics
  expect(data.overview.totalStudents).toBeGreaterThanOrEqual(0);
  expect(data.overview.totalRecommendations).toBeGreaterThanOrEqual(0);
  expect(data.overview.averageMatchScore).toBeGreaterThanOrEqual(0);
  expect(data.overview.averageMatchScore).toBeLessThanOrEqual(100);
};