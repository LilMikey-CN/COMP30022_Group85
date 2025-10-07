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

const buildMockFirestore = ({
  taskId = 'task-123',
  taskData: initialTaskData = null,
  executionId = 'exec-1',
  executionData: initialExecutionData = null
} = {}) => {
  const storedTaskDocs = new Map();
  if (initialTaskData) {
    storedTaskDocs.set(taskId, { ...initialTaskData });
  }

  const storedExecutionDocs = new Map();
  if (initialExecutionData) {
    storedExecutionDocs.set(executionId, { ...initialExecutionData });
  }

  const executionDocRefs = new Map();

  const getExecutionDocsSnapshot = () =>
    Array.from(storedExecutionDocs.entries()).map(([id, data]) => ({
      id,
      data: () => data
    }));

  const createExecutionDocRef = (id) => ({
    id,
    get: jest.fn(async () => {
      const data = storedExecutionDocs.get(id);
      return {
        exists: !!data,
        id,
        data: () => data
      };
    }),
    update: jest.fn(async (updateData) => {
      const data = storedExecutionDocs.get(id);
      if (!data) {
        throw new Error(`Execution ${id} not found`);
      }
      Object.assign(data, updateData);
    })
  });

  const executionQuery = {
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockImplementation(async () => ({
      empty: storedExecutionDocs.size === 0,
      docs: getExecutionDocsSnapshot()
    })),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis()
  };

  let executionCounter = storedExecutionDocs.size + 1;

  const executionsCollection = {
    add: jest.fn(async (data) => {
      const newId = `exec-${executionCounter}`;
      executionCounter += 1;
      const storedData = { ...data };
      storedExecutionDocs.set(newId, storedData);
      executionDocRefs.set(newId, createExecutionDocRef(newId));
      return {
        id: newId,
        get: jest.fn().mockResolvedValue({
          id: newId,
          data: () => storedData
        })
      };
    }),
    doc: jest.fn((id) => {
      if (!executionDocRefs.has(id)) {
        executionDocRefs.set(id, createExecutionDocRef(id));
      }
      return executionDocRefs.get(id);
    }),
    orderBy: jest.fn(() => executionQuery),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: getExecutionDocsSnapshot(),
      empty: storedExecutionDocs.size === 0
    })
  };

  const taskDocRefs = new Map();

  const createTaskDocRef = (id) => ({
    id,
    get: jest.fn(async () => {
      const data = storedTaskDocs.get(id);
      return {
        exists: !!data,
        id,
        data: () => data
      };
    }),
    update: jest.fn(async (updateData) => {
      const data = storedTaskDocs.get(id);
      if (!data) {
        throw new Error(`Task ${id} not found`);
      }
      Object.assign(data, updateData);
    }),
    collection: jest.fn((name) => {
      if (name === 'task_executions') {
        return executionsCollection;
      }
      throw new Error(`Unexpected sub-collection ${name}`);
    })
  });

  const careTasksCollection = {
    add: jest.fn(async (data) => {
      storedTaskDocs.set(taskId, data);
      if (!taskDocRefs.has(taskId)) {
        taskDocRefs.set(taskId, createTaskDocRef(taskId));
      }
      return {
        id: taskId,
        get: jest.fn().mockResolvedValue({
          id: taskId,
          data: () => data
        })
      };
    }),
    doc: jest.fn((id) => {
      if (!taskDocRefs.has(id)) {
        taskDocRefs.set(id, createTaskDocRef(id));
      }
      return taskDocRefs.get(id);
    }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: Array.from(storedTaskDocs.entries()).map(([id, data]) => ({
        id,
        data: () => data
      }))
    })
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

  if (initialExecutionData) {
    executionDocRefs.set(executionId, createExecutionDocRef(executionId));
  }

  return {
    careTasksCollection,
    executionsCollection,
    taskDocRefs,
    executionDocRefs
  };
};

describe('Care Tasks API', () => {
  let app;

  const createTestApp = () => {
    return express();
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

  it('records a full refund for a purchase execution', async () => {
    buildMockFirestore({
      taskData: {
        task_type: 'PURCHASE',
        name: 'Buy Medicine'
      },
      executionData: {
        care_task_id: 'task-123',
        user_id: 'test-uid',
        status: 'DONE',
        actual_cost: 45,
        refund: null,
        scheduled_date: new Date('2024-03-01T00:00:00.000Z'),
        execution_date: new Date('2024-03-02T00:00:00.000Z'),
        created_at: new Date('2024-03-01T00:00:00.000Z'),
        updated_at: new Date('2024-03-02T00:00:00.000Z')
      }
    });

    const response = await request(app)
      .post('/api/care-tasks/task-123/executions/exec-1/refund')
      .send({
        refund_amount: 45,
        refund_reason: 'Supplier issued full refund'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('REFUNDED');
    expect(response.body.data.refund).toBeTruthy();
    expect(response.body.data.refund.refund_amount).toBe(45);
    expect(response.body.data.refund.refunded_by_uid).toBe('test-uid');
  });

  it('marks execution as partially refunded when amount is less than actual cost', async () => {
    buildMockFirestore({
      taskData: {
        task_type: 'PURCHASE'
      },
      executionData: {
        care_task_id: 'task-123',
        user_id: 'test-uid',
        status: 'DONE',
        actual_cost: 60,
        refund: null,
        scheduled_date: new Date('2024-03-05T00:00:00.000Z'),
        execution_date: new Date('2024-03-05T00:00:00.000Z'),
        created_at: new Date('2024-03-05T00:00:00.000Z'),
        updated_at: new Date('2024-03-05T00:00:00.000Z')
      }
    });

    const response = await request(app)
      .post('/api/care-tasks/task-123/executions/exec-1/refund')
      .send({
        refund_amount: 20,
        refund_evidence_url: 'https://example.com/refund.pdf'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PARTIALLY_REFUNDED');
    expect(response.body.data.refund.refund_amount).toBe(20);
    expect(response.body.data.refund.refund_evidence_url).toBe('https://example.com/refund.pdf');
  });

  it('rejects refund amounts greater than the actual cost', async () => {
    buildMockFirestore({
      taskData: {
        task_type: 'PURCHASE'
      },
      executionData: {
        care_task_id: 'task-123',
        user_id: 'test-uid',
        status: 'DONE',
        actual_cost: 30,
        refund: null,
        scheduled_date: new Date(),
        execution_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    const response = await request(app)
      .post('/api/care-tasks/task-123/executions/exec-1/refund')
      .send({ refund_amount: 40 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/less than or equal to 30/);
  });

  it('prevents changing status after a refund is recorded', async () => {
    buildMockFirestore({
      taskData: {
        task_type: 'PURCHASE'
      },
      executionData: {
        care_task_id: 'task-123',
        user_id: 'test-uid',
        status: 'DONE',
        actual_cost: 25,
        refund: null,
        scheduled_date: new Date(),
        execution_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    await request(app)
      .post('/api/care-tasks/task-123/executions/exec-1/refund')
      .send({ refund_amount: 25 });

    const response = await request(app)
      .patch('/api/care-tasks/task-123/executions/exec-1')
      .send({ status: 'TODO' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Status cannot be changed after a refund has been recorded/);
  });

  it('rejects refunds for non-purchase tasks', async () => {
    buildMockFirestore({
      taskData: {
        task_type: 'GENERAL'
      },
      executionData: {
        care_task_id: 'task-123',
        user_id: 'test-uid',
        status: 'DONE',
        actual_cost: 25,
        refund: null,
        scheduled_date: new Date(),
        execution_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    const response = await request(app)
      .post('/api/care-tasks/task-123/executions/exec-1/refund')
      .send({ refund_amount: 5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Refunds are only supported for purchase tasks/);
  });
});
