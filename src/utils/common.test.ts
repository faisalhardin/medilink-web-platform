import { describe, it, expect } from 'vitest';
import { normalizeIndonesianPhone } from './common';

describe('normalizeIndonesianPhone', () => {
  describe('should normalize phone numbers starting with 0', () => {
    it('should convert 0 prefix to +62', () => {
      expect(normalizeIndonesianPhone('8123456789')).toBe('08123456789');
    });

    it('should handle phone numbers with spaces', () => {
      expect(normalizeIndonesianPhone('812 3456 7890')).toBe('081234567890');
    });

    it('should handle phone numbers with dashes', () => {
      expect(normalizeIndonesianPhone('812-3456-7890')).toBe('081234567890');
    });

    it('should handle phone numbers with both spaces and dashes', () => {
      expect(normalizeIndonesianPhone('812-3456 7890')).toBe('081234567890');
    });

    it('should handle short phone numbers', () => {
      expect(normalizeIndonesianPhone('812345678')).toBe('0812345678');
    });

    it('should handle long phone numbers', () => {
      expect(normalizeIndonesianPhone('812345678901')).toBe('0812345678901');
    });
  });

  describe('should normalize phone numbers starting with 62', () => {
    it('should convert 62 prefix to +62', () => {
      expect(normalizeIndonesianPhone('628123456789')).toBe('08123456789');
    });

    it('should handle phone numbers with spaces', () => {
      expect(normalizeIndonesianPhone('62 812 3456 7890')).toBe('081234567890');
    });

    it('should handle phone numbers with dashes', () => {
      expect(normalizeIndonesianPhone('62-812-3456-7890')).toBe('081234567890');
    });

    it('should handle phone numbers with both spaces and dashes', () => {
      expect(normalizeIndonesianPhone('62-812 3456 7890')).toBe('081234567890');
    });
  });

  describe('should handle phone numbers already starting with +62', () => {
    it('should keep +62 prefix unchanged', () => {
      expect(normalizeIndonesianPhone('+628123456789')).toBe('08123456789');
    });

    it('should remove spaces from +62 numbers', () => {
      expect(normalizeIndonesianPhone('+62 812 3456 7890')).toBe('081234567890');
    });

    it('should remove dashes from +62 numbers', () => {
      expect(normalizeIndonesianPhone('+62-812-3456-7890')).toBe('081234567890');
    });

    it('should remove both spaces and dashes from +62 numbers', () => {
      expect(normalizeIndonesianPhone('+62-812 3456-7890')).toBe('081234567890');
    });
  });

  describe('should handle edge cases', () => {
    it('should handle empty string', () => {
      expect(normalizeIndonesianPhone('')).toBe('');
    });

    it('should handle string with only spaces and dashes', () => {
      expect(normalizeIndonesianPhone('   ---   ')).toBe('');
    });

    it('should handle phone numbers without 0, 62, or +62 prefix', () => {
      expect(normalizeIndonesianPhone('8123456789')).toBe('08123456789');
    });

    it('should handle phone numbers with multiple spaces', () => {
      expect(normalizeIndonesianPhone('0812   3456   7890')).toBe('081234567890');
    });

    it('should handle phone numbers with multiple dashes', () => {
      expect(normalizeIndonesianPhone('0812---3456---7890')).toBe('081234567890');
    });

    it('should handle phone numbers starting with 0 and containing 62', () => {
      expect(normalizeIndonesianPhone('0628123456789')).toBe('');
    });

    it('should handle phone numbers starting with 62 followed by 0', () => {
      expect(normalizeIndonesianPhone('6208123456789')).toBe('');
    });
  });

  describe('should handle real-world phone number formats', () => {
    it('should normalize common format: 0812-3456-7890', () => {
      expect(normalizeIndonesianPhone('0812-3456-7890')).toBe('081234567890');
    });

    it('should normalize format with spaces: 0812 3456 7890', () => {
      expect(normalizeIndonesianPhone('0812 3456 7890')).toBe('081234567890');
    });

    it('should normalize international format: +62 812 3456 7890', () => {
      expect(normalizeIndonesianPhone('+62 812 3456 7890')).toBe('081234567890');
    });

    it('should normalize format without separators: 081234567890', () => {
      expect(normalizeIndonesianPhone('081234567890')).toBe('081234567890');
    });

    it('should normalize format: 62 812 3456 7890', () => {
      expect(normalizeIndonesianPhone('62 812 3456 7890')).toBe('081234567890');
    });
  });
});

