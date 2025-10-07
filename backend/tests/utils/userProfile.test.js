const {
  formatUserProfileResponse,
  prepareUserProfileData,
  initializeUserDocument
} = require('../../utils/userProfile');

describe('User Profile Utils', () => {
  describe('formatUserProfileResponse', () => {
    it('should format complete user profile data', () => {
      const userData = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        avatar_url: 'https://example.com/avatar.jpg',
        mobile_phone: '0412345678',
        contact_address: '123 Main St, Melbourne VIC 3000',
        created_at: { toDate: () => new Date('2023-01-01') },
        updated_at: { toDate: () => new Date('2023-01-02') }
      };

      const result = formatUserProfileResponse(userData);

      expect(result).toEqual({
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        avatar_url: 'https://example.com/avatar.jpg',
        mobile_phone: '0412345678',
        contact_address: '123 Main St, Melbourne VIC 3000',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
        client_profile: null
      });
    });

    it('should handle missing optional fields with null', () => {
      const userData = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02')
      };

      const result = formatUserProfileResponse(userData);

      expect(result.avatar_url).toBeNull();
      expect(result.mobile_phone).toBeNull();
      expect(result.contact_address).toBeNull();
    });

    it('should handle dates without toDate method', () => {
      const userData = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02')
      };

      const result = formatUserProfileResponse(userData);

      expect(result.created_at).toEqual(new Date('2023-01-01'));
      expect(result.updated_at).toEqual(new Date('2023-01-02'));
    });

    it('should return null for null input', () => {
      const result = formatUserProfileResponse(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = formatUserProfileResponse(undefined);

      expect(result).toBeNull();
    });
  });

  describe('prepareUserProfileData', () => {
    it('should prepare complete user profile data', () => {
      const inputData = {
        displayName: 'Updated User',
        avatar_url: 'https://example.com/new-avatar.jpg',
        mobile_phone: '0498765432',
        contact_address: '456 New St, Sydney NSW 2000'
      };

      const result = prepareUserProfileData(inputData);

      expect(result.displayName).toBe('Updated User');
      expect(result.avatar_url).toBe('https://example.com/new-avatar.jpg');
      expect(result.mobile_phone).toBe('0498765432');
      expect(result.contact_address).toBe('456 New St, Sydney NSW 2000');
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should only include provided fields', () => {
      const inputData = {
        displayName: 'Updated User'
      };

      const result = prepareUserProfileData(inputData);

      expect(result.displayName).toBe('Updated User');
      expect(result.avatar_url).toBeUndefined();
      expect(result.mobile_phone).toBeUndefined();
      expect(result.contact_address).toBeUndefined();
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should handle partial updates', () => {
      const testCases = [
        { displayName: 'New Name' },
        { avatar_url: 'https://new-url.com/avatar.jpg' },
        { mobile_phone: '0411111111' },
        { contact_address: '789 Another St' },
        { displayName: 'Name', mobile_phone: '0422222222' }
      ];

      testCases.forEach(testCase => {
        const result = prepareUserProfileData(testCase);

        Object.keys(testCase).forEach(key => {
          expect(result[key]).toBe(testCase[key]);
        });
        expect(result.updated_at).toBeInstanceOf(Date);
      });
    });

    it('should always include updated_at timestamp', () => {
      const result = prepareUserProfileData({});

      expect(result.updated_at).toBeInstanceOf(Date);
      expect(Object.keys(result)).toEqual(['updated_at']);
    });

    it('should handle null values', () => {
      const inputData = {
        displayName: null,
        avatar_url: null
      };

      const result = prepareUserProfileData(inputData);

      // null values are included in the result (null !== undefined)
      expect(result.displayName).toBeNull();
      expect(result.avatar_url).toBeNull();
    });
  });

  describe('initializeUserDocument', () => {
    it('should initialize user document with Firebase Auth record', () => {
      const userId = 'test-uid-123';
      const userRecord = {
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        metadata: {
          creationTime: '2023-01-01T00:00:00Z'
        }
      };

      const result = initializeUserDocument(userId, userRecord);

      expect(result.uid).toBe('test-uid-123');
      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('Test User');
      expect(result.emailVerified).toBe(true);
      expect(result.created_at).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.client_profile).toBeTruthy();
      expect(result.client_profile.is_active).toBe(true);
    });

    it('should use token data when Firebase Auth record is not available', () => {
      const userId = 'test-uid-123';
      const tokenUser = {
        email: 'token@example.com',
        name: 'Token User'
      };

      const result = initializeUserDocument(userId, null, tokenUser);

      expect(result.uid).toBe('test-uid-123');
      expect(result.email).toBe('token@example.com');
      expect(result.displayName).toBe('Token User');
      expect(result.emailVerified).toBe(false);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.client_profile).toBeTruthy();
    });

    it('should use default values when no user data provided', () => {
      const userId = 'test-uid-123';

      const result = initializeUserDocument(userId);

      expect(result.uid).toBe('test-uid-123');
      expect(result.email).toBeNull();
      expect(result.displayName).toBe('Test Guardian User');
      expect(result.emailVerified).toBe(false);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.client_profile).toBeTruthy();
    });

    it('should prefer Firebase Auth data over token data', () => {
      const userId = 'test-uid-123';
      const userRecord = {
        email: 'auth@example.com',
        displayName: 'Auth User',
        emailVerified: true,
        metadata: {
          creationTime: '2023-01-01T00:00:00Z'
        }
      };
      const tokenUser = {
        email: 'token@example.com',
        name: 'Token User'
      };

      const result = initializeUserDocument(userId, userRecord, tokenUser);

      expect(result.email).toBe('auth@example.com');
      expect(result.displayName).toBe('Auth User');
      expect(result.emailVerified).toBe(true);
      expect(result.client_profile).toBeTruthy();
    });

    it('should handle partial Firebase Auth record', () => {
      const userId = 'test-uid-123';
      const userRecord = {
        email: 'partial@example.com'
      };

      const result = initializeUserDocument(userId, userRecord);

      expect(result.uid).toBe('test-uid-123');
      expect(result.email).toBe('partial@example.com');
      expect(result.displayName).toBe('Test Guardian User');
      expect(result.emailVerified).toBe(false);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.client_profile).toBeTruthy();
    });
  });
});
