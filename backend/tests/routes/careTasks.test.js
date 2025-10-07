const request = require('supertest');
const express = require('express');

jest.mock('../../utils/categories', () => ({
  ensureCategoryOptionsDoc: jest.fn(),
  readCategoriesDoc: jest.fn(),
  findCategoryById: jest.fn((categories, categoryId) =>
    categories.find((category) => category.id === categoryId)
  )
}));

jest.mock('../../utils/userProfile', () => ({
  ensureUserDocumentInitialized: jest.fn(async () => ({
    userRef: {
      update: jest.fn(),
      set: jest.fn(),
      get: jest.fn()
    },
    userData: {
      uid: 'test-uid',
      client_profile: {}
    }
  }))
}));

const { readCategoriesDoc } = require('../../utils/categories');
const careTasksRouter = require('../../routes/careTasks');
const { mockDb } = global;

const buildMockFirestore = () => {
  const executionQuery = {
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis()
  };

  const executionsCollection = {
    add: jest.fn(async (data) => ({
      id: 'exec-1',
      get: jest.fn().mockResolvedValue({
        id: 'exec-1',
        data: () => data
      })
    })),
    orderBy: jest.fn(() => executionQuery),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [], empty: true })
  };

  let storedTaskData = null;

  const createdTaskDoc = {
    id: 'task-123',
    data: () => storedTaskData
  };

  const taskDocRef = {
    get: jest.fn().mockResolvedValue(createdTaskDoc),
    update: jest.fn(),
    collection: jest.fn(() => executionsCollection)
  };

  const careTasksCollection = {
    add: jest.fn(async (data) => {
      storedTaskData = data;
      return {
        id: 'task-123',
        get: jest.fn().mockResolvedValue(createdTaskDoc)
      };
    }),
    doc: jest.fn(() => taskDocRef),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [createdTaskDoc] })
  };

  const categoriesDocRef = {
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ categories: [] }) }),
    set: jest.fn()
  };

  const userDocRef = {
    collection: jest.fn((name) => {
      if (name === 'care_tasks') {
        return careTasksCollection;
      }
      if (name === 'categories') {
        return {
          doc: jest.fn(() => categoriesDocRef)
        };
      }
      throw new Error(`Unexpected sub-collection ${name}`);
    })
  };

  const usersCollection = {
    doc: jest.fn(() => userDocRef)
  };

  mockDb.collection.mockImplementation((name) => {
    if (name === 'users') {
      return usersCollection;
    }
    throw new Error(`Unexpected collection ${name}`);
  });

  return {
    careTasksCollection,
    executionsCollection,
    taskDocRef
  };
};

describe('Care Tasks API', () => {
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
    app.use('/api/care-tasks', careTasksRouter);

    readCategoriesDoc.mockResolvedValue({
      categories: [
        { id: 'hygiene', name: 'Hygiene' }
      ]
    });

    mockDb.collection.mockReset();
  });

  it('creates a one-off care task and generates initial execution', async () => {
    const { careTasksCollection, executionsCollection } = buildMockFirestore();

    const response = await request(app)
      .post('/api/care-tasks')
      .send({
        name: 'Buy Toothpaste',
        description: 'Purchase toothpaste',
        start_date: '2024-03-01',
        recurrence_interval_days: 0,
        task_type: 'PURCHASE',
        category_id: 'hygiene',
        quantity_per_purchase: 2,
        quantity_unit: 'pieces'
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('task-123');
    expect(response.body.generated_execution_id).toBe('exec-1');
    expect(careTasksCollection.add).toHaveBeenCalled();
    expect(executionsCollection.add).toHaveBeenCalled();
  });

  it('rejects care task creation when category is unknown', async () => {
    buildMockFirestore();
    readCategoriesDoc.mockResolvedValue({ categories: [] });

    const res = await request(app)
      .post('/api/care-tasks')
      .send({
        name: 'Buy Soap',
        description: 'Purchase soap',
        start_date: '2024-04-01',
        recurrence_interval_days: 7,
        task_type: 'PURCHASE',
        category_id: 'unknown'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Category not found/);
  });
});
