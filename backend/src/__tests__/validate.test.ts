import {
  ValidationError,
  validateRequired,
  validateNumber,
  validateEnum,
  validateArray,
  sanitizeString,
} from '../utils/validate';

describe('Validation Utilities', () => {
  // ============================================
  // ValidationError
  // ============================================

  describe('ValidationError', () => {
    it('creates error with message and details', () => {
      const error = new ValidationError('Test error', { field: 'invalid' });
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ValidationError');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'invalid' });
    });

    it('defaults to empty details', () => {
      const error = new ValidationError('Test error');
      expect(error.details).toEqual({});
    });

    it('is an instance of Error', () => {
      const error = new ValidationError('Test error');
      expect(error).toBeInstanceOf(Error);
    });
  });

  // ============================================
  // validateRequired
  // ============================================

  describe('validateRequired', () => {
    it('passes when all required fields are present', () => {
      expect(() => {
        validateRequired({ name: 'John', email: 'john@example.com' }, ['name', 'email']);
      }).not.toThrow();
    });

    it('passes with extra fields beyond required', () => {
      expect(() => {
        validateRequired({ name: 'John', email: 'j@e.com', age: 30 }, ['name']);
      }).not.toThrow();
    });

    it('throws when a required field is missing (undefined)', () => {
      expect(() => {
        validateRequired({ name: 'John' }, ['name', 'email']);
      }).toThrow(ValidationError);
    });

    it('throws when a required field is null', () => {
      expect(() => {
        validateRequired({ name: 'John', email: null }, ['name', 'email']);
      }).toThrow(ValidationError);
    });

    it('throws when a required field is empty string', () => {
      expect(() => {
        validateRequired({ name: 'John', email: '' }, ['name', 'email']);
      }).toThrow(ValidationError);
    });

    it('includes field names in error details', () => {
      try {
        validateRequired({}, ['name', 'email']);
        fail('Should have thrown');
      } catch (e) {
        const error = e as ValidationError;
        expect(error.details).toHaveProperty('name');
        expect(error.details).toHaveProperty('email');
      }
    });

    it('allows zero as a valid value', () => {
      expect(() => {
        validateRequired({ count: 0 }, ['count']);
      }).not.toThrow();
    });

    it('allows false as a valid value', () => {
      expect(() => {
        validateRequired({ active: false }, ['active']);
      }).not.toThrow();
    });
  });

  // ============================================
  // validateNumber
  // ============================================

  describe('validateNumber', () => {
    it('returns parsed number for valid numeric string', () => {
      expect(validateNumber('42', 'age')).toBe(42);
    });

    it('returns number for numeric input', () => {
      expect(validateNumber(42, 'age')).toBe(42);
    });

    it('handles float strings', () => {
      expect(validateNumber('3.14', 'price')).toBeCloseTo(3.14);
    });

    it('throws on NaN input', () => {
      expect(() => validateNumber('abc', 'age')).toThrow(ValidationError);
    });

    it('throws on empty string', () => {
      expect(() => validateNumber('', 'age')).toThrow(ValidationError);
    });

    it('respects min option', () => {
      expect(() => validateNumber(5, 'age', { min: 10 })).toThrow(ValidationError);
    });

    it('passes when value equals min', () => {
      expect(validateNumber(10, 'age', { min: 10 })).toBe(10);
    });

    it('respects max option', () => {
      expect(() => validateNumber(100, 'age', { max: 50 })).toThrow(ValidationError);
    });

    it('passes when value equals max', () => {
      expect(validateNumber(50, 'age', { max: 50 })).toBe(50);
    });

    it('respects both min and max', () => {
      expect(validateNumber(25, 'age', { min: 0, max: 100 })).toBe(25);
    });

    it('throws when below min with min and max', () => {
      expect(() => validateNumber(-1, 'age', { min: 0, max: 100 })).toThrow(ValidationError);
    });

    it('throws when above max with min and max', () => {
      expect(() => validateNumber(101, 'age', { min: 0, max: 100 })).toThrow(ValidationError);
    });
  });

  // ============================================
  // validateEnum
  // ============================================

  describe('validateEnum', () => {
    const allowed = ['pending', 'confirmed', 'cancelled'];

    it('returns value when it is in allowed list', () => {
      expect(validateEnum('pending', 'status', allowed)).toBe('pending');
    });

    it('returns value for last allowed item', () => {
      expect(validateEnum('cancelled', 'status', allowed)).toBe('cancelled');
    });

    it('throws when value is not in allowed list', () => {
      expect(() => validateEnum('unknown', 'status', allowed)).toThrow(ValidationError);
    });

    it('throws for empty string when not in allowed list', () => {
      expect(() => validateEnum('', 'status', allowed)).toThrow(ValidationError);
    });

    it('error message includes allowed values', () => {
      try {
        validateEnum('bad', 'status', allowed);
        fail('Should have thrown');
      } catch (e) {
        const error = e as ValidationError;
        expect(error.message).toContain('pending');
        expect(error.message).toContain('confirmed');
        expect(error.message).toContain('cancelled');
      }
    });
  });

  // ============================================
  // validateArray
  // ============================================

  describe('validateArray', () => {
    it('returns the array when valid', () => {
      const arr = [1, 2, 3];
      expect(validateArray(arr, 'items')).toBe(arr);
    });

    it('accepts empty array', () => {
      expect(validateArray([], 'items')).toEqual([]);
    });

    it('throws for non-array (string)', () => {
      expect(() => validateArray('not-array', 'items')).toThrow(ValidationError);
    });

    it('throws for non-array (object)', () => {
      expect(() => validateArray({}, 'items')).toThrow(ValidationError);
    });

    it('throws for non-array (number)', () => {
      expect(() => validateArray(42, 'items')).toThrow(ValidationError);
    });

    it('throws for null', () => {
      expect(() => validateArray(null, 'items')).toThrow(ValidationError);
    });

    it('respects minLength option', () => {
      expect(() => validateArray([], 'items', { minLength: 1 })).toThrow(ValidationError);
    });

    it('passes when length equals minLength', () => {
      expect(validateArray([1], 'items', { minLength: 1 })).toEqual([1]);
    });

    it('passes when length exceeds minLength', () => {
      expect(validateArray([1, 2, 3], 'items', { minLength: 2 })).toEqual([1, 2, 3]);
    });
  });

  // ============================================
  // sanitizeString
  // ============================================

  describe('sanitizeString', () => {
    it('returns trimmed string', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('removes HTML angle brackets', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('removes both < and >', () => {
      expect(sanitizeString('a<b>c')).toBe('abc');
    });

    it('truncates to 2000 characters', () => {
      const longString = 'a'.repeat(3000);
      expect(sanitizeString(longString)).toHaveLength(2000);
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeString(42 as any)).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });

    it('handles empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('preserves normal characters', () => {
      expect(sanitizeString('Hello World 123!')).toBe('Hello World 123!');
    });
  });
});
