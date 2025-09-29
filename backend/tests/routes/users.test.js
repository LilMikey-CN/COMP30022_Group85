const request = require('supertest');
const express = require('express');
const usersRouter = require('../../routes/users');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users API - Client Profile Endpoints', () => {
  describe('PUT /api/users/client-profile', () => {
    it('should create a new client profile for user', async () => {
      const mockUserDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);
      mockDoc.set.mockResolvedValue();
      mockAuth.getUser.mockResolvedValue({
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        metadata: { creationTime: '2023-01-01T00:00:00Z' }
      });

      const clientData = {
        full_name: 'John Doe',
        date_of_birth: '1980-01-01',
        sex: 'Male',
        mobile_number: '0412345678',
        email_address: 'john@example.com'
      };

      const response = await request(app)
        .put('/api/users/client-profile')
        .send(clientData)
        .expect(200);

      expect(response.body.message).toBe('Client profile updated successfully');
      expect(response.body.data.user_id).toBe('test-uid');
      expect(response.body.data.client_profile.full_name).toBe('John Doe');
    });

    it('should update existing client profile for user', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          email: 'test@example.com',
          client_profile: {
            full_name: 'John Old',
            is_active: true
          }
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);
      mockDoc.update.mockResolvedValue();
      mockAuth.getUser.mockResolvedValue({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      const clientData = {
        full_name: 'John Updated',
        mobile_number: '0412345678',
        date_of_birth: '1980-01-01'
      };

      const response = await request(app)
        .put('/api/users/client-profile')
        .send(clientData)
        .expect(200);

      expect(response.body.message).toBe('Client profile updated successfully');
      expect(response.body.data.client_profile.full_name).toBe('John Updated');
    });

    it('should calculate age from date_of_birth when age not provided', async () => {
      const mockUserDoc = { exists: false };
      mockDoc.get.mockResolvedValue(mockUserDoc);
      mockDoc.set.mockResolvedValue();
      mockAuth.getUser.mockResolvedValue({});

      const clientData = {
        full_name: 'Jane Doe',
        date_of_birth: '1990-01-01'
      };

      const response = await request(app)
        .put('/api/users/client-profile')
        .send(clientData)
        .expect(200);

      expect(response.body.data.client_profile.age).toBeGreaterThan(30);
    });

    it('should reject invalid sex value', async () => {
      const clientData = {
        full_name: 'John Doe',
        sex: 'Invalid'
      };

      const response = await request(app)
        .put('/api/users/client-profile')
        .send(clientData)
        .expect(400);

      expect(response.body.error).toContain('sex must be one of');
    });

    it('should reject invalid emergency_contacts format', async () => {
      const clientData = {
        full_name: 'John Doe',
        emergency_contacts: 'not an array'
      };

      const response = await request(app)
        .put('/api/users/client-profile')
        .send(clientData)
        .expect(400);

      expect(response.body.error).toBe('emergency_contacts must be an array of objects');
    });

    it('should reject invalid latest_vitals format', async () => {
      const clientData = {
        full_name: 'John Doe',
        latest_vitals: 'not an object'
      };

      const response = await request(app)
        .put('/api/users/client-profile')
        .send(clientData)
        .expect(400);

      expect(response.body.error).toBe('latest_vitals must be an object');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const clientData = {
        full_name: 'John Doe'
      };

      const response = await request(app)
        .put('/api/users/client-profile')
        .send(clientData)
        .expect(500);

      expect(response.body.error).toBe('Failed to update client profile');
    });
  });

  describe('GET /api/users/client-profile', () => {
    it('should get current user client profile', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          email: 'test@example.com',
          client_profile: {
            full_name: 'John Doe',
            email_address: 'john@example.com',
            is_active: true,
            created_at: { toDate: () => new Date('2023-01-01') },
            updated_at: { toDate: () => new Date('2023-01-02') },
            date_of_birth: { toDate: () => new Date('1980-01-01') }
          }
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const response = await request(app)
        .get('/api/users/client-profile')
        .expect(200);

      expect(response.body.user_id).toBe('test-uid');
      expect(response.body.client_profile.full_name).toBe('John Doe');
      expect(response.body.client_profile.is_active).toBe(true);
    });

    it('should return 404 when user has no client profile (not yet created)', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          email: 'test@example.com'
          // No client_profile field - this is normal when profile hasn't been created yet
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const response = await request(app)
        .get('/api/users/client-profile')
        .expect(404);

      expect(response.body.error).toBe('Client profile not found');
      expect(response.body.message).toBe('No client profile has been set up for this user');
    });

    it('should return 404 when user document does not exist (not yet created)', async () => {
      const mockUserDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const response = await request(app)
        .get('/api/users/client-profile')
        .expect(404);

      expect(response.body.error).toBe('Client profile not found');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/client-profile')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch client profile');
    });
  });

  describe('PATCH /api/users/client-profile', () => {
    it('should update specific fields in client profile', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          client_profile: {
            full_name: 'John Doe',
            email_address: 'john@example.com',
            age: 30,
            is_active: true,
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01')
          }
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);
      mockDoc.update.mockResolvedValue();

      const updateData = {
        full_name: 'John Updated',
        age: 31
      };

      const response = await request(app)
        .patch('/api/users/client-profile')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Client profile updated successfully');
      expect(response.body.data.client_profile.full_name).toBe('John Updated');
      expect(response.body.data.client_profile.age).toBe(31);
    });

    it('should recalculate age when date_of_birth is updated', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          client_profile: {
            full_name: 'John Doe',
            age: 30,
            is_active: true,
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01')
          }
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);
      mockDoc.update.mockResolvedValue();

      const updateData = {
        date_of_birth: '1990-01-01'
      };

      const response = await request(app)
        .patch('/api/users/client-profile')
        .send(updateData)
        .expect(200);

      expect(response.body.data.client_profile.age).toBeGreaterThan(30);
    });

    it('should return 404 when user does not exist (cannot update non-existent user)', async () => {
      const mockUserDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const updateData = {
        full_name: 'John Updated'
      };

      const response = await request(app)
        .patch('/api/users/client-profile')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('User profile not found');
    });

    it('should return 404 when client profile does not exist (must create first with PUT)', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid'
          // No client_profile field - user exists but profile not created yet
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const updateData = {
        full_name: 'John Updated'
      };

      const response = await request(app)
        .patch('/api/users/client-profile')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Client profile not found');
    });

    it('should reject invalid sex value', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          client_profile: {
            full_name: 'John Doe',
            is_active: true
          }
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const updateData = {
        sex: 'Invalid'
      };

      const response = await request(app)
        .patch('/api/users/client-profile')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toContain('sex must be one of');
    });
  });

  describe('DELETE /api/users/client-profile', () => {
    it('should deactivate client profile', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          client_profile: {
            full_name: 'John Doe',
            is_active: true
          }
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);
      mockDoc.update.mockResolvedValue();

      const response = await request(app)
        .delete('/api/users/client-profile')
        .expect(200);

      expect(response.body.message).toBe('Client profile deactivated successfully');
      expect(response.body.user_id).toBe('test-uid');
    });

    it('should return 404 when user does not exist (cannot delete non-existent user)', async () => {
      const mockUserDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const response = await request(app)
        .delete('/api/users/client-profile')
        .expect(404);

      expect(response.body.error).toBe('User profile not found');
    });

    it('should return 404 when client profile does not exist (nothing to delete)', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid'
          // No client_profile field - cannot delete what doesn't exist
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const response = await request(app)
        .delete('/api/users/client-profile')
        .expect(404);

      expect(response.body.error).toBe('Client profile not found');
    });
  });

  describe('PATCH /api/users/client-profile/reactivate', () => {
    it('should reactivate deactivated client profile', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid',
          client_profile: {
            full_name: 'John Doe',
            is_active: false
          }
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);
      mockDoc.update.mockResolvedValue();

      const response = await request(app)
        .patch('/api/users/client-profile/reactivate')
        .expect(200);

      expect(response.body.message).toBe('Client profile reactivated successfully');
      expect(response.body.user_id).toBe('test-uid');
    });

    it('should return 404 when user does not exist (cannot reactivate non-existent user)', async () => {
      const mockUserDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const response = await request(app)
        .patch('/api/users/client-profile/reactivate')
        .expect(404);

      expect(response.body.error).toBe('User profile not found');
    });

    it('should return 404 when client profile does not exist (nothing to reactivate)', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'test-uid'
          // No client_profile field - cannot reactivate what doesn't exist
        })
      };

      mockDoc.get.mockResolvedValue(mockUserDoc);

      const response = await request(app)
        .patch('/api/users/client-profile/reactivate')
        .expect(404);

      expect(response.body.error).toBe('Client profile not found');
    });
  });

  describe('GET /api/users/all-client-profiles', () => {
    it('should get all users with client profiles', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              uid: 'user1',
              email: 'user1@example.com',
              displayName: 'User One',
              client_profile: {
                full_name: 'John Doe',
                is_active: true,
                created_at: { toDate: () => new Date('2023-01-01') },
                updated_at: { toDate: () => new Date('2023-01-02') }
              }
            })
          });
          callback({
            data: () => ({
              uid: 'user2',
              email: 'user2@example.com',
              displayName: 'User Two',
              client_profile: {
                full_name: 'Jane Smith',
                is_active: true,
                created_at: { toDate: () => new Date('2023-01-01') },
                updated_at: { toDate: () => new Date('2023-01-02') }
              }
            })
          });
        })
      };

      // Mock the query chaining: where().orderBy().limit().offset().get()
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/users/all-client-profiles')
        .expect(200);

      expect(response.body.users_with_client_profiles).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.users_with_client_profiles[0].client_profile.full_name).toBe('John Doe');
    });

    it('should filter by search term', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              uid: 'user1',
              email: 'user1@example.com',
              displayName: 'User One',
              client_profile: {
                full_name: 'John Doe',
                email_address: 'john@example.com',
                mobile_number: '0412345678',
                is_active: true,
                created_at: { toDate: () => new Date('2023-01-01') },
                updated_at: { toDate: () => new Date('2023-01-02') }
              }
            })
          });
        })
      };

      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/users/all-client-profiles?search=john')
        .expect(200);

      expect(response.body.users_with_client_profiles).toHaveLength(1);
      expect(response.body.users_with_client_profiles[0].client_profile.full_name).toBe('John Doe');
    });
  });

  describe('POST /api/users/search-client-profiles', () => {
    it('should search users with client profiles using filters', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              uid: 'user1',
              email: 'user1@example.com',
              displayName: 'User One',
              client_profile: {
                full_name: 'John Doe',
                sex: 'Male',
                age: 30,
                is_active: true,
                created_at: { toDate: () => new Date('2023-01-01') },
                updated_at: { toDate: () => new Date('2023-01-02') }
              }
            })
          });
        })
      };

      mockCollection.get.mockResolvedValue(mockSnapshot);

      const searchData = {
        sex: 'Male',
        age_min: 25,
        age_max: 35
      };

      const response = await request(app)
        .post('/api/users/search-client-profiles')
        .send(searchData)
        .expect(200);

      expect(response.body.users_with_client_profiles).toHaveLength(1);
      expect(response.body.users_with_client_profiles[0].client_profile.sex).toBe('Male');
      expect(response.body.search_criteria).toEqual(searchData);
    });

    it('should handle database errors in search', async () => {
      mockCollection.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/users/search-client-profiles')
        .send({ sex: 'Male' })
        .expect(500);

      expect(response.body.error).toBe('Failed to search users with client profiles');
    });
  });
});