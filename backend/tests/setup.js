// Mock Firebase Admin SDK
const createMockDoc = () => ({
  get: jest.fn(),
  update: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  collection: jest.fn(() => mockCollection)
});

const mockDoc = createMockDoc();

const createMockCollection = () => ({
  add: jest.fn(),
  get: jest.fn(),
  doc: jest.fn(() => mockDoc),
  where: jest.fn(function() { return this; }),
  orderBy: jest.fn(function() { return this; }),
  limit: jest.fn(function() { return this; }),
  offset: jest.fn(function() { return this; })
});

const mockCollection = createMockCollection();

const mockDb = {
  collection: jest.fn(() => mockCollection),
  collectionGroup: jest.fn(() => mockCollection),
  runTransaction: jest.fn(async (callback) => {
    const transaction = {
      get: jest.fn(async () => ({ exists: false, data: () => ({}) })),
      set: jest.fn(),
      update: jest.fn()
    };
    return callback(transaction);
  })
};

const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn()
};

const mockAdmin = {
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date())
    },
    Timestamp: {
      now: jest.fn(() => new Date())
    }
  }
};

jest.mock('../config/firebase', () => ({
  db: mockDb,
  auth: mockAuth,
  admin: mockAdmin
}));

// Export the mocks so tests can access them
global.mockDb = mockDb;
global.mockAuth = mockAuth;
global.mockCollection = mockCollection;
global.mockDoc = mockDoc;
global.mockAdmin = mockAdmin;

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
