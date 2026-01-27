import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ResourceAlreadyExistsException extends HttpException {
  constructor(resource: string, field?: string, value?: string) {
    const message = field && value
      ? `${resource} with ${field} '${value}' already exists`
      : `${resource} already exists`;
    super(message, HttpStatus.CONFLICT);
  }
}

export class AccessDeniedException extends HttpException {
  constructor(resource: string, action = 'access') {
    super(`Access denied: Cannot ${action} ${resource}`, HttpStatus.FORBIDDEN);
  }
}

export class InvalidOperationException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}