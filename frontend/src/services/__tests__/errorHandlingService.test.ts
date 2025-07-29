/**
 * Error Handling Service Tests
 */

import { errorHandlingService, ErrorHandlingService } from '../errorHandlingService';
import { ApiError } from '../../utils/apiClient';

// Mock fetch for error reporting
global.fetch = jest.fn();

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
});

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;

  beforeEach(() => {
    service = new ErrorHandlingService({
      enableReporting: false,
      enableConsoleLogging: false,
      enableUserNotification: false,
    });
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('creates error report with correct structure', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };
      
      const report = service.handleError(error, context);
      
      expect(report).toMatchObject({
        error,
        context: expect.objectContaining({
          component: 'TestComponent',
          url: expect.any(String),
          userAgent: expect.any(String),
        }),
        severity: expect.any(String),
        handled: true,
        retryable: expect.any(Boolean),
        timestamp: expect.any(Date),
        id: expect.any(String),
      });
    });

    it('determines severity correctly', () => {
      const criticalError = new Error('Critical system failure');
      const networkError = new Error('Network connection failed');
      const validationError = new Error('Validation failed');
      
      const criticalReport = service.handleError(criticalError);
      const networkReport = service.handleError(networkError);
      const validationReport = service.handleError(validationError);
      
      expect(criticalReport.severity).toBe('critical');
      expect(networkReport.severity).toBe('high');
      expect(validationReport.severity).toBe('low');
    });

    it('determines retryable status correctly', () => {
      const networkError = new Error('Network timeout');
      const validationError = new Error('Invalid input');
      
      const networkReport = service.handleError(networkError);
      const validationReport = service.handleError(validationError);
      
      expect(networkReport.retryable).toBe(true);
      expect(validationReport.retryable).toBe(false);
    });

    it('stores error reports', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      service.handleError(error1);
      service.handleError(error2);
      
      const stats = service.getErrorStats();
      expect(stats.totalErrors).toBe(2);
    });

    it('limits stored error reports', () => {
      const limitedService = new ErrorHandlingService({ maxReports: 2 });
      
      limitedService.handleError(new Error('Error 1'));
      limitedService.handleError(new Error('Error 2'));
      limitedService.handleError(new Error('Error 3'));
      
      const stats = limitedService.getErrorStats();
      expect(stats.totalErrors).toBe(2);
    });
  });

  describe('handleApiError', () => {
    it('handles API errors with correct context', () => {
      const apiError = new Error('API Error') as ApiError;
      apiError.status = 500;
      apiError.code = 'INTERNAL_ERROR';
      
      const report = service.handleApiError(apiError, '/api/profile', 'POST');
      
      expect(report.context.action).toBe('API_POST');
      expect(report.context.component).toBe('API:/api/profile');
      expect(report.severity).toBe('high');
    });

    it('determines API error severity correctly', () => {
      const serverError = new Error('Server Error') as ApiError;
      serverError.status = 500;
      
      const clientError = new Error('Client Error') as ApiError;
      clientError.status = 400;
      
      const aiError = new Error('AI Error') as ApiError;
      aiError.code = 'AI_SERVICE_UNAVAILABLE';
      
      const serverReport = service.handleApiError(serverError, '/api/test', 'GET');
      const clientReport = service.handleApiError(clientError, '/api/test', 'GET');
      const aiReport = service.handleApiError(aiError, '/api/test', 'GET');
      
      expect(serverReport.severity).toBe('high');
      expect(clientReport.severity).toBe('medium');
      expect(aiReport.severity).toBe('high');
    });
  });

  describe('handleValidationError', () => {
    it('handles validation errors correctly', () => {
      const validationError = new Error('Required field missing');
      
      const report = service.handleValidationError(
        validationError, 
        'ProfileForm', 
        'name'
      );
      
      expect(report.context.action).toBe('FORM_VALIDATION');
      expect(report.context.component).toBe('ProfileForm:name');
      expect(report.severity).toBe('low');
    });
  });

  describe('handleAIError', () => {
    it('handles AI errors correctly', () => {
      const aiError = new Error('AI processing failed');
      
      const report = service.handleAIError(aiError, 'recommendation');
      
      expect(report.context.action).toBe('AI_PROCESSING');
      expect(report.context.component).toBe('AI:recommendation');
      expect(report.severity).toBe('high');
    });
  });

  describe('getErrorStats', () => {
    it('returns correct error statistics', () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Validation error');
      const error3 = new Error('Network error');
      
      service.handleError(error1, {}, { severity: 'high' });
      service.handleError(error2, {}, { severity: 'low' });
      service.handleError(error3, {}, { severity: 'high' });
      
      const stats = service.getErrorStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType.Error).toBe(3);
      expect(stats.errorsBySeverity.high).toBe(2);
      expect(stats.errorsBySeverity.low).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });
  });

  describe('getErrorReports', () => {
    beforeEach(() => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Mock Date.now to control timestamps
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(oneHourAgo.getTime())
        .mockReturnValueOnce(now.getTime());
      
      service.handleError(new Error('Old error'), { component: 'ComponentA' }, { severity: 'high' });
      service.handleError(new Error('Recent error'), { component: 'ComponentB' }, { severity: 'low' });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('filters by severity', () => {
      const highSeverityReports = service.getErrorReports({ severity: 'high' });
      const lowSeverityReports = service.getErrorReports({ severity: 'low' });
      
      expect(highSeverityReports).toHaveLength(1);
      expect(lowSeverityReports).toHaveLength(1);
      expect(highSeverityReports[0].error.message).toBe('Old error');
      expect(lowSeverityReports[0].error.message).toBe('Recent error');
    });

    it('filters by component', () => {
      const componentAReports = service.getErrorReports({ component: 'ComponentA' });
      const componentBReports = service.getErrorReports({ component: 'ComponentB' });
      
      expect(componentAReports).toHaveLength(1);
      expect(componentBReports).toHaveLength(1);
    });

    it('filters by date', () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      const recentReports = service.getErrorReports({ since: thirtyMinutesAgo });
      
      expect(recentReports).toHaveLength(1);
      expect(recentReports[0].error.message).toBe('Recent error');
    });

    it('limits results', () => {
      const limitedReports = service.getErrorReports({ limit: 1 });
      
      expect(limitedReports).toHaveLength(1);
      expect(limitedReports[0].error.message).toBe('Recent error');
    });
  });

  describe('clearErrorReports', () => {
    it('clears all error reports', () => {
      service.handleError(new Error('Error 1'));
      service.handleError(new Error('Error 2'));
      
      expect(service.getErrorStats().totalErrors).toBe(2);
      
      service.clearErrorReports();
      
      expect(service.getErrorStats().totalErrors).toBe(0);
    });
  });

  describe('error reporting', () => {
    it('sends error reports to endpoint when enabled', async () => {
      const reportingService = new ErrorHandlingService({
        enableReporting: true,
        reportingEndpoint: '/api/errors',
      });

      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const error = new Error('Test error');
      reportingService.handleError(error);

      // Wait for async reporting
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test error'),
      });
    });

    it('handles reporting failures gracefully', async () => {
      const reportingService = new ErrorHandlingService({
        enableReporting: true,
        reportingEndpoint: '/api/errors',
        enableConsoleLogging: true,
      });

      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const error = new Error('Test error');
      reportingService.handleError(error);

      // Wait for async reporting
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to report error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('user notification', () => {
    it('dispatches custom event for user notification', () => {
      const notificationService = new ErrorHandlingService({
        enableUserNotification: true,
      });

      const error = new Error('Test error');
      notificationService.handleError(error, { component: 'TestComponent' });

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error-notification',
          detail: expect.objectContaining({
            error,
            severity: expect.any(String),
            retryable: expect.any(Boolean),
            context: expect.objectContaining({
              component: 'TestComponent',
            }),
          }),
        })
      );
    });
  });
});