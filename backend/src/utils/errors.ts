/**
 * CoffeePOS - Structured Error Classes
 *
 * Application-level error classes for consistent error handling.
 * Each error carries a status code, machine-readable code, and optional details.
 */

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details: Record<string, any>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string | number) {
    super(
      `${entity}${id ? ` #${id}` : ''} not found`,
      404,
      'NOT_FOUND',
      { entity, id }
    );
    this.name = 'NotFoundError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
    this.name = 'BusinessLogicError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN', {});
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}
