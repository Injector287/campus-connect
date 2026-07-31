import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeNumber, sanitizeEmail } from './validation';

describe('Validation Utility', () => {
    describe('sanitizeString', () => {
        it('should pass normal strings', () => {
            expect(sanitizeString('hello')).toBe('hello');
            expect(sanitizeString('  hello  ')).toBe('hello');
        });

        it('should reject non-strings', () => {
            expect(sanitizeString(null)).toBeNull();
            expect(sanitizeString(undefined)).toBeNull();
            expect(sanitizeString(123)).toBeNull();
            expect(sanitizeString({})).toBeNull();
            expect(sanitizeString([])).toBeNull();
            expect(sanitizeString(NaN)).toBeNull();
        });

        it('should reject empty or whitespace-only strings', () => {
            expect(sanitizeString('')).toBeNull();
            expect(sanitizeString('   ')).toBeNull();
            expect(sanitizeString('\t\n')).toBeNull();
        });

        it('should reject strings exceeding max length', () => {
            const longString = 'a'.repeat(1001);
            expect(sanitizeString(longString)).toBeNull();
            expect(sanitizeString('a'.repeat(1000))).toBe('a'.repeat(1000));
        });

        it('should handle zero-width and weird unicode appropriately', () => {
            // String consisting ONLY of zero-width space
            expect(sanitizeString('\u200B')).toBeNull();
            // Mixed should pass
            expect(sanitizeString('hello \u200B world')).toBe('hello \u200B world');
        });
    });

    describe('sanitizeNumber', () => {
        it('should pass valid numbers', () => {
            expect(sanitizeNumber(123)).toBe(123);
            expect(sanitizeNumber('123')).toBe(123);
            expect(sanitizeNumber(0)).toBe(0);
            expect(sanitizeNumber(-1)).toBe(-1);
        });

        it('should reject invalid boundaries', () => {
            expect(sanitizeNumber(NaN)).toBeNull();
            expect(sanitizeNumber(Infinity)).toBeNull();
            expect(sanitizeNumber(-Infinity)).toBeNull();
            expect(sanitizeNumber(Number.MAX_SAFE_INTEGER + 10)).toBeNull();
            expect(sanitizeNumber(Number.MIN_SAFE_INTEGER - 10)).toBeNull();
        });

        it('should enforce positivity when requested', () => {
            expect(sanitizeNumber(-1, true)).toBeNull();
            expect(sanitizeNumber(0, true)).toBe(0);
            expect(sanitizeNumber(1, true)).toBe(1);
        });
    });

    describe('sanitizeEmail', () => {
        it('should pass valid emails', () => {
            expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
            expect(sanitizeEmail('  TEST@example.COM  ')).toBe('test@example.com');
        });

        it('should reject invalid emails', () => {
            expect(sanitizeEmail('test')).toBeNull();
            expect(sanitizeEmail('test@')).toBeNull();
            expect(sanitizeEmail('@example.com')).toBeNull();
            expect(sanitizeEmail('test@example')).toBeNull();
        });
    });
});
