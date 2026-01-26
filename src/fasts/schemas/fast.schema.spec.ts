import { FastSchema } from './fast.schema';
import { Types } from 'mongoose';

describe('Fast Schema Validation', () => {
  describe('Date format validation', () => {
    it('should accept valid DD-MM-YYYY format', () => {
      const validDates = ['01-01-2024', '15-06-2023', '31-12-2025'];
      
      validDates.forEach(date => {
        const isValid = /^\d{2}-\d{2}-\d{4}$/.test(date);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        '2024-01-01', // YYYY-MM-DD
        '1-1-2024',   // Single digits
        '01/01/2024', // Wrong separator
        '01-1-2024',  // Mixed format
        'invalid',    // Non-date string
      ];
      
      invalidDates.forEach(date => {
        const isValid = /^\d{2}-\d{2}-\d{4}$/.test(date);
        expect(isValid).toBe(false);
      });
    });

    it('should validate actual date values', () => {
      const validateDate = (value: string) => {
        const [day, month, year] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        );
      };

      expect(validateDate('01-01-2024')).toBe(true);
      expect(validateDate('29-02-2024')).toBe(true); // Leap year
      expect(validateDate('31-12-2023')).toBe(true);
      
      expect(validateDate('32-01-2024')).toBe(false); // Invalid day
      expect(validateDate('01-13-2024')).toBe(false); // Invalid month
      expect(validateDate('29-02-2023')).toBe(false); // Not a leap year
    });
  });

  describe('Schema structure', () => {
    it('should have correct schema paths', () => {
      const paths = FastSchema.paths;
      
      expect(paths.name).toBeDefined();
      expect(paths.description).toBeDefined();
      expect(paths.status).toBeDefined();
      expect(paths.user).toBeDefined();
      expect(paths.createdAt).toBeDefined();
      expect(paths.updatedAt).toBeDefined();
    });

    it('should have correct indexes', () => {
      const indexes = FastSchema.indexes();
      
      // Should have compound index for user + name uniqueness
      const compoundIndex = indexes.find(index => 
        index[0].user === 1 && index[0].name === 1 && index[1].unique === true
      );
      expect(compoundIndex).toBeDefined();
      
      // Should have user index for efficient queries
      const userIndex = indexes.find(index => 
        index[0].user === 1 && !index[0].name
      );
      expect(userIndex).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      expect(FastSchema.options.timestamps).toBe(true);
    });
  });
});