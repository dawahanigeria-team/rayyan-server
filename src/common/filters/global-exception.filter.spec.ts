import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { InvalidCredentialsException, ResourceNotFoundException } from '../exceptions';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/api/auth/login',
      method: 'POST',
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HTTP Exception handling', () => {
    it('should format InvalidCredentialsException correctly', () => {
      const exception = new InvalidCredentialsException('Invalid email or password');
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email or password',
        timestamp: expect.any(String),
        path: '/api/auth/login',
        error: 'INVALID_CREDENTIALS',
      });
    });

    it('should format ResourceNotFoundException correctly', () => {
      const exception = new ResourceNotFoundException('Fast', '123');
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Fast with id '123' not found",
        timestamp: expect.any(String),
        path: '/api/auth/login',
        error: 'RESOURCE_NOT_FOUND',
      });
    });

    it('should format validation errors correctly', () => {
      const exception = new HttpException(
        {
          message: ['email must be a valid email', 'password is too short'],
          error: 'Bad Request',
          statusCode: 400,
        },
        HttpStatus.BAD_REQUEST,
      );
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        timestamp: expect.any(String),
        path: '/api/auth/login',
        error: 'VALIDATION_FAILED',
        errors: ['email must be a valid email', 'password is too short'],
      });
    });

    it('should format generic HttpException correctly', () => {
      const exception = new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
        timestamp: expect.any(String),
        path: '/api/auth/login',
        error: 'INTERNAL_SERVER_ERROR',
      });
    });
  });

  describe('Non-HTTP Exception handling', () => {
    it('should format generic Error correctly', () => {
      const exception = new Error('Database connection failed');
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database connection failed',
        timestamp: expect.any(String),
        path: '/api/auth/login',
        error: 'INTERNAL_SERVER_ERROR',
      });
    });

    it('should format unknown exception correctly', () => {
      const exception = 'Unknown error';
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: expect.any(String),
        path: '/api/auth/login',
        error: 'INTERNAL_SERVER_ERROR',
      });
    });
  });

  describe('Response format consistency', () => {
    it('should always include required fields', () => {
      const exception = new InvalidCredentialsException();
      
      filter.catch(exception, mockHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      
      // Check all required fields are present
      expect(responseCall).toHaveProperty('statusCode');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('timestamp');
      expect(responseCall).toHaveProperty('path');
      
      // Check timestamp format (ISO string)
      expect(responseCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should not include errors array when not applicable', () => {
      const exception = new InvalidCredentialsException();
      
      filter.catch(exception, mockHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).not.toHaveProperty('errors');
    });

    it('should include errors array only for validation failures', () => {
      const exception = new HttpException(
        { message: ['validation error 1', 'validation error 2'] },
        HttpStatus.BAD_REQUEST,
      );
      
      filter.catch(exception, mockHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('errors');
      expect(responseCall.errors).toEqual(['validation error 1', 'validation error 2']);
    });
  });
});