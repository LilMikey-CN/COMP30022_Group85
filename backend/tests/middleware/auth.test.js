// Mock Firebase admin auth before importing anything
jest.mock('../../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn()
  }
}));

// Mock the middleware auth file to get the real implementation
jest.unmock('../../middleware/auth');

// Import after mocking
const { verifyToken } = require('../../middleware/auth');
const { auth } = require('../../config/firebase');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should verify valid ID token and set user in request', async () => {
      const mockDecodedToken = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        iss: 'https://securetoken.google.com/project-id',
        aud: 'project-id'
      };

      req.headers.authorization = 'Bearer valid-id-token';
      auth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      await verifyToken(req, res, next);

      expect(auth.verifyIdToken).toHaveBeenCalledWith('valid-id-token');
      expect(req.user).toEqual(mockDecodedToken);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle custom token format and create mock decoded token', async () => {
      const customTokenPayload = {
        iss: 'firebase-adminsdk-abc123@project-id.iam.gserviceaccount.com',
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        uid: 'custom-uid-123'
      };

      // Create a mock JWT token with the payload
      const mockJwtToken = 'header.' + Buffer.from(JSON.stringify(customTokenPayload)).toString('base64') + '.signature';
      req.headers.authorization = `Bearer ${mockJwtToken}`;

      // Mock ID token verification to fail
      auth.verifyIdToken.mockRejectedValue(new Error('Invalid ID token'));

      await verifyToken(req, res, next);

      expect(req.user).toEqual({
        uid: 'custom-uid-123',
        iss: customTokenPayload.iss,
        aud: customTokenPayload.aud,
        email: 'jxklikecs@qq.com',
        name: 'Test Guardian User'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      // No authorization header
      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header has no Bearer token', async () => {
      req.headers.authorization = 'Basic sometoken';
      auth.verifyIdToken.mockRejectedValue(new Error('Invalid ID token'));

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', async () => {
      req.headers.authorization = 'Bearer';

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid ID token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      auth.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));

      await verifyToken(req, res, next);

      expect(auth.verifyIdToken).toHaveBeenCalledWith('invalid-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});