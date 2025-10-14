const request = require('supertest');
const express = require('express');

jest.mock('../../utils/userProfile', () => ({
  ensureUserDocumentInitialized: jest.fn(async () => ({
    userRef: { update: jest.fn(), get: jest.fn(), set: jest.fn() },
    userData: { uid: 'test-uid' }
  }))
}));

jest.mock('../../utils/categories', () => ({
  ensureCategoryOptionsDoc: jest.fn(),
  readCategoriesDoc: jest.fn(),
  findCategoryById: jest.fn((categories, categoryId) =>
    categories.find((category) => category.id === categoryId)
  ),
  getCategoryDocRef: jest.fn(() => ({ path: 'users/test-uid/categories/options' })),
  formatCategory: jest.fn((category) => category)
}));

const categoriesRouter = require('../../routes/categories');
const { readCategoriesDoc, getCategoryDocRef } = require('../../utils/categories');
const { mockDb } = global;

describe('Categories API', () => {
  let app;

  const createTestApp = () => {
    const serverlessApp = express();
    serverlessApp.listen = (port, callback) => {
      // Mimic Express listen without touching network sockets (sandbox friendly).
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
    app.use('/api/categories', categoriesRouter);

    mockDb.collection.mockReset();
    mockDb.runTransaction.mockReset();
    readCategoriesDoc.mockReset();
    readCategoriesDoc.mockResolvedValue({ categories: [] });
    getCategoryDocRef.mockReset();
    getCategoryDocRef.mockReturnValue({ path: 'users/test-uid/categories/options' });
  });

  it('returns categories for the current user', async () => {
    const categories = [
      { id: 'hygiene', name: 'Hygiene' },
      { id: 'food', name: 'Food' }
    ];

    readCategoriesDoc.mockResolvedValue({ categories });

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual(categories);
    expect(readCategoriesDoc).toHaveBeenCalled();
  });

  it('creates a new category', async () => {
    const transactionSet = jest.fn();

    mockDb.runTransaction.mockImplementation(async (callback) => {
      const tx = {
        get: jest.fn(async () => ({
          exists: true,
          data: () => ({ categories: [] })
        })),
        set: transactionSet
      };
      return callback(tx);
    });

    const res = await request(app)
      .post('/api/categories')
      .send({
        name: 'Clothing',
        description: 'Apparel items',
        color_code: '#123456'
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Category created successfully');
    expect(transactionSet).toHaveBeenCalled();
    expect(getCategoryDocRef).toHaveBeenCalled();
  });

  it('rejects duplicate category names', async () => {
    mockDb.runTransaction.mockImplementation(async (callback) => {
      const tx = {
        get: jest.fn(async () => ({
          exists: true,
          data: () => ({ categories: [{ id: 'hygiene', name: 'Hygiene' }] })
        })),
        set: jest.fn()
      };
      return callback(tx);
    });

    const res = await request(app)
      .post('/api/categories')
      .send({
        name: 'Hygiene',
        color_code: '#abcdef'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Category name already exists');
  });

  it('deletes a category when no tasks reference it', async () => {
    const taskQuery = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true })
    };

    const taskCollection = {
      where: taskQuery.where,
      limit: taskQuery.limit,
      get: taskQuery.get
    };

    const categoriesDocRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ categories: [{ id: 'hygiene', name: 'Hygiene' }] })
      })
    };

    getCategoryDocRef.mockReturnValue(categoriesDocRef);

    mockDb.collection.mockImplementation((name) => {
      if (name === 'users') {
        return {
          doc: jest.fn(() => ({
            collection: jest.fn((subName) => {
              if (subName === 'care_tasks') {
                return taskCollection;
              }
              return { doc: jest.fn(() => categoriesDocRef) };
            })
          }))
        };
      }
      throw new Error(`Unexpected collection ${name}`);
    });

    mockDb.runTransaction.mockImplementation(async (callback) => {
      const tx = {
        get: categoriesDocRef.get,
        set: jest.fn()
      };
      return callback(tx);
    });

    const res = await request(app).delete('/api/categories/hygiene');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Category deleted successfully');
  });
});
