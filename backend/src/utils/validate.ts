export class ValidationError extends Error {
  public status: number;
  public details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.details = details;
  }
}

export function validateRequired(data: Record<string, any>, fields: string[]): void {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors[field] = `${field} is required`;
    }
  }
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
}

export function validateNumber(value: any, field: string, options: { min?: number; max?: number } = {}): number {
  const num = parseFloat(value);
  if (isNaN(num)) throw new ValidationError(`${field} must be a number`, { [field]: 'Must be a number' });
  if (options.min !== undefined && num < options.min) {
    throw new ValidationError(`${field} must be at least ${options.min}`, { [field]: `Must be at least ${options.min}` });
  }
  if (options.max !== undefined && num > options.max) {
    throw new ValidationError(`${field} must be at most ${options.max}`, { [field]: `Must be at most ${options.max}` });
  }
  return num;
}

export function validateEnum(value: any, field: string, allowedValues: string[]): string {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${field} must be one of: ${allowedValues.join(', ')}`, { [field]: `Invalid value` });
  }
  return value;
}

export function validateArray(value: any, field: string, options: { minLength?: number } = {}): any[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`, { [field]: 'Must be an array' });
  if (options.minLength && value.length < options.minLength) {
    throw new ValidationError(`${field} must have at least ${options.minLength} items`, { [field]: `Must have at least ${options.minLength} items` });
  }
  return value;
}

export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim()
    .slice(0, 2000); // Max length
}
