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
  executionData: initialExecutionData = null,
  extraTasks = [],
  extraExecutions = []
} = {}) => {
  const tasks = [];
  if (initialTaskData) {
    tasks.push({ id: taskId, data: initialTaskData });
  }
  tasks.push(...extraTasks.map(({ id, data }) => ({ id, data })));

  const executions = [];
  if (initialExecutionData) {
    executions.push({ taskId, id: executionId, data: initialExecutionData });
  }
  executions.push(...extraExecutions.map(({ taskId: execTaskId, id, data }) => ({
    taskId: execTaskId,
    id,
    data
  })));

  const storedTaskDocs = new Map();
  tasks.forEach(({ id, data }) => {
    storedTaskDocs.set(id, { ...data });
  });

  const taskExecutionStores = new Map();
  executions.forEach(({ taskId: execTaskId, id, data }) => {
    if (!taskExecutionStores.has(execTaskId)) {
      taskExecutionStores.set(execTaskId, new Map());
    }
    taskExecutionStores.get(execTaskId).set(id, { ...data });
  });

  const executionCounters = new Map();
  const ensureExecutionStore = (task) => {
    if (!taskExecutionStores.has(task)) {
      taskExecutionStores.set(task, new Map());
    }
    if (!executionCounters.has(task)) {
      executionCounters.set(task, taskExecutionStores.get(task).size + 1);
    }
    return taskExecutionStores.get(task);
  };

  const taskDocRefs = new Map();
  const executionDocRefs = new Map();

  const makeExecutionDocRef = (task, execId) => {
    const key = `${task}:${execId}`;
    if (!executionDocRefs.has(key)) {
      executionDocRefs.set(key, {
        id: execId,
        get: jest.fn(async () => {
          const store = ensureExecutionStore(task);
          const data = store.get(execId);
          return {
            exists: !!data,
            id: execId,
            data: () => data
          };
        }),
        update: jest.fn(async (updateData) => {
          const store = ensureExecutionStore(task);
          const data = store.get(execId);
          if (!data) {
            throw new Error(`Execution ${execId} not found`);
          }
          Object.assign(data, updateData);
        })
      });
    }
    return executionDocRefs.get(key);
  };

  const executionsCollections = new Map();
  const makeExecutionsCollection = (task) => {
    const store = ensureExecutionStore(task);

    const collection = {
      add: jest.fn(async (data) => {
        const counter = executionCounters.get(task) || (store.size + 1);
        const newId = `exec-${counter}`;
        executionCounters.set(task, counter + 1);
        const storedData = { ...data };
        store.set(newId, storedData);
        return {
          id: newId,
          get: jest.fn().mockResolvedValue({
            id: newId,
            data: () => storedData
          })
        };
      }),
      doc: jest.fn((id) => makeExecutionDocRef(task, id)),
      where: jest.fn(function () { return this; }),
      orderBy: jest.fn(function () { return this; }),
      limit: jest.fn(function () { return this; }),
      offset: jest.fn(function () { return this; }),
      get: jest.fn(async () => ({
        docs: Array.from(store.entries()).map(([id, data]) => ({
          id,
          data: () => data
        })),
        empty: store.size === 0
      }))
    };

    return collection;
  };

  const ensureExecutionsCollection = (task) => {
    if (!executionsCollections.has(task)) {
      executionsCollections.set(task, makeExecutionsCollection(task));
    }
    return executionsCollections.get(task);
  };

  const createTaskDocRef = (id) => {
    if (!taskDocRefs.has(id)) {
      taskDocRefs.set(id, {
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
        set: jest.fn(async (newData) => {
          storedTaskDocs.set(id, { ...newData });
        }),
        collection: jest.fn((name) => {
          if (name === 'task_executions') {
            return ensureExecutionsCollection(id);
          }
          throw new Error(`Unexpected sub-collection ${name}`);
        })
      });
    }
    return taskDocRefs.get(id);
  };

  const existingTaskIds = new Set(tasks.map(({ id }) => id));
  let defaultAddIdAvailable = initialTaskData === null;
  let generatedTaskCounter = 200;

  const careTasksCollection = {
    add: jest.fn(async (data) => {
      let newId;
      if (defaultAddIdAvailable) {
        newId = taskId;
        defaultAddIdAvailable = false;
      } else {
        do {
          newId = `task-${generatedTaskCounter}`;
          generatedTaskCounter += 1;
        } while (storedTaskDocs.has(newId) || existingTaskIds.has(newId));
      }

      const storedData = { ...data };
      storedTaskDocs.set(newId, storedData);
      createTaskDocRef(newId);
      return {
        id: newId,
        get: jest.fn().mockResolvedValue({
          id: newId,
          data: () => storedData
        })
      };
    }),
    doc: jest.fn((id) => createTaskDocRef(id)),
    where: jest.fn(function () { return this; }),
    orderBy: jest.fn(function () { return this; }),
    limit: jest.fn(function () { return this; }),
    offset: jest.fn(function () { return this; }),
    get: jest.fn(async () => ({
      docs: Array.from(storedTaskDocs.entries()).map(([id, data]) => ({
        id,
        data: () => data
      }))
    }))
  };

  const categoriesDocRef = {
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ categories: [] }) }),
    set: jest.fn()
  };

  const storedTransfers = new Map();
  const transferDocRefs = new Map();
  let transferCounter = 1;

  const ensureTransferDocRef = (id) => {
    if (!transferDocRefs.has(id)) {
      transferDocRefs.set(id, {
        id,
        get: jest.fn(async () => ({
          exists: storedTransfers.has(id),
          id,
          data: () => storedTransfers.get(id)
        })),
        set: jest.fn(async (data) => {
          storedTransfers.set(id, { ...data });
        })
      });
    }
    return transferDocRefs.get(id);
  };

  const transfersCollection = {
    doc: jest.fn((id) => {
      const docId = id || `transfer-${transferCounter++}`;
      return ensureTransferDocRef(docId);
    })
  };

  const userDocRef = {
    collection: jest.fn((name) => {
      if (name === 'care_tasks') {
        return careTasksCollection;
      }
      if (name === 'care_task_budget_transfers') {
        return transfersCollection;
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

  const runTransaction = async (callback) => {
    const transaction = {
      get: jest.fn(async (target) => {
        if (target && typeof target.get === 'function') {
          return target.get();
        }
        throw new Error('Unsupported transaction.get target');
      }),
      update: jest.fn(async (ref, data) => {
        if (ref && typeof ref.update === 'function') {
          await ref.update(data);
          return;
        }
        throw new Error('Unsupported transaction.update target');
      }),
      set: jest.fn(async (ref, data) => {
        if (ref && typeof ref.set === 'function') {
          await ref.set(data);
          return;
        }
        throw new Error('Unsupported transaction.set target');
      })
    };

    return callback(transaction);
  };

  mockDb.runTransaction.mockImplementation(runTransaction);

  return {
    careTasksCollection,
    executionsCollection: ensureExecutionsCollection(taskId),
    taskDocRefs,
    executionDocRefs,
    transfersCollection,
    storedTaskDocs,
    storedTransfers,
    runTransaction
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
    mockDb.runTransaction.mockReset();
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
        quantity_unit: 'pieces',
        yearly_budget: 500
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('task-123');
    expect(response.body.generated_execution_id).toBe('exec-1');
    expect(response.body.data.yearly_budget).toBe(500);
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

  it('transfers budget between tasks when sufficient funds are available', async () => {
    const { storedTaskDocs, storedTransfers } = buildMockFirestore({
      taskData: null,
      extraTasks: [
        { id: 'task-A', data: { name: 'Task A', yearly_budget: 120 } },
        { id: 'task-B', data: { name: 'Task B', yearly_budget: 30 } }
      ],
      extraExecutions: [
        {
          taskId: 'task-A',
          id: 'exec-available',
          data: {
            actual_cost: 25,
            refund: { refund_amount: 5 }
          }
        }
      ]
    });

    const response = await request(app)
      .post('/api/care-tasks/transfer-budget')
      .send({
        fromTaskId: 'task-A',
        toTaskId: 'task-B',
        amount: 50
      });

    expect(response.status).toBe(201);
    expect(response.body.transfer_id).toBeTruthy();
    expect(storedTaskDocs.get('task-A').yearly_budget).toBeCloseTo(70);
    expect(storedTaskDocs.get('task-B').yearly_budget).toBeCloseTo(80);

    const transferEntries = Array.from(storedTransfers.values());
    expect(transferEntries).toHaveLength(1);
    expect(transferEntries[0].amount).toBe(50);
    expect(transferEntries[0].source_snapshot.net_spend_to_date).toBeCloseTo(20);
  });

  it('prevents budget transfer when insufficient available funds', async () => {
    buildMockFirestore({
      taskData: null,
      extraTasks: [
        { id: 'task-A', data: { name: 'Task A', yearly_budget: 40 } },
        { id: 'task-B', data: { name: 'Task B', yearly_budget: 10 } }
      ],
      extraExecutions: [
        {
          taskId: 'task-A',
          id: 'exec-1',
          data: {
            actual_cost: 30,
            refund: null
          }
        }
      ]
    });

    const response = await request(app)
      .post('/api/care-tasks/transfer-budget')
      .send({
        fromTaskId: 'task-A',
        toTaskId: 'task-B',
        amount: 20
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Insufficient available budget/);
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
