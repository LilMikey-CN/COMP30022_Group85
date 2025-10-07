const request = require('supertest');
const express = require('express');

jest.mock('../../utils/userProfile', () => {
  const actual = jest.requireActual('../../utils/userProfile');
  return {
    ...actual,
    ensureUserDocumentInitialized: jest.fn(),
    prepareUserProfileData: jest.fn()
  };
});

const usersRouter = require('../../routes/users');
const { ensureUserDocumentInitialized, prepareUserProfileData } = require('../../utils/userProfile');

describe('Users API', () => {
  let app;

  const createTestApp = () => {
    const serverlessApp = express();
    serverlessApp.listen = (port, callback) => {
      if (typeof port === 'function') {
        callback = port;
      }
      if (callback) callback();
      return {
        address: () => ({ port: 0 }),
        close: jest.fn()
      };
    };
    return serverlessApp;
  };

  beforeEach(() => {
    app = createTestApp();
    app.use(express.json());
    app.use('/api/users', usersRouter);

    ensureUserDocumentInitialized.mockReset();
    prepareUserProfileData.mockReset();
  });

  it('returns the current user profile', async () => {
    ensureUserDocumentInitialized.mockResolvedValue({
      userRef: {
        update: jest.fn().mockResolvedValue(),
        get: jest.fn()
      },
      userData: {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        avatar_url: null,
        mobile_phone: null,
        contact_address: null,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
        client_profile: null
      }
    });

    const res = await request(app).get('/api/users/profile');

    expect(res.status).toBe(200);
    expect(res.body.data.uid).toBe('test-uid');
    expect(ensureUserDocumentInitialized).toHaveBeenCalled();
  });

  it('updates user profile fields', async () => {
    const updateResult = { displayName: 'Updated User', updated_at: new Date('2024-01-03T00:00:00Z') };

    prepareUserProfileData.mockReturnValue(updateResult);

    const userRef = {
      update: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue({
        data: () => ({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Updated User',
          emailVerified: true,
          avatar_url: null,
          mobile_phone: null,
          contact_address: null,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-03T00:00:00Z')
        })
      })
    };

    ensureUserDocumentInitialized.mockResolvedValue({
      userRef,
      userData: {}
    });

    const res = await request(app)
      .patch('/api/users/profile')
      .send({ displayName: 'Updated User' });

    expect(res.status).toBe(200);
    expect(prepareUserProfileData).toHaveBeenCalledWith({ displayName: 'Updated User' });
    expect(userRef.update).toHaveBeenCalledWith(updateResult);
    expect(res.body.data.displayName).toBe('Updated User');
  });

  it('updates client profile', async () => {
    const updatedProfile = {
      full_name: 'Client Name',
      date_of_birth: new Date('1990-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
      is_active: true
    };

    const userRef = {
      update: jest.fn().mockResolvedValue(),
      get: jest.fn()
    };

    ensureUserDocumentInitialized.mockResolvedValue({
      userRef,
      userData: {}
    });

    const res = await request(app)
      .put('/api/users/client-profile')
      .send({
        full_name: 'Client Name',
        date_of_birth: '1990-01-01'
      });

    expect(res.status).toBe(200);
    expect(userRef.update).toHaveBeenCalled();
    expect(res.body.data.client_profile.full_name).toBe('Client Name');
  });
});
