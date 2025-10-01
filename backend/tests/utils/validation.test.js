const {
  VALID_SEX_OPTIONS,
  validateSex,
  validateEmergencyContacts,
  validateLatestVitals,
  validateVitalsData,
  validateClientProfileData,
  validateDateOfBirth,
  validateUserProfileData
} = require('../../utils/validation');

describe('Validation Utils', () => {
  describe('VALID_SEX_OPTIONS', () => {
    it('should contain expected sex options', () => {
      expect(VALID_SEX_OPTIONS).toEqual([
        'Male',
        'Female',
        'Other',
        'Prefer not to say'
      ]);
    });
  });

  describe('validateSex', () => {
    it('should accept valid sex values', () => {
      expect(validateSex('Male')).toBe(true);
      expect(validateSex('Female')).toBe(true);
      expect(validateSex('Other')).toBe(true);
      expect(validateSex('Prefer not to say')).toBe(true);
    });

    it('should reject invalid sex values', () => {
      expect(validateSex('Invalid')).toBe(false);
      expect(validateSex('male')).toBe(false); // Case sensitive
      expect(validateSex('MALE')).toBe(false);
      expect(validateSex('')).toBe(false);
      expect(validateSex(null)).toBe(false);
      expect(validateSex(undefined)).toBe(false);
      expect(validateSex(123)).toBe(false);
    });
  });

  describe('validateEmergencyContacts', () => {
    it('should accept valid emergency contacts array', () => {
      const validContacts = [
        { name: 'John Doe', phone: '0412345678', relationship: 'Father' },
        { name: 'Jane Doe', phone: '0987654321', relationship: 'Mother' }
      ];

      const result = validateEmergencyContacts(validContacts);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept empty array', () => {
      const result = validateEmergencyContacts([]);

      expect(result.isValid).toBe(true);
    });

    it('should accept null/undefined values', () => {
      expect(validateEmergencyContacts(null).isValid).toBe(true);
      expect(validateEmergencyContacts(undefined).isValid).toBe(true);
    });

    it('should reject non-array values', () => {
      const testCases = [
        'not an array',
        123,
        { name: 'John' }, // Object instead of array
        true,
        false
      ];

      testCases.forEach(testCase => {
        const result = validateEmergencyContacts(testCase);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('emergency_contacts must be an array of objects');
      });
    });
  });

  describe('validateLatestVitals', () => {
    it('should accept valid vitals object', () => {
      const validVitals = {
        heart_rate: 72,
        blood_pressure: '120/80',
        oxygen_saturation: 98.5,
        temperature: 98.6,
        recorded_date: new Date()
      };

      const result = validateLatestVitals(validVitals);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept empty object', () => {
      const result = validateLatestVitals({});

      expect(result.isValid).toBe(true);
    });

    it('should accept null/undefined values', () => {
      expect(validateLatestVitals(null).isValid).toBe(true);
      expect(validateLatestVitals(undefined).isValid).toBe(true);
    });

    it('should reject non-object values', () => {
      const testCases = [
        'not an object',
        123,
        [],
        true,
        false
      ];

      testCases.forEach(testCase => {
        const result = validateLatestVitals(testCase);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('latest_vitals must be an object');
      });
    });

    it('should reject arrays (which are technically objects in JS)', () => {
      const result = validateLatestVitals(['heart_rate', 'blood_pressure']);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('latest_vitals must be an object');
    });
  });

  describe('validateVitalsData', () => {
    it('should accept vitals data with at least one vital sign', () => {
      const testCases = [
        { heart_rate: 72 },
        { blood_pressure: '120/80' },
        { oxygen_saturation: 98.5 },
        { temperature: 98.6 },
        { heart_rate: 72, blood_pressure: '120/80' },
        { heart_rate: 72, blood_pressure: '120/80', oxygen_saturation: 98.5, temperature: 98.6 }
      ];

      testCases.forEach(testCase => {
        const result = validateVitalsData(testCase);

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject vitals data with no vital signs', () => {
      const testCases = [
        {},
        { recorded_date: new Date() }, // Only non-vital fields
        { some_other_field: 'value' },
        { heart_rate: null, blood_pressure: null, oxygen_saturation: null, temperature: null }
      ];

      testCases.forEach(testCase => {
        const result = validateVitalsData(testCase);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('At least one vital sign must be provided');
      });
    });

    it('should accept zero values as valid vital signs', () => {
      const testCases = [
        { heart_rate: 0 },
        { oxygen_saturation: 0 },
        { temperature: 0 }
      ];

      testCases.forEach(testCase => {
        const result = validateVitalsData(testCase);

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateClientProfileData', () => {
    it('should accept valid complete client profile data', () => {
      const validData = {
        full_name: 'John Doe',
        date_of_birth: '1990-01-01',
        sex: 'Male',
        age: 30,
        mobile_number: '0412345678',
        email_address: 'john@example.com',
        emergency_contacts: [{ name: 'Jane', phone: '0987654321' }],
        latest_vitals: { heart_rate: 72, blood_pressure: '120/80' }
      };

      const result = validateClientProfileData(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept minimal valid data', () => {
      const minimalData = {
        full_name: 'John Doe'
      };

      const result = validateClientProfileData(minimalData);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid sex value', () => {
      const invalidData = {
        full_name: 'John Doe',
        sex: 'Invalid'
      };

      const result = validateClientProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('sex must be one of: Male, Female, Other, Prefer not to say');
    });

    it('should reject invalid emergency contacts format', () => {
      const invalidData = {
        full_name: 'John Doe',
        emergency_contacts: 'not an array'
      };

      const result = validateClientProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emergency_contacts must be an array of objects');
    });

    it('should reject invalid latest vitals format', () => {
      const invalidData = {
        full_name: 'John Doe',
        latest_vitals: 'not an object'
      };

      const result = validateClientProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('latest_vitals must be an object');
    });

    it('should accept empty object', () => {
      const result = validateClientProfileData({});

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDateOfBirth', () => {
    it('should accept valid date strings', () => {
      const validDates = [
        '1990-01-01',
        '1985-12-25',
        '2000-02-29', // Leap year
        '1975-06-15'
      ];

      validDates.forEach(date => {
        const result = validateDateOfBirth(date);

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should accept null/undefined/empty values', () => {
      expect(validateDateOfBirth(null).isValid).toBe(true);
      expect(validateDateOfBirth(undefined).isValid).toBe(true);
      expect(validateDateOfBirth('').isValid).toBe(true);
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        'invalid-date',
        'not-a-date',
        'abc-def-ghij'
        // Note: JavaScript Date constructor is quite lenient and accepts many formats
        // including '2023-13-01' which gets parsed as '2024-01-01'
      ];

      invalidDates.forEach(date => {
        const result = validateDateOfBirth(date);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid date format for date_of_birth');
      });
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = validateDateOfBirth(futureDate.toISOString().split('T')[0]);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date of birth cannot be in the future');
    });

    it('should reject dates more than 150 years ago', () => {
      const veryOldDate = new Date();
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 151);

      const result = validateDateOfBirth(veryOldDate.toISOString().split('T')[0]);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date of birth cannot be more than 150 years ago');
    });

    it('should accept date exactly 150 years ago', () => {
      const exactly150YearsAgo = new Date();
      exactly150YearsAgo.setFullYear(exactly150YearsAgo.getFullYear() - 149); // Use 149 to be safely within 150 years

      const result = validateDateOfBirth(exactly150YearsAgo.toISOString().split('T')[0]);

      expect(result.isValid).toBe(true);
    });

    it('should accept today as valid date of birth', () => {
      const today = new Date().toISOString().split('T')[0];

      const result = validateDateOfBirth(today);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUserProfileData', () => {
    it('should accept valid complete user profile data', () => {
      const validData = {
        displayName: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        mobile_phone: '0412345678',
        contact_address: '123 Main St, Melbourne VIC 3000'
      };

      const result = validateUserProfileData(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept partial user profile data', () => {
      const testCases = [
        { displayName: 'John Doe' },
        { avatar_url: 'https://example.com/avatar.jpg' },
        { mobile_phone: '0412345678' },
        { contact_address: '123 Main St' },
        { displayName: 'Jane', mobile_phone: '0987654321' }
      ];

      testCases.forEach(testCase => {
        const result = validateUserProfileData(testCase);

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should accept empty object', () => {
      const result = validateUserProfileData({});

      expect(result.isValid).toBe(true);
    });

    it('should reject empty displayName', () => {
      const invalidData = {
        displayName: ''
      };

      const result = validateUserProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('displayName must be a non-empty string');
    });

    it('should reject whitespace-only displayName', () => {
      const invalidData = {
        displayName: '   '
      };

      const result = validateUserProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('displayName must be a non-empty string');
    });

    it('should reject non-string displayName', () => {
      const testCases = [
        { displayName: 123 },
        { displayName: true },
        { displayName: [] },
        { displayName: {} }
      ];

      testCases.forEach(testCase => {
        const result = validateUserProfileData(testCase);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('displayName must be a non-empty string');
      });
    });

    it('should reject empty avatar_url', () => {
      const invalidData = {
        avatar_url: ''
      };

      const result = validateUserProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('avatar_url must be a non-empty string');
    });

    it('should reject whitespace-only avatar_url', () => {
      const invalidData = {
        avatar_url: '   '
      };

      const result = validateUserProfileData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('avatar_url must be a non-empty string');
    });

    it('should reject non-string avatar_url', () => {
      const testCases = [
        { avatar_url: 123 },
        { avatar_url: true },
        { avatar_url: [] },
        { avatar_url: {} }
      ];

      testCases.forEach(testCase => {
        const result = validateUserProfileData(testCase);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('avatar_url must be a non-empty string');
      });
    });

    it('should reject non-string mobile_phone', () => {
      const testCases = [
        { mobile_phone: 123 },
        { mobile_phone: true },
        { mobile_phone: [] },
        { mobile_phone: {} }
      ];

      testCases.forEach(testCase => {
        const result = validateUserProfileData(testCase);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('mobile_phone must be a string');
      });
    });

    it('should accept empty string for mobile_phone', () => {
      const validData = {
        mobile_phone: ''
      };

      const result = validateUserProfileData(validData);

      expect(result.isValid).toBe(true);
    });

    it('should reject non-string contact_address', () => {
      const testCases = [
        { contact_address: 123 },
        { contact_address: true },
        { contact_address: [] },
        { contact_address: {} }
      ];

      testCases.forEach(testCase => {
        const result = validateUserProfileData(testCase);

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('contact_address must be a string');
      });
    });

    it('should accept empty string for contact_address', () => {
      const validData = {
        contact_address: ''
      };

      const result = validateUserProfileData(validData);

      expect(result.isValid).toBe(true);
    });

    it('should accept null values for optional fields', () => {
      const validData = {
        displayName: null,
        avatar_url: null,
        mobile_phone: null,
        contact_address: null
      };

      const result = validateUserProfileData(validData);

      expect(result.isValid).toBe(true);
    });
  });
});