const express = require('express');
const { db, auth, admin } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { readCategoriesDoc, findCategoryById } = require('../utils/categories');
const { ensureUserDocumentInitialized } = require('../utils/userProfile');
const {
  TASK_TYPES,
  EXECUTION_CREATION_ALLOWED_STATUSES,
  EXECUTION_UPDATE_ALLOWED_STATUSES,
  DEFAULT_PURCHASE_QUANTITY_UNIT
} = require('../constants/tasks');

const router = express.Router();
const FieldValue = admin.firestore.FieldValue;

// Normalize Firestore Timestamp / ISO strings to native Date objects.
const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

// Parse a required date value, throwing an HTTP-friendly error when invalid.
const requireDate = (value, fieldName) => {
  const parsed = toDate(value);
  if (!parsed) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

// Parse optional date input; returns null for blank values and errors on invalid strings.
const optionalDate = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = toDate(value);
  if (!parsed) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

// Parse required numeric input while enforcing optional min/max boundaries.
const requireNumber = (value, fieldName, { min, max } = {}) => {
  if (value === undefined || value === null || value === '') {
    const error = new Error(`${fieldName} is required`);
    error.status = 400;
    throw error;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    const error = new Error(`${fieldName} must be a valid number`);
    error.status = 400;
    throw error;
  }

  if (min !== undefined && parsed < min) {
    const error = new Error(`${fieldName} must be greater than or equal to ${min}`);
    error.status = 400;
    throw error;
  }

  if (max !== undefined && parsed > max) {
    const error = new Error(`${fieldName} must be less than or equal to ${max}`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

// Force the supplied date to midnight UTC so recurring generation behaves predictably.
const startOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const startOfYear = (year) => new Date(year, 0, 1, 0, 0, 0, 0);
const endOfYear = (year) => new Date(year, 11, 31, 23, 59, 59, 999);
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getUserRef = (uid) => db.collection('users').doc(uid);
const getCareTasksCollection = (uid) => getUserRef(uid).collection('care_tasks');
const getCareTaskRef = (uid, taskId) => getCareTasksCollection(uid).doc(taskId);
const getTaskExecutionsCollection = (uid, taskId) =>
  getCareTaskRef(uid, taskId).collection('task_executions');
const getTaskExecutionRef = (uid, taskId, executionId) =>
  getTaskExecutionsCollection(uid, taskId).doc(executionId);

const serializeTimestamp = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return value;
};

const formatCareTask = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    start_date: serializeTimestamp(data.start_date),
    end_date: serializeTimestamp(data.end_date),
    created_at: serializeTimestamp(data.created_at),
    updated_at: serializeTimestamp(data.updated_at),
    deactivated_at: serializeTimestamp(data.deactivated_at)
  };
};

const formatExecution = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    scheduled_date: serializeTimestamp(data.scheduled_date),
    execution_date: serializeTimestamp(data.execution_date),
    created_at: serializeTimestamp(data.created_at),
    updated_at: serializeTimestamp(data.updated_at),
    quantity: data.quantity ?? 1,
    refund: data.refund
      ? {
        ...data.refund,
        refund_date: serializeTimestamp(data.refund.refund_date),
        created_at: serializeTimestamp(data.refund.created_at)
      }
      : null
  };
};

// Retrieve a task nested under users/{uid}/care_tasks and fail if it is missing.
const getOwnedCareTask = async (uid, taskId) => {
  const docRef = getCareTaskRef(uid, taskId);
  const doc = await docRef.get();

  if (!doc.exists) {
    const error = new Error('Care task not found');
    error.status = 404;
    throw error;
  }

  return { doc, data: doc.data(), ref: docRef };
};

// Validate that the supplied category id exists in the user's options document.
const ensureCategoryExists = async (uid, categoryId) => {
  const { categories } = await readCategoriesDoc(db, uid);
  const category = findCategoryById(categories, categoryId);
  if (!category) {
    const error = new Error('Category not found');
    error.status = 400;
    throw error;
  }
  return category;
};

// Convert optional numeric inputs to Numbers while enforcing minimum bounds.
const parseOptionalNumber = (value, fieldName, { min } = {}) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    const error = new Error(`${fieldName} must be a valid number`);
    error.status = 400;
    throw error;
  }

  if (min !== undefined && parsed < min) {
    const error = new Error(`${fieldName} must be greater than or equal to ${min}`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

// Convert optional numeric inputs to integers while enforcing minimum bounds.
const parseOptionalInteger = (value, fieldName, { min } = {}) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    const error = new Error(`${fieldName} must be an integer`);
    error.status = 400;
    throw error;
  }

  if (min !== undefined && parsed < min) {
    const error = new Error(`${fieldName} must be greater than or equal to ${min}`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

router.use(verifyToken);

router.use(async (req, res, next) => {
  try {
    await ensureUserDocumentInitialized(db, auth, req.user.uid, req.user);
    next();
  } catch (error) {
    console.error('Failed to initialize user document:', error);
    res.status(500).json({ error: 'Failed to initialize user data' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      start_date,
      end_date,
      recurrence_interval_days,
      task_type,
      category_id,
      estimated_unit_cost,
      quantity_per_purchase,
      quantity_unit
    } = req.body;

    if (!name || !start_date || recurrence_interval_days === undefined || !task_type) {
      return res.status(400).json({
        error: 'Missing required fields: name, start_date, recurrence_interval_days, task_type'
      });
    }

    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    if (!TASK_TYPES.includes(task_type)) {
      return res.status(400).json({
        error: 'task_type must be either PURCHASE or GENERAL'
      });
    }

    const recurrenceInt = parseOptionalInteger(
      recurrence_interval_days,
      'recurrence_interval_days',
      { min: 0 }
    );

    let parsedStartDate;
    let parsedEndDate;

    try {
      parsedStartDate = requireDate(start_date, 'start_date');
      parsedEndDate = optionalDate(end_date, 'end_date');
    } catch (parseError) {
      const status = parseError.status || 400;
      return res.status(status).json({ error: parseError.message });
    }

    if (parsedEndDate && parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        error: 'end_date cannot be earlier than start_date'
      });
    }

    await ensureCategoryExists(req.user.uid, category_id);

    let parsedEstimatedUnitCost = null;
    try {
      parsedEstimatedUnitCost = parseOptionalNumber(estimated_unit_cost, 'estimated_unit_cost', { min: 0 });
    } catch (error) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message });
    }

    let parsedQuantityPerPurchase = null;
    try {
      parsedQuantityPerPurchase = parseOptionalInteger(
        quantity_per_purchase,
        'quantity_per_purchase',
        { min: 1 }
      );
    } catch (error) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message });
    }

    const now = new Date();
    const careTaskData = {
      user_id: req.user.uid,
      name,
      description: description || '',
      start_date: parsedStartDate,
      end_date: parsedEndDate,
      recurrence_interval_days: recurrenceInt,
      task_type,
      category_id,
      is_active: true,
      deactivated_at: null,
      estimated_unit_cost: parsedEstimatedUnitCost,
      quantity_per_purchase: parsedQuantityPerPurchase,
      quantity_unit: quantity_unit || null,
      created_at: now,
      updated_at: now
    };

    const tasksCollection = getCareTasksCollection(req.user.uid);
    const docRef = await tasksCollection.add(careTaskData);

    const generatedExecutionIds = [];

    if (recurrenceInt === 0) {
      const executionData = {
        care_task_id: docRef.id,
        user_id: req.user.uid,
        status: 'TODO',
        quantity_purchased: parsedQuantityPerPurchase || 1,
        quantity_unit: quantity_unit || (task_type === 'PURCHASE' ? DEFAULT_PURCHASE_QUANTITY_UNIT : ''),
        actual_cost: null,
        evidence_url: null,
        scheduled_date: startOfDay(parsedStartDate),
        execution_date: null,
        covered_by_execution_ref: null,
        executed_by_uid: null,
        notes: '',
        refund: null,
        quantity: 1,
        created_at: now,
        updated_at: now
      };

      const executionRef = await getTaskExecutionsCollection(req.user.uid, docRef.id).add(executionData);
      generatedExecutionIds.push(executionRef.id);
    } else {
      const currentYear = new Date().getFullYear();
      if (parsedStartDate.getFullYear() <= currentYear) {
        const rangeStart = startOfDay(parsedStartDate);
        const calendarRangeEnd = endOfYear(currentYear);
        const taskEndDate = parsedEndDate ? startOfDay(parsedEndDate) : null;
        const rangeEnd = taskEndDate && taskEndDate < calendarRangeEnd ? taskEndDate : calendarRangeEnd;

        if (rangeStart <= rangeEnd) {
          const generationOptions = {
            minScheduledDate: rangeStart,
            maxScheduledDate: rangeEnd
          };

          let createdId;
          do {
            // eslint-disable-next-line no-await-in-loop
            createdId = await generateTaskExecution(req.user.uid, docRef.id, careTaskData, generationOptions);
            if (createdId) {
              generatedExecutionIds.push(createdId);
            }
          } while (createdId);
        }
      }
    }

    const createdDoc = await docRef.get();

    res.status(201).json({
      message: 'Care task created successfully',
      id: docRef.id,
      data: formatCareTask(createdDoc),
      generated_execution_id: generatedExecutionIds[0] || null,
      generated_execution_ids: generatedExecutionIds
    });
  } catch (error) {
    console.error('Error creating care task:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to create care task' : error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      task_type,
      category_id,
      is_active = 'true',
      limit = 50,
      offset = 0,
      start_date_from,
      start_date_to
    } = req.query;

    if (task_type && !TASK_TYPES.includes(task_type)) {
      return res.status(400).json({ error: 'task_type must be either PURCHASE or GENERAL' });
    }

    let parsedStartFrom = null;
    let parsedStartTo = null;

    try {
      parsedStartFrom = optionalDate(start_date_from, 'start_date_from');
      parsedStartTo = optionalDate(start_date_to, 'start_date_to');
    } catch (parseError) {
      const status = parseError.status || 400;
      return res.status(status).json({ error: parseError.message });
    }

    if (parsedStartFrom && parsedStartTo && parsedStartFrom > parsedStartTo) {
      return res.status(400).json({ error: 'start_date_from cannot be after start_date_to' });
    }

    const tasksCollection = getCareTasksCollection(req.user.uid);
    const snapshot = await tasksCollection.orderBy('created_at', 'desc').get();
    let careTasks = snapshot.docs.map(formatCareTask);

    if (is_active !== 'all') {
      const activeFlag = is_active === 'true';
      careTasks = careTasks.filter((task) => task.is_active === activeFlag);
    }

    if (task_type) {
      careTasks = careTasks.filter((task) => task.task_type === task_type);
    }

    if (category_id) {
      careTasks = careTasks.filter((task) => task.category_id === category_id);
    }

    if (parsedStartFrom || parsedStartTo) {
      careTasks = careTasks.filter(task => {
        if (!task.start_date) {
          return false;
        }
        if (parsedStartFrom && task.start_date < parsedStartFrom) {
          return false;
        }
        if (parsedStartTo && task.start_date > parsedStartTo) {
          return false;
        }
        return true;
      });
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    const limitNum = Number.isNaN(parsedLimit) ? 50 : Math.max(parsedLimit, 0);
    const offsetNum = Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0);
    const paginatedTasks = careTasks.slice(offsetNum, offsetNum + (limitNum || careTasks.length));

    res.json({
      care_tasks: paginatedTasks,
      count: paginatedTasks.length,
      pagination: {
        limit: limitNum || careTasks.length,
        offset: offsetNum,
        total: careTasks.length
      }
    });
  } catch (error) {
    console.error('Error fetching care tasks:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch care tasks' : error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { doc } = await getOwnedCareTask(req.user.uid, req.params.id);
    res.json(formatCareTask(doc));
  } catch (error) {
    console.error('Error fetching care task:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch care task' : error.message });
  }
});

router.post('/:id/executions', async (req, res) => {
  try {
    const { data: taskData } = await getOwnedCareTask(req.user.uid, req.params.id);

    const {
      scheduled_date,
      execution_date,
      status = 'TODO',
      quantity_purchased = 1,
      quantity_unit,
      actual_cost = null,
      notes = ''
    } = req.body;

    if (!EXECUTION_CREATION_ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${EXECUTION_CREATION_ALLOWED_STATUSES.join(', ')}`
      });
    }

    let parsedScheduledDate;
    let parsedExecutionDate = null;

    try {
      parsedScheduledDate = requireDate(scheduled_date || new Date(), 'scheduled_date');
      if (execution_date !== undefined) {
        parsedExecutionDate = optionalDate(execution_date, 'execution_date');
      } else if (status === 'DONE') {
        parsedExecutionDate = new Date();
      }
    } catch (parseError) {
      const statusCode = parseError.status || 400;
      return res.status(statusCode).json({ error: parseError.message });
    }

    const parsedQuantityPurchased = parseOptionalInteger(quantity_purchased, 'quantity_purchased', { min: 1 });

    let parsedActualCost = null;
    try {
      parsedActualCost = parseOptionalNumber(actual_cost, 'actual_cost', { min: 0 });
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({ error: error.message });
    }

    const executionData = {
      care_task_id: req.params.id,
      user_id: req.user.uid,
      status,
      quantity_purchased: parsedQuantityPurchased,
      quantity_unit: quantity_unit || (taskData.task_type === 'PURCHASE' ? DEFAULT_PURCHASE_QUANTITY_UNIT : ''),
      actual_cost: parsedActualCost,
      evidence_url: null,
      scheduled_date: startOfDay(parsedScheduledDate),
      execution_date: parsedExecutionDate ? startOfDay(parsedExecutionDate) : null,
      covered_by_execution_ref: null,
      executed_by_uid: parsedExecutionDate ? req.user.uid : null,
      notes: notes || '',
      refund: null,
      quantity: 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    const executionsCollection = getTaskExecutionsCollection(req.user.uid, req.params.id);
    const docRef = await executionsCollection.add(executionData);
    const createdDoc = await docRef.get();

    res.status(201).json({
      message: 'Task execution created successfully',
      data: formatExecution(createdDoc)
    });
  } catch (error) {
    console.error('Error creating manual task execution:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to create task execution' : error.message });
  }
});

router.get('/:id/executions', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    await getOwnedCareTask(req.user.uid, req.params.id);

    let query = getTaskExecutionsCollection(req.user.uid, req.params.id);

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('scheduled_date', 'desc')
      .limit(parseInt(limit, 10))
      .offset(parseInt(offset, 10));

    const snapshot = await query.get();
    const executions = snapshot.docs.map(formatExecution);

    res.json({
      executions,
      count: executions.length,
      pagination: {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching task executions:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch task executions' : error.message });
  }
});

router.get('/:taskId/executions/:executionId', async (req, res) => {
  try {
    await getOwnedCareTask(req.user.uid, req.params.taskId);

    const executionRef = getTaskExecutionRef(req.user.uid, req.params.taskId, req.params.executionId);
    const executionDoc = await executionRef.get();

    if (!executionDoc.exists) {
      return res.status(404).json({ error: 'Task execution not found' });
    }

    res.json(formatExecution(executionDoc));
  } catch (error) {
    console.error('Error fetching task execution:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch task execution' : error.message });
  }
});

router.patch('/:taskId/executions/:executionId', async (req, res) => {
  try {
    await getOwnedCareTask(req.user.uid, req.params.taskId);

    const executionRef = getTaskExecutionRef(req.user.uid, req.params.taskId, req.params.executionId);
    const executionDoc = await executionRef.get();

    if (!executionDoc.exists) {
      return res.status(404).json({ error: 'Task execution not found' });
    }

    const {
      status,
      quantity_purchased,
      quantity_unit,
      actual_cost,
      scheduled_date,
      execution_date,
      notes,
      evidence_url,
      quantity
    } = req.body;

    const executionData = executionDoc.data();
    const executionsCollection = getTaskExecutionsCollection(req.user.uid, req.params.taskId);

    const updateData = {
      updated_at: new Date()
    };

    if (status !== undefined) {
      if (!EXECUTION_UPDATE_ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `status must be one of: ${EXECUTION_UPDATE_ALLOWED_STATUSES.join(', ')}`
        });
      }

      if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(status) && !executionData.refund) {
        return res.status(400).json({
          error: 'Use the refund endpoint to mark executions as refunded'
        });
      }

      if (executionData.refund && status !== executionData.status) {
        return res.status(400).json({
          error: 'Status cannot be changed after a refund has been recorded'
        });
      }

      updateData.status = status;
    }

    if (quantity_purchased !== undefined) {
      updateData.quantity_purchased = parseOptionalInteger(
        quantity_purchased,
        'quantity_purchased',
        { min: 1 }
      );
    }

    if (quantity_unit !== undefined) {
      updateData.quantity_unit = quantity_unit;
    }

    let parsedQuantity = null;
    if (quantity !== undefined) {
      parsedQuantity = parseOptionalInteger(quantity, 'quantity', { min: 1 });
    }

    let actualCostProvided = false;
    let parsedActualCost = null;
    if (actual_cost !== undefined) {
      actualCostProvided = true;
      parsedActualCost = parseOptionalNumber(actual_cost, 'actual_cost', { min: 0 });
    }

    if (scheduled_date !== undefined) {
      updateData.scheduled_date = requireDate(scheduled_date, 'scheduled_date');
    }

    if (execution_date !== undefined) {
      updateData.execution_date = execution_date ? requireDate(execution_date, 'execution_date') : null;
      updateData.executed_by_uid = execution_date ? req.user.uid : null;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (evidence_url !== undefined) {
      updateData.evidence_url = evidence_url;
    }

    const targetStatus = updateData.status || executionData.status;
    const existingQuantity = Number(executionData.quantity || 1);
    const desiredQuantity = Math.max(parsedQuantity || existingQuantity || 1, 1);

    let coverCandidates = [];
    if (targetStatus === 'DONE' && desiredQuantity > 1) {
      let coverQuery = executionsCollection.where('status', '==', 'TODO').orderBy('scheduled_date');
      const scheduledDateValue = executionData.scheduled_date ? toDate(executionData.scheduled_date) : null;

      if (scheduledDateValue) {
        coverQuery = coverQuery.startAfter(scheduledDateValue);
      }

      const snapshot = await coverQuery.limit(desiredQuantity - 1).get();
      coverCandidates = snapshot.docs;

      if (!scheduledDateValue) {
        coverCandidates = coverCandidates
          .filter((doc) => doc.id !== executionRef.id)
          .slice(0, desiredQuantity - 1);
      }
    }

    const appliedQuantity = targetStatus === 'DONE'
      ? Math.max(1, Math.min(desiredQuantity, 1 + coverCandidates.length))
      : desiredQuantity;

    updateData.quantity = appliedQuantity;

    if (actualCostProvided) {
      if (parsedActualCost === null) {
        updateData.actual_cost = null;
      } else if (executionData.task_type === 'PURCHASE') {
        updateData.actual_cost = Number((parsedActualCost / appliedQuantity).toFixed(2));
      } else {
        updateData.actual_cost = parsedActualCost;
      }
    }

    if (targetStatus === 'DONE' && updateData.execution_date === undefined) {
      updateData.execution_date = new Date();
      updateData.executed_by_uid = req.user.uid;
    }

    await executionRef.update(updateData);

    if (executionData.task_type === 'PURCHASE' && targetStatus === 'DONE' && coverCandidates.length > 0) {
      const sharedExecutionDate = toDate(updateData.execution_date ?? executionData.execution_date ?? new Date());
      const sharedEvidenceUrl = updateData.evidence_url !== undefined
        ? updateData.evidence_url
        : executionData.evidence_url ?? null;
      const sharedExecutedBy = updateData.executed_by_uid ?? executionData.executed_by_uid ?? req.user.uid;
      const perExecutionCostForCover = actualCostProvided
        ? updateData.actual_cost
        : executionData.actual_cost ?? null;
      const now = new Date();

      for (const doc of coverCandidates) {
        const coverUpdate = {
          status: 'COVERED',
          covered_by_execution_ref: executionRef.id,
          quantity: 1,
          updated_at: now,
          actual_cost: perExecutionCostForCover,
          evidence_url: sharedEvidenceUrl ?? null
        };

        if (sharedExecutionDate) {
          coverUpdate.execution_date = sharedExecutionDate;
        }

        if (sharedExecutedBy) {
          coverUpdate.executed_by_uid = sharedExecutedBy;
        }

        await doc.ref.update(coverUpdate);
      }
    }

    const updatedDoc = await executionRef.get();

    res.json({
      message: 'Task execution updated successfully',
      data: formatExecution(updatedDoc)
    });
  } catch (error) {
    console.error('Error updating task execution:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to update task execution' : error.message });
  }
});

// Record a refund against a purchase execution; refunds are immutable once stored.
router.post('/:taskId/executions/:executionId/refund', async (req, res) => {
  try {
    const { data: taskData } = await getOwnedCareTask(req.user.uid, req.params.taskId);

    if (taskData.task_type !== 'PURCHASE') {
      return res.status(400).json({ error: 'Refunds are only supported for purchase tasks' });
    }

    const executionRef = getTaskExecutionRef(req.user.uid, req.params.taskId, req.params.executionId);
    const executionDoc = await executionRef.get();

    if (!executionDoc.exists) {
      return res.status(404).json({ error: 'Task execution not found' });
    }

    const executionData = executionDoc.data();

    if (executionData.refund) {
      return res.status(400).json({ error: 'A refund has already been recorded for this execution' });
    }

    if (executionData.actual_cost === null || executionData.actual_cost === undefined) {
      return res.status(400).json({ error: 'A recorded actual_cost is required before processing a refund' });
    }

    const actualCost = Number(executionData.actual_cost);

    if (Number.isNaN(actualCost) || actualCost <= 0) {
      return res.status(400).json({ error: 'Cannot process a refund without a positive actual_cost' });
    }

    const refundAmount = requireNumber(req.body.refund_amount, 'refund_amount', { min: 0, max: actualCost });

    if (refundAmount <= 0) {
      return res.status(400).json({ error: 'refund_amount must be greater than 0' });
    }

    const parsedRefundDate = optionalDate(req.body.refund_date, 'refund_date');
    // Default the refund date to "today" if the caller omits it so reporting stays consistent.
    const refundDate = startOfDay(parsedRefundDate || new Date());

    const now = new Date();
    const refundRecord = {
      refund_amount: refundAmount,
      refund_reason: req.body.refund_reason || '',
      refund_evidence_url: req.body.refund_evidence_url || null,
      refund_date: refundDate,
      refunded_by_uid: req.user.uid,
      created_at: now
    };

    const amountsEqual = Math.abs(refundAmount - actualCost) < 0.000001;
    const nextStatus = amountsEqual ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await executionRef.update({
      refund: refundRecord,
      status: nextStatus,
      updated_at: now
    });

    const updatedDoc = await executionRef.get();

    res.status(201).json({
      message: 'Refund recorded successfully',
      data: formatExecution(updatedDoc)
    });
  } catch (error) {
    console.error('Error recording task execution refund:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to record refund' : error.message });
  }
});

const updateCareTaskHandler = async (req, res) => {
  try {
    const { ref, data: existingTask } = await getOwnedCareTask(req.user.uid, req.params.id);

    const {
      name,
      description,
      start_date,
      end_date,
      recurrence_interval_days,
      task_type,
      category_id,
      estimated_unit_cost,
      quantity_per_purchase,
      quantity_unit
    } = req.body;

    let parsedStartDate;
    let parsedEndDate;

    try {
      parsedStartDate = start_date !== undefined ? requireDate(start_date, 'start_date') : undefined;
      parsedEndDate = end_date !== undefined ? optionalDate(end_date, 'end_date') : undefined;
    } catch (parseError) {
      const status = parseError.status || 400;
      return res.status(status).json({ error: parseError.message });
    }

    const newTaskType = task_type !== undefined ? task_type : existingTask.task_type;
    if (newTaskType && !TASK_TYPES.includes(newTaskType)) {
      return res.status(400).json({ error: 'task_type must be either PURCHASE or GENERAL' });
    }

    if (category_id !== undefined && category_id !== null) {
      await ensureCategoryExists(req.user.uid, category_id);
    }

    const existingStartDate = toDate(existingTask.start_date);
    if (parsedEndDate && !parsedStartDate && existingStartDate && parsedEndDate < existingStartDate) {
      return res.status(400).json({ error: 'end_date cannot be earlier than start_date' });
    }

    let recurrenceInt;
    if (recurrence_interval_days !== undefined) {
      recurrenceInt = parseOptionalInteger(
        recurrence_interval_days,
        'recurrence_interval_days',
        { min: 0 }
      );
    }

    let parsedEstimatedUnitCost = null;
    if (estimated_unit_cost !== undefined) {
      parsedEstimatedUnitCost = parseOptionalNumber(
        estimated_unit_cost,
        'estimated_unit_cost',
        { min: 0 }
      );
    }

    let parsedQuantityPerPurchase = null;
    if (quantity_per_purchase !== undefined) {
      parsedQuantityPerPurchase = parseOptionalInteger(
        quantity_per_purchase,
        'quantity_per_purchase',
        { min: 1 }
      );
    }

    const updateData = {
      updated_at: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parsedStartDate !== undefined) updateData.start_date = parsedStartDate;
    if (parsedEndDate !== undefined) updateData.end_date = parsedEndDate;
    if (recurrenceInt !== undefined) updateData.recurrence_interval_days = recurrenceInt;
    if (task_type !== undefined) updateData.task_type = newTaskType;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (parsedEstimatedUnitCost !== null || estimated_unit_cost === null) {
      updateData.estimated_unit_cost = parsedEstimatedUnitCost;
    }
    if (parsedQuantityPerPurchase !== null || quantity_per_purchase === null) {
      updateData.quantity_per_purchase = parsedQuantityPerPurchase;
    }
    if (quantity_unit !== undefined) updateData.quantity_unit = quantity_unit;

    await ref.update(updateData);

    const updatedDoc = await ref.get();

    res.json({
      message: 'Care task updated successfully',
      data: formatCareTask(updatedDoc)
    });
  } catch (error) {
    console.error('Error updating care task:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to update care task' : error.message });
  }
};

router.put('/:id', updateCareTaskHandler);
router.patch('/:id', updateCareTaskHandler);

const deactivateCareTaskHandler = async (req, res) => {
  try {
    const { ref } = await getOwnedCareTask(req.user.uid, req.params.id);

    await ref.update({
      is_active: false,
      deactivated_at: new Date(),
      updated_at: new Date()
    });

    res.json({
      message: 'Care task deactivated successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deactivating care task:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to deactivate care task' : error.message });
  }
};

router.delete('/:id', deactivateCareTaskHandler);
router.post('/:id/deactivate', deactivateCareTaskHandler);

const reactivateCareTaskHandler = async (req, res) => {
  try {
    const { ref } = await getOwnedCareTask(req.user.uid, req.params.id);

    await ref.update({
      is_active: true,
      deactivated_at: null,
      updated_at: new Date()
    });

    res.json({
      message: 'Care task reactivated successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error reactivating care task:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to reactivate care task' : error.message });
  }
};

router.patch('/:id/reactivate', reactivateCareTaskHandler);
router.post('/:id/reactivate', reactivateCareTaskHandler);

router.post('/:id/generate-executions', async (req, res) => {
  try {
    const { data: taskData } = await getOwnedCareTask(req.user.uid, req.params.id);

    if (!taskData.is_active) {
      return res.status(400).json({ error: 'Cannot generate executions for inactive task' });
    }

    if (taskData.recurrence_interval_days === 0) {
      return res.status(400).json({ error: 'Cannot generate executions for one-off task' });
    }

    const executionId = await generateTaskExecution(req.user.uid, req.params.id, taskData);

    if (!executionId) {
      return res.json({
        message: 'No further executions generated because task end date has been reached',
        execution_id: null
      });
    }

    res.json({
      message: 'Task execution generated successfully',
      execution_id: executionId
    });
  } catch (error) {
    console.error('Error generating task execution:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to generate task execution' : error.message });
  }
});

// Create the next scheduled execution for a recurring task, respecting range limits.
const generateTaskExecution = async (uid, taskId, taskData, options = {}) => {
  try {
    const executionsCollection = getTaskExecutionsCollection(uid, taskId);

    const lastExecutionSnapshot = await executionsCollection
      .orderBy('scheduled_date', 'desc')
      .limit(1)
      .get();

    let nextScheduledDate;

    const startDate = startOfDay(toDate(taskData.start_date));
    if (!startDate) {
      const error = new Error('Task start_date is invalid');
      error.status = 400;
      throw error;
    }

    const endDate = taskData.end_date ? startOfDay(toDate(taskData.end_date)) : null;
    const recurrenceInterval = Number(taskData.recurrence_interval_days) || 0;

    if (lastExecutionSnapshot.empty) {
      nextScheduledDate = startDate;
    } else {
      const lastExecution = lastExecutionSnapshot.docs[0].data();
      const lastDate = startOfDay(toDate(lastExecution.scheduled_date));
      nextScheduledDate = addDays(lastDate || startDate, recurrenceInterval);
    }

    if (recurrenceInterval === 0) {
      return null;
    }

    const { minScheduledDate, maxScheduledDate } = options;

    if (minScheduledDate instanceof Date) {
      const minDate = startOfDay(minScheduledDate);
      while (nextScheduledDate < minDate) {
        nextScheduledDate = addDays(nextScheduledDate, recurrenceInterval);
        if (endDate && nextScheduledDate > endDate) {
          return null;
        }
        if (maxScheduledDate && nextScheduledDate > maxScheduledDate) {
          return null;
        }
      }
    }

    if (endDate && nextScheduledDate > endDate) {
      return null;
    }

    if (maxScheduledDate && nextScheduledDate > maxScheduledDate) {
      return null;
    }

    const scheduledDate = startOfDay(nextScheduledDate);

    const executionData = {
      care_task_id: taskId,
      user_id: uid,
      status: 'TODO',
      quantity_purchased: Number(taskData.quantity_per_purchase) || 1,
      quantity_unit: taskData.quantity_unit || (taskData.task_type === 'PURCHASE' ? DEFAULT_PURCHASE_QUANTITY_UNIT : ''),
      actual_cost: null,
      evidence_url: null,
      scheduled_date: scheduledDate,
      execution_date: null,
      covered_by_execution_ref: null,
      executed_by_uid: null,
      notes: '',
      refund: null,
      quantity: 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await executionsCollection.add(executionData);
    return docRef.id;
  } catch (error) {
    console.error('Error generating task execution:', error);
    throw error;
  }
};

module.exports = router;
module.exports._internal = {
  generateTaskExecution,
  startOfDay,
  startOfYear,
  endOfYear,
  addDays,
  toDate,
  getCareTasksCollection,
  getTaskExecutionsCollection
};
