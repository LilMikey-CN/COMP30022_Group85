const {
  calculateAge,
  formatClientProfileResponse,
  prepareClientProfileData,
  updateClientProfileData,
  filterUsersBySearch
} = require('../../utils/clientProfile');

describe('Client Profile Utils', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly from date of birth string', () => {
      const birthDate = '1990-01-01';
      const age = calculateAge(birthDate);

      // Age should be around 33-34 (depending on current date)
      expect(age).toBeGreaterThanOrEqual(33);
      expect(age).toBeLessThanOrEqual(35);
    });

    it('should calculate age correctly from Date object', () => {
      const birthDate = new Date('1985-06-15');
      const age = calculateAge(birthDate);

      expect(age).toBeGreaterThanOrEqual(38);
      expect(age).toBeLessThanOrEqual(40);
    });

    it('should calculate age correctly from Firebase Timestamp object', () => {
      const mockFirebaseTimestamp = {
        toDate: () => new Date('1985-06-15')
      };
      const age = calculateAge(mockFirebaseTimestamp);

      expect(age).toBeGreaterThanOrEqual(38);
      expect(age).toBeLessThanOrEqual(40);
    });

    it('should return null for null/undefined input', () => {
      expect(calculateAge(null)).toBeNull();
      expect(calculateAge(undefined)).toBeNull();
      expect(calculateAge('')).toBeNull();
    });

    it('should throw error for invalid date', () => {
      expect(() => calculateAge('invalid-date')).toThrow('Invalid date of birth');
    });

    it('should handle leap years correctly', () => {
      const birthDate = '2000-02-29'; // Leap year
      const age = calculateAge(birthDate);

      expect(age).toBeGreaterThanOrEqual(23);
      expect(age).toBeLessThanOrEqual(25);
    });

    it('should handle Firebase Timestamp for leap year date', () => {
      const mockFirebaseTimestamp = {
        toDate: () => new Date('2000-02-29')
      };
      const age = calculateAge(mockFirebaseTimestamp);

      expect(age).toBeGreaterThanOrEqual(23);
      expect(age).toBeLessThanOrEqual(25);
    });

    it('should calculate age as 0 for recent birth', () => {
      const today = new Date();
      const recentBirth = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 100);
      const age = calculateAge(recentBirth);

      expect(age).toBe(0);
    });
  });

  describe('formatClientProfileResponse', () => {
    it('should format client profile with Firestore timestamps', () => {
      const profile = {
        full_name: 'John Doe',
        age: 30,
        date_of_birth: { toDate: () => new Date('1990-01-01') },
        created_at: { toDate: () => new Date('2023-01-01') },
        updated_at: { toDate: () => new Date('2023-01-02') }
      };

      const formatted = formatClientProfileResponse(profile);

      expect(formatted.full_name).toBe('John Doe');
      expect(formatted.age).toBe(30);
      expect(formatted.date_of_birth).toBeInstanceOf(Date);
      expect(formatted.created_at).toBeInstanceOf(Date);
      expect(formatted.updated_at).toBeInstanceOf(Date);
    });

    it('should handle regular Date objects', () => {
      const profile = {
        full_name: 'Jane Doe',
        date_of_birth: new Date('1985-05-15'),
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02')
      };

      const formatted = formatClientProfileResponse(profile);

      expect(formatted.date_of_birth).toBeInstanceOf(Date);
      expect(formatted.created_at).toBeInstanceOf(Date);
      expect(formatted.updated_at).toBeInstanceOf(Date);
    });

    it('should handle null/undefined profile', () => {
      expect(formatClientProfileResponse(null)).toBeNull();
      expect(formatClientProfileResponse(undefined)).toBeNull();
    });

    it('should handle missing date fields', () => {
      const profile = {
        full_name: 'John Doe',
        age: 30
      };

      const formatted = formatClientProfileResponse(profile);

      expect(formatted.full_name).toBe('John Doe');
      expect(formatted.age).toBe(30);
      expect(formatted.date_of_birth).toBeUndefined();
    });
  });

  describe('prepareClientProfileData', () => {
    it('should prepare complete client profile data', () => {
      const inputData = {
        full_name: 'John Doe',
        date_of_birth: '1990-01-01',
        sex: 'Male',
        mobile_number: '0412345678',
        email_address: 'john@example.com',
        emergency_contacts: [{ name: 'Jane', phone: '0987654321' }]
      };

      const prepared = prepareClientProfileData(inputData);

      expect(prepared.full_name).toBe('John Doe');
      expect(prepared.sex).toBe('Male');
      expect(prepared.mobile_number).toBe('0412345678');
      expect(prepared.email_address).toBe('john@example.com');
      expect(prepared.date_of_birth).toBeInstanceOf(Date);
      expect(prepared.is_active).toBe(true);
      expect(prepared.created_at).toBeInstanceOf(Date);
      expect(prepared.updated_at).toBeInstanceOf(Date);
      expect(prepared.age).toBeGreaterThan(30);
    });

    it('should calculate age when date_of_birth provided but not age', () => {
      const inputData = {
        full_name: 'Jane Doe',
        date_of_birth: '1995-06-15'
      };

      const prepared = prepareClientProfileData(inputData);

      expect(prepared.age).toBeGreaterThanOrEqual(28);
      expect(prepared.age).toBeLessThanOrEqual(30);
    });

    it('should use provided age over calculated age', () => {
      const inputData = {
        full_name: 'John Doe',
        date_of_birth: '1990-01-01',
        age: 25 // Explicitly provided age
      };

      const prepared = prepareClientProfileData(inputData);

      expect(prepared.age).toBe(25); // Should use provided age, not calculated
    });

    it('should only include defined fields', () => {
      const inputData = {
        full_name: 'John Doe',
        sex: undefined
        // age is not provided at all
      };

      const prepared = prepareClientProfileData(inputData);

      expect(prepared.full_name).toBe('John Doe');
      expect(prepared.hasOwnProperty('sex')).toBe(false);
      expect(prepared.hasOwnProperty('age')).toBe(false);
    });

    it('should handle empty input data', () => {
      const prepared = prepareClientProfileData({});

      expect(prepared.is_active).toBe(true);
      expect(prepared.created_at).toBeInstanceOf(Date);
      expect(prepared.updated_at).toBeInstanceOf(Date);
      expect(Object.keys(prepared)).toHaveLength(3); // Only the default fields
    });
  });

  describe('updateClientProfileData', () => {
    const existingProfile = {
      full_name: 'John Doe',
      age: 30,
      sex: 'Male',
      email_address: 'john@example.com',
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    };

    it('should update specific fields while preserving others', () => {
      const updateData = {
        full_name: 'John Updated',
        mobile_number: '0412345678'
      };

      const updated = updateClientProfileData(existingProfile, updateData);

      expect(updated.full_name).toBe('John Updated');
      expect(updated.mobile_number).toBe('0412345678');
      expect(updated.age).toBe(30); // Preserved
      expect(updated.sex).toBe('Male'); // Preserved
      expect(updated.email_address).toBe('john@example.com'); // Preserved
      expect(updated.updated_at).toBeInstanceOf(Date);
      expect(updated.updated_at.getTime()).toBeGreaterThan(existingProfile.updated_at.getTime());
    });

    it('should recalculate age when date_of_birth is updated', () => {
      const updateData = {
        date_of_birth: '1985-01-01'
      };

      const updated = updateClientProfileData(existingProfile, updateData);

      expect(updated.date_of_birth).toBeInstanceOf(Date);
      expect(updated.age).toBeGreaterThanOrEqual(38);
      expect(updated.age).toBeLessThanOrEqual(40);
    });

    it('should convert age to integer', () => {
      const updateData = {
        age: '35' // String input
      };

      const updated = updateClientProfileData(existingProfile, updateData);

      expect(updated.age).toBe(35);
      expect(typeof updated.age).toBe('number');
    });

    it('should not modify original profile object', () => {
      const updateData = {
        full_name: 'Modified Name'
      };

      const updated = updateClientProfileData(existingProfile, updateData);

      expect(existingProfile.full_name).toBe('John Doe'); // Original unchanged
      expect(updated.full_name).toBe('Modified Name'); // Updated copy
    });
  });

  describe('filterUsersBySearch', () => {
    const testUsers = [
      {
        uid: 'user1',
        client_profile: {
          full_name: 'John Doe',
          email_address: 'john@example.com',
          mobile_number: '0412345678'
        }
      },
      {
        uid: 'user2',
        client_profile: {
          full_name: 'Jane Smith',
          email_address: 'jane@test.com',
          mobile_number: '0987654321'
        }
      },
      {
        uid: 'user3',
        client_profile: {
          full_name: 'Bob Johnson',
          email_address: 'bob@example.com',
          mobile_number: '0555666777'
        }
      }
    ];

    it('should filter by full name (case insensitive)', () => {
      const filtered = filterUsersBySearch(testUsers, 'john');

      expect(filtered).toHaveLength(2); // John Doe and Bob Johnson
      expect(filtered[0].client_profile.full_name).toBe('John Doe');
      expect(filtered[1].client_profile.full_name).toBe('Bob Johnson');
    });

    it('should filter by email address (case insensitive)', () => {
      const filtered = filterUsersBySearch(testUsers, 'example.com');

      expect(filtered).toHaveLength(2); // John and Bob
      expect(filtered[0].client_profile.email_address).toContain('example.com');
      expect(filtered[1].client_profile.email_address).toContain('example.com');
    });

    it('should filter by mobile number (exact match)', () => {
      const filtered = filterUsersBySearch(testUsers, '0412');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].client_profile.mobile_number).toBe('0412345678');
    });

    it('should return all users when no search term provided', () => {
      expect(filterUsersBySearch(testUsers, '')).toHaveLength(3);
      expect(filterUsersBySearch(testUsers, null)).toHaveLength(3);
      expect(filterUsersBySearch(testUsers, undefined)).toHaveLength(3);
    });

    it('should return empty array when no matches found', () => {
      const filtered = filterUsersBySearch(testUsers, 'nomatch');

      expect(filtered).toHaveLength(0);
    });

    it('should handle users without client profiles', () => {
      const usersWithMissingProfiles = [
        ...testUsers,
        { uid: 'user4' }, // No client_profile
        { uid: 'user5', client_profile: null }
      ];

      const filtered = filterUsersBySearch(usersWithMissingProfiles, 'john');

      expect(filtered).toHaveLength(2); // Still only John Doe and Bob Johnson
    });

    it('should handle missing fields in client profiles', () => {
      const usersWithMissingFields = [
        {
          uid: 'user1',
          client_profile: {
            full_name: 'John Doe'
            // Missing email_address and mobile_number
          }
        }
      ];

      const filtered = filterUsersBySearch(usersWithMissingFields, 'john');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].client_profile.full_name).toBe('John Doe');
    });
  });
});