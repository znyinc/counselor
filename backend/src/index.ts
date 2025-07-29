import express from 'express';
import dotenv from 'dotenv';
import { DataController } from './controllers/dataController';
import { ProfileController } from './controllers/profileController';
import { NotificationController } from './controllers/notificationController';
import { AnalyticsController } from './controllers/analyticsController';

// Import middleware
import { configureCors, apiCorsOptions, healthCheckCorsOptions } from './middleware/cors';
import { configureHelmet, apiRateLimit, sanitizeInput, requestSizeLimit, securityHeaders } from './middleware/security';
import { requestId, requestLogger, errorLogger, apiUsageLogger, performanceMonitor } from './middleware/logging';
import { errorHandler, notFound, asyncHandler } from './middleware/errorHandler';
import { 
  validateStudentProfile, 
  validateSearchQuery, 
  validateId, 
  validateCollegeSearch,
  validateCareerSearch,
  validateScholarshipSearch,
  handleValidationErrors 
} from './middleware/validation';
import {
  validateProfileSubmission,
  validateContentSecurity,
  validateProfileSize,
  sanitizeProfileData,
  profileSubmissionRateLimit,
  logProfileSubmission
} from './middleware/profileValidation';
import {
  validateNotificationRequest,
  validateWebhookSignature,
  validateWebhookContentType,
  validateWebhookPayloadSize,
  logWebhookRequest,
  webhookRateLimit,
  validateN8nWebhook
} from './middleware/webhookValidation';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize controllers
const dataController = new DataController();
const profileController = new ProfileController();
const notificationController = new NotificationController();
const analyticsController = new AnalyticsController();

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Global middleware (order matters!)
app.use(requestId);
app.use(requestLogger);
app.use(performanceMonitor);
app.use(configureHelmet());
app.use(securityHeaders);
app.use(requestSizeLimit);

// CORS configuration
app.use('/health', healthCheckCorsOptions);
app.use('/api', configureCors());
app.use(configureCors()); // Default CORS for other routes

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization
app.use(sanitizeInput);

// API usage logging
app.use(apiUsageLogger);

// Rate limiting for API routes
app.use('/api', apiRateLimit);

// Health check route (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Career Counseling API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes with validation
app.get('/api/colleges', 
  validateSearchQuery(),
  handleValidationErrors,
  asyncHandler(dataController.getColleges)
);

app.get('/api/careers', 
  validateSearchQuery(),
  handleValidationErrors,
  asyncHandler(dataController.getCareers)
);

app.get('/api/scholarships', 
  validateSearchQuery(),
  handleValidationErrors,
  asyncHandler(dataController.getScholarships)
);

app.get('/api/colleges/search', 
  validateCollegeSearch(),
  handleValidationErrors,
  asyncHandler(dataController.searchColleges)
);

app.get('/api/careers/search', 
  validateCareerSearch(),
  handleValidationErrors,
  asyncHandler(dataController.searchCareers)
);

app.get('/api/careers/:careerId/colleges', 
  validateId('careerId'),
  handleValidationErrors,
  asyncHandler(dataController.getCollegesForCareer)
);

app.get('/api/scholarships/applicable', 
  validateScholarshipSearch(),
  handleValidationErrors,
  asyncHandler(dataController.getApplicableScholarships)
);

app.get('/api/statistics', 
  asyncHandler(dataController.getStatistics)
);

// Profile processing endpoints
app.post('/api/profile',
  profileSubmissionRateLimit,
  logProfileSubmission,
  validateProfileSize,
  validateContentSecurity,
  sanitizeProfileData,
  validateProfileSubmission(),
  handleValidationErrors,
  asyncHandler(profileController.processProfile)
);

app.get('/api/profile/stats',
  asyncHandler(profileController.getProfileStats)
);

app.get('/api/profile/test',
  asyncHandler(profileController.testEngine)
);

app.get('/api/profile/health',
  asyncHandler(profileController.healthCheck)
);

// Notification/Webhook endpoints
app.post('/api/notify',
  webhookRateLimit,
  logWebhookRequest,
  validateWebhookContentType,
  validateWebhookPayloadSize,
  validateN8nWebhook,
  validateNotificationRequest(),
  handleValidationErrors,
  asyncHandler(notificationController.sendNotification)
);

app.get('/api/notify/test',
  asyncHandler(notificationController.testWebhook)
);

app.get('/api/notify/stats',
  asyncHandler(notificationController.getNotificationStats)
);

app.get('/api/notify/health',
  asyncHandler(notificationController.healthCheck)
);

app.post('/api/notify/receive',
  webhookRateLimit,
  logWebhookRequest,
  validateWebhookContentType,
  validateWebhookPayloadSize,
  validateWebhookSignature,
  asyncHandler(notificationController.receiveWebhook)
);

// Analytics endpoints\napp.get('/api/analytics',\n  asyncHandler(analyticsController.getAnalytics)\n);\n\napp.get('/api/analytics/dashboard',\n  asyncHandler(analyticsController.getDashboard)\n);\n\napp.get('/api/analytics/stats',\n  asyncHandler(analyticsController.getAnalyticsStats)\n);\n\napp.get('/api/analytics/export',\n  asyncHandler(analyticsController.exportAnalytics)\n);\n\napp.delete('/api/analytics/cleanup',\n  asyncHandler(analyticsController.cleanupAnalytics)\n);\n\napp.get('/api/analytics/health',\n  asyncHandler(analyticsController.healthCheck)\n);\n\n// Error handling middleware (must be last)
app.use(errorLogger);
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`⚡ API available at: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

export default app;