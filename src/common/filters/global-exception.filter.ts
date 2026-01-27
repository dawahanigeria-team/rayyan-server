import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  error?: string; // Machine-readable error code
  errors?: string[]; // Validation errors array
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | undefined;
    let validationErrors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Generate machine-readable error code based on exception type and status
      errorCode = this.generateErrorCode(exception, status);

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as any;

        if (Array.isArray(body.message)) {
          // Validation errors
          message = 'Validation failed';
          validationErrors = body.message;
          errorCode = 'VALIDATION_FAILED';
        } else {
          message = body.message || body.error || message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'INTERNAL_SERVER_ERROR';
    } else {
      // Unknown exception type
      errorCode = 'INTERNAL_SERVER_ERROR';
    }

    // Build consistent error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add optional fields only if they exist
    if (errorCode) {
      errorResponse.error = errorCode;
    }

    if (validationErrors && validationErrors.length > 0) {
      errorResponse.errors = validationErrors;
    }

    // Log error details (without sensitive information)
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        errorCode,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    );

    response.status(status).json(errorResponse);
  }

  private generateErrorCode(exception: HttpException, status: number): string {
    // Generate machine-readable error codes based on exception type and status
    const exceptionName = exception.constructor.name;

    switch (exceptionName) {
      // Authentication exceptions
      case 'UnauthorizedException':
        return 'UNAUTHORIZED';
      case 'InvalidCredentialsException':
        return 'INVALID_CREDENTIALS';
      case 'InvalidTokenException':
        return 'INVALID_TOKEN';
      case 'TokenExpiredException':
        return 'TOKEN_EXPIRED';

      // Access control exceptions
      case 'ForbiddenException':
        return 'FORBIDDEN';
      case 'AccessDeniedException':
        return 'ACCESS_DENIED';
      case 'EmailNotVerifiedException':
        return 'EMAIL_NOT_VERIFIED';

      // Resource exceptions
      case 'NotFoundException':
        return 'NOT_FOUND';
      case 'ResourceNotFoundException':
        return 'RESOURCE_NOT_FOUND';
      case 'AccountNotFoundException':
        return 'ACCOUNT_NOT_FOUND';

      // Conflict exceptions
      case 'ConflictException':
        return 'CONFLICT';
      case 'ResourceAlreadyExistsException':
        return 'RESOURCE_ALREADY_EXISTS';
      case 'AccountAlreadyExistsException':
        return 'ACCOUNT_ALREADY_EXISTS';

      // Validation exceptions
      case 'BadRequestException':
        return 'BAD_REQUEST';
      case 'InvalidOperationException':
        return 'INVALID_OPERATION';
      case 'UnprocessableEntityException':
        return 'UNPROCESSABLE_ENTITY';

      // Rate limiting
      case 'TooManyRequestsException':
        return 'TOO_MANY_REQUESTS';
      default:
        // Fallback to HTTP status code mapping
        switch (status) {
          case HttpStatus.BAD_REQUEST:
            return 'BAD_REQUEST';
          case HttpStatus.UNAUTHORIZED:
            return 'UNAUTHORIZED';
          case HttpStatus.FORBIDDEN:
            return 'FORBIDDEN';
          case HttpStatus.NOT_FOUND:
            return 'NOT_FOUND';
          case HttpStatus.CONFLICT:
            return 'CONFLICT';
          case HttpStatus.UNPROCESSABLE_ENTITY:
            return 'UNPROCESSABLE_ENTITY';
          case HttpStatus.TOO_MANY_REQUESTS:
            return 'TOO_MANY_REQUESTS';
          case HttpStatus.INTERNAL_SERVER_ERROR:
            return 'INTERNAL_SERVER_ERROR';
          default:
            return 'UNKNOWN_ERROR';
        }
    }
  }
}