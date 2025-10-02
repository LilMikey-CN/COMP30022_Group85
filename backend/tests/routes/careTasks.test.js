const request = require('supertest');
const express = require('express');
const careTasksRouter = require('../../routes/careTasks');

const createCollectionMock = () => {
  const collection = {
    add: jest.fn(),
    get: jest.fn(),
    doc: jest.fn(),
    where: jest.fn(function (...args) {
      this._wheres = this._wheres || [];
      this._wheres.push(args);
      return this;
    }),
    orderBy: jest.fn(function (...args) {
      this._orderBys = this._orderBys || [];
      this._orderBys.push(args);
      return this;
    }),
    limit: jest.fn(function (value) {
      this._limit = value;
      return this;
    }),
    offset: jest.fn(function (value) {
      this._offset = value;
      return this;
    })
  };
  return collection;
};

const createDocMock = () => ({
  get: jest.fn(),
  update: jest.fn(),
  set: jest.fn(),
  delete: jest.fn()
});

describe('Care Tasks API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/care-tasks', careTasksRouter);
    mockDb.collection.mockImplementation(() => mockCollection);
  });

  afterEach(() => {
    mockDb.collection.mockImplementation(() => mockCollection);
  });

  const setupCareTaskCollections = () => {
    const careItemsCollection = createCollectionMock();
    const careTasksCollection = createCollectionMock();
    const taskExecutionsCollection = createCollectionMock();

    const careItemsDoc = createDocMock();
    const careTasksDoc = createDocMock();
    const taskExecutionsDoc = createDocMock();

    careItemsCollection.doc.mockReturnValue(careItemsDoc);
    careTasksCollection.doc.mockReturnValue(careTasksDoc);
    taskExecutionsCollection.doc.mockReturnValue(taskExecutionsDoc);

    mockDb.collection.mockImplementation((name) => {
      switch (name) {
        case 'care_items':
          return careItemsCollection;
        case 'care_tasks':
          return careTasksCollection;
        case 'task_executions':
          return taskExecutionsCollection;
        default:
          return createCollectionMock();
      }
    });

    return {
      careItemsCollection,
      careTasksCollection,
      taskExecutionsCollection,
      careItemsDoc,
      careTasksDoc,
      taskExecutionsDoc
    };
  };

  it('creates a PURCHASE care task and generates the first execution', async () => {
    const {
      careItemsCollection,
      careTasksCollection,
      taskExecutionsCollection,
      careItemsDoc,
      careTasksDoc
    } = setupCareTaskCollections();

    const careItemSnapshot = {
      exists: true,
      data: () => ({ created_by: 'test-uid' })
    };

    const insertedTaskData = {
      name: 'Buy Toothpaste',
      description: '',
      start_date: new Date('2024-03-01T00:00:00.000Z'),
      end_date: null,
      recurrence_interval_days: 30,
      task_type: 'PURCHASE',
      is_active: true,
      care_item_id: 'care-item-1',
      created_by: 'test-uid',
      deactivated_at: null,
      created_at: new Date('2024-02-01T00:00:00.000Z'),
      updated_at: new Date('2024-02-01T00:00:00.000Z')
    };

    careItemsDoc.get.mockResolvedValueOnce(careItemSnapshot);

    careTasksCollection.add.mockResolvedValueOnce({ id: 'task-123' });
    taskExecutionsCollection.get.mockResolvedValueOnce({ empty: true, docs: [] });
    taskExecutionsCollection.add.mockResolvedValueOnce({ id: 'exec-456' });

    const createdTaskSnapshot = {
      exists: true,
      id: 'task-123',
      data: () => insertedTaskData
    };

    careTasksDoc.get.mockResolvedValueOnce(createdTaskSnapshot);

    const response = await request(app)
      .post('/api/care-tasks')
      .send({
        name: 'Buy Toothpaste',
        description: '',
        start_date: '2024-03-01',
        recurrence_interval_days: 30,
        task_type: 'PURCHASE',
        care_item_id: 'care-item-1'
      })
      .expect(201);

    expect(response.body.message).toBe('Care task created successfully');
    expect(response.body.id).toBe('task-123');
    expect(response.body.generated_execution_id).toBe('exec-456');

    const createdData = response.body.data;
    expect(createdData.name).toBe('Buy Toothpaste');
    expect(createdData.task_type).toBe('PURCHASE');
    expect(new Date(createdData.start_date)).toEqual(new Date('2024-03-01T00:00:00.000Z'));
    expect(createdData.care_item_id).toBe('care-item-1');
    expect(createdData.created_by).toBe('test-uid');

    expect(careTasksCollection.add).toHaveBeenCalledTimes(1);
    const [addedPayload] = careTasksCollection.add.mock.calls[0];
    expect(addedPayload.start_date).toBeInstanceOf(Date);
    expect(addedPayload.recurrence_interval_days).toBe(30);

    expect(careItemsDoc.get).toHaveBeenCalledTimes(1);
    expect(taskExecutionsCollection.where).toHaveBeenCalledWith('care_task_id', '==', 'task-123');
  });

  it('rejects PURCHASE care task creation when care_item_id is missing', async () => {
    setupCareTaskCollections();

    const response = await request(app)
      .post('/api/care-tasks')
      .send({
        name: 'Buy Soap',
        start_date: '2024-03-01',
        recurrence_interval_days: 7,
        task_type: 'PURCHASE'
      })
      .expect(400);

    expect(response.body.error).toBe('care_item_id is required when task_type is PURCHASE');
  });

  it('rejects care task creation when care item belongs to another user', async () => {
    const { careItemsDoc } = setupCareTaskCollections();

    careItemsDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ created_by: 'different-user' })
    });

    const response = await request(app)
      .post('/api/care-tasks')
      .send({
        name: 'Buy Soap',
        start_date: '2024-03-01',
        recurrence_interval_days: 7,
        task_type: 'PURCHASE',
        care_item_id: 'care-item-1'
      })
      .expect(403);

    expect(response.body.error).toBe('Forbidden: Care item does not belong to you');
  });

  it('lists care tasks filtered by the current user', async () => {
    const { careTasksCollection } = setupCareTaskCollections();

    const taskSnapshot = {
      docs: [
        {
          id: 'task-1',
          data: () => ({
            name: 'Daily Hygiene',
            description: 'Morning routine',
            start_date: new Date('2024-01-01T00:00:00.000Z'),
            end_date: null,
            recurrence_interval_days: 1,
            task_type: 'GENERAL',
            is_active: true,
            care_item_id: null,
            created_by: 'test-uid',
            created_at: new Date('2024-01-01T00:00:00.000Z'),
            updated_at: new Date('2024-01-01T00:00:00.000Z'),
            deactivated_at: null
          })
        }
      ]
    };

    careTasksCollection.get.mockResolvedValueOnce(taskSnapshot);

    const response = await request(app)
      .get('/api/care-tasks')
      .expect(200);

    expect(careTasksCollection.where).toHaveBeenCalledWith('created_by', '==', 'test-uid');
    expect(response.body.care_tasks).toHaveLength(1);
    expect(response.body.care_tasks[0].name).toBe('Daily Hygiene');
  });

  it('creates a manual execution for a care task', async () => {
    const {
      careTasksCollection,
      taskExecutionsCollection,
      careTasksDoc,
      taskExecutionsDoc
    } = setupCareTaskCollections();

    careTasksDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        created_by: 'test-uid',
        task_type: 'GENERAL'
      })
    });

    taskExecutionsCollection.add.mockResolvedValueOnce({ id: 'exec-999' });
    taskExecutionsDoc.get.mockResolvedValueOnce({
      exists: true,
      id: 'exec-999',
      data: () => ({
        care_task_id: 'task-1',
        status: 'DONE',
        quantity_purchased: 1,
        quantity_unit: '',
        actual_cost: null,
        evidence_url: null,
        scheduled_date: new Date('2024-02-10T00:00:00.000Z'),
        execution_date: new Date('2024-02-11T00:00:00.000Z'),
        covered_by_execution_id: null,
        executed_by: 'test-uid',
        notes: 'Completed manually',
        created_at: new Date('2024-02-10T00:00:00.000Z'),
        updated_at: new Date('2024-02-11T00:00:00.000Z')
      })
    });

    const response = await request(app)
      .post('/api/care-tasks/task-1/executions')
      .send({
        scheduled_date: '2024-02-10',
        execution_date: '2024-02-11',
        status: 'DONE',
        notes: 'Completed manually'
      })
      .expect(201);

    expect(response.body.message).toBe('Task execution created successfully');
    expect(taskExecutionsCollection.add).toHaveBeenCalledTimes(1);
    expect(response.body.data.status).toBe('DONE');
    expect(response.body.data.executed_by).toBe('test-uid');
  });
});
