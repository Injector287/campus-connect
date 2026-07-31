/**
 * Validates and sanitizes a string input, ensuring it is a non-empty string and not excessively long.
 * Protects against null, undefined, arrays, objects, NaN, Infinity, and empty strings.
 */
export function sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length > maxLength) return null; // Reject excessively large strings
    
    // Check for weird unicode tricks like null bytes or zero-width characters exclusively
    // eslint-disable-next-line no-control-regex
    if (/^[\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]*$/.test(trimmed)) return null;

    return trimmed;
}

/**
 * Validates a number is finite, within safe bounds, and optionally positive.
 */
export function sanitizeNumber(input, requirePositive = false) {
    const num = Number(input);
    if (!Number.isFinite(num)) return null;
    if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) return null;
    if (requirePositive && num < 0) return null;
    return num;
}

/**
 * Validates an email address format.
 */
export function sanitizeEmail(input) {
    const sanitized = sanitizeString(input, 255);
    if (!sanitized) return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) return null;
    
    return sanitized.toLowerCase();
}
