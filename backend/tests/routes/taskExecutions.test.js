const request = require('supertest');
const express = require('express');
const taskExecutionsRouter = require('../../routes/taskExecutions');

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

describe('Task Executions API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/task-executions', taskExecutionsRouter);
    mockDb.collection.mockImplementation(() => mockCollection);
  });

  afterEach(() => {
    mockDb.collection.mockImplementation(() => mockCollection);
  });

  const setupExecutionCollections = () => {
    const careTasksCollection = createCollectionMock();
    const taskExecutionsCollection = createCollectionMock();

    const careTaskDoc = createDocMock();
    const taskExecutionDoc = createDocMock();

    careTasksCollection.doc.mockReturnValue(careTaskDoc);
    taskExecutionsCollection.doc.mockReturnValue(taskExecutionDoc);

    mockDb.collection.mockImplementation((name) => {
      switch (name) {
        case 'care_tasks':
          return careTasksCollection;
        case 'task_executions':
          return taskExecutionsCollection;
        default:
          return createCollectionMock();
      }
    });

    return {
      careTasksCollection,
      taskExecutionsCollection,
      careTaskDoc,
      taskExecutionDoc
    };
  };

  it('marks a task execution as complete with provided metadata', async () => {
    const {
      careTasksCollection,
      taskExecutionsCollection,
      careTaskDoc,
      taskExecutionDoc
    } = setupExecutionCollections();

    taskExecutionDoc.get
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          care_task_id: 'task-1',
          status: 'TODO'
        })
      })
      .mockResolvedValueOnce({
        exists: true,
        id: 'exec-1',
        data: () => ({
          care_task_id: 'task-1',
          status: 'DONE',
          execution_date: new Date('2024-02-15T00:00:00.000Z'),
          executed_by: 'test-uid',
          actual_cost: 15.75,
          quantity_purchased: 2,
          notes: 'Completed'
        })
      });

    careTaskDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ created_by: 'test-uid' })
    });

    const response = await request(app)
      .post('/api/task-executions/exec-1/complete')
      .send({
        actual_cost: 15.75,
        quantity_purchased: 2,
        notes: 'Completed'
      })
      .expect(200);

    expect(taskExecutionDoc.update).toHaveBeenCalledTimes(1);
    const [updatePayload] = taskExecutionDoc.update.mock.calls[0];
    expect(updatePayload.status).toBe('DONE');
    expect(updatePayload.executed_by).toBe('test-uid');
    expect(updatePayload.actual_cost).toBe(15.75);
    expect(updatePayload.quantity_purchased).toBe(2);
    expect(updatePayload.execution_date).toBeInstanceOf(Date);

    expect(response.body.message).toBe('Task execution marked as complete');
    expect(response.body.data.status).toBe('DONE');
    expect(response.body.data.executed_by).toBe('test-uid');
  });

  it('filters task executions by current user when listing', async () => {
    const {
      careTasksCollection,
      taskExecutionsCollection,
      careTaskDoc
    } = setupExecutionCollections();

    careTasksCollection.get.mockResolvedValueOnce({
      forEach: jest.fn((callback) => {
        callback({ id: 'task-1' });
        callback({ id: 'task-2' });
      })
    });

    taskExecutionsCollection.orderBy.mockReturnValue(taskExecutionsCollection);
    taskExecutionsCollection.limit.mockReturnValue(taskExecutionsCollection);
    taskExecutionsCollection.offset.mockReturnValue(taskExecutionsCollection);
    taskExecutionsCollection.get.mockResolvedValueOnce({
      docs: [
        {
          id: 'exec-1',
          data: () => ({
            care_task_id: 'task-1',
            status: 'TODO',
            scheduled_date: new Date('2024-02-01T00:00:00.000Z'),
            created_at: new Date('2024-01-01T00:00:00.000Z'),
            updated_at: new Date('2024-01-01T00:00:00.000Z')
          })
        },
        {
          id: 'exec-2',
          data: () => ({
            care_task_id: 'other-task',
            status: 'TODO',
            scheduled_date: new Date('2024-02-01T00:00:00.000Z'),
            created_at: new Date('2024-01-01T00:00:00.000Z'),
            updated_at: new Date('2024-01-01T00:00:00.000Z')
          })
        }
      ]
    });

    const response = await request(app)
      .get('/api/task-executions')
      .expect(200);

    expect(response.body.executions).toHaveLength(1);
    expect(response.body.executions[0].id).toBe('exec-1');
  });
});
