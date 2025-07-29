/**
 * Tests for error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { 
  CustomError, 
  errorHandler, 
  notFound, 
  asyncHandler,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError
} from '../errorHandler';

// Mock Express objects
const mockRequest = (overrides = {}) => ({
  originalUrl: '/test',
  method: 'GET',
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-user-agent'),
  headers: {},
  ...overrides,
}) as unknown as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('CustomError', () => {
  test('should create error with default values', () => {
    const error = new CustomError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.isOperational).toBe(true);
  });

  test('should create error with custom values', () => {
    const error = new CustomError('Not found', 404, 'NOT_FOUND');
    
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.isOperational).toBe(true);
  });
});

describe('asyncHandler', () => {
  test('should handle successful async function', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = asyncHandler(asyncFn);
    
    const req = mockRequest();
    const res = mockResponse();
    
    await wrappedFn(req, res, mockNext);
    
    expect(asyncFn).toHaveBeenCalledWith(req, res, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should handle async function that throws error', async () => {
    const error = new Error('Async error');
    const asyncFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = asyncHandler(asyncFn);
    
    const req = mockRequest();
    const res = mockResponse();
    
    await wrappedFn(req, res, mockNext);
    
    expect(asyncFn).toHaveBeenCalledWith(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});

describe('notFound', () => {
  test('should create not found error', () => {
    const req = mockRequest({ originalUrl: '/nonexistent' });
    const res = mockResponse();
    
    notFound(req, res, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Route /nonexistent not found',
        statusCode: 404,
        code: 'ROUTE_NOT_FOUND',
      })
    );
  });
});

describe('errorHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should handle CustomError', () => {
    const error = new CustomError('Test error', 400, 'TEST_ERROR');
    const req = mockRequest();
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: 'Test error',
      },
      timestamp: expect.any(Date),
    });
  });

  test('should handle generic Error', () => {
    const error = new Error('Generic error');
    const req = mockRequest();
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Generic error',
      },
      timestamp: expect.any(Date),
    });
  });

  test('should handle CastError', () => {
    const error = { name: 'CastError', message: 'Cast error' } as any;
    const req = mockRequest();
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
      },
      timestamp: expect.any(Date),
    });
  });

  test('should handle ValidationError', () => {
    const error = { name: 'ValidationError', message: 'Validation failed' } as any;
    const req = mockRequest();
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
      },
      timestamp: expect.any(Date),
    });
  });

  test('should handle JWT errors', () => {
    const error = { name: 'JsonWebTokenError', message: 'Invalid token' } as any;
    const req = mockRequest();
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      },
      timestamp: expect.any(Date),
    });
  });

  test('should handle OpenAI errors', () => {
    const error = { message: 'OpenAI API error' } as any;
    const req = mockRequest();
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service temporarily unavailable',
      },
      timestamp: expect.any(Date),
    });
  });

  test('should include request ID if available', () => {
    const error = new CustomError('Test error');
    const req = mockRequest({ headers: { 'x-request-id': 'test-id' } });
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Test error',
      },
      timestamp: expect.any(Date),
      requestId: 'test-id',
    });
  });

  test('should log error details', () => {
    const error = new CustomError('Test error');
    const req = mockRequest();
    const res = mockResponse();
    
    errorHandler(error, req, res, mockNext);
    
    expect(consoleSpy).toHaveBeenCalledWith('Error:', expect.objectContaining({
      message: 'Test error',
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
    }));
  });
});

describe('Error helper functions', () => {
  test('createValidationError should create validation error', () => {
    const error = createValidationError('Invalid input', 'email');
    
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect((error as any).field).toBe('email');
  });

  test('createNotFoundError should create not found error', () => {
    const error = createNotFoundError('User');
    
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('RESOURCE_NOT_FOUND');
  });

  test('createUnauthorizedError should create unauthorized error', () => {
    const error = createUnauthorizedError('Invalid credentials');
    
    expect(error.message).toBe('Invalid credentials');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });
});