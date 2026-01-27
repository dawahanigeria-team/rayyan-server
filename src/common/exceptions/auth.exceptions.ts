import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid credentials') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountNotFoundException extends HttpException {
  constructor(message = 'Account not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class AccountAlreadyExistsException extends HttpException {
  constructor(message = 'Account already exists') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message = 'Invalid or expired token') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message = 'Token has expired') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class EmailNotVerifiedException extends HttpException {
  constructor(message = 'Email address not verified') {
    super(message, HttpStatus.FORBIDDEN);
  }
}