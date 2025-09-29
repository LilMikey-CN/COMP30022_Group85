// Mock Firebase Admin SDK
const mockDoc = {
  get: jest.fn(),
  update: jest.fn(),
  set: jest.fn(),
  delete: jest.fn()
};

const mockCollection = {
  add: jest.fn(),
  get: jest.fn(),
  doc: jest.fn(() => mockDoc),
  where: jest.fn(function() { return this; }),
  orderBy: jest.fn(function() { return this; }),
  limit: jest.fn(function() { return this; }),
  offset: jest.fn(function() { return this; })
};

const mockDb = {
  collection: jest.fn(() => mockCollection)
};

const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn()
};

jest.mock('../config/firebase', () => ({
  db: mockDb,
  auth: mockAuth
}));

// Export the mocks so tests can access them
global.mockDb = mockDb;
global.mockAuth = mockAuth;
global.mockCollection = mockCollection;
global.mockDoc = mockDoc;

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = { uid: 'test-uid', email: 'test@example.com' };
    next();
  })
}));

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});