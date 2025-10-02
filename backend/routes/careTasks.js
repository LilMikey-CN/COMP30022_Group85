const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

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

const requireDate = (value, fieldName) => {
  const parsed = toDate(value);
  if (!parsed) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

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

const formatCareTask = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    start_date: toDate(data.start_date),
    end_date: toDate(data.end_date),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    deactivated_at: toDate(data.deactivated_at)
  };
};

const formatExecution = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    scheduled_date: toDate(data.scheduled_date),
    execution_date: toDate(data.execution_date),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at)
  };
};

const getOwnedCareTask = async (taskId, uid) => {
  const doc = await db.collection('care_tasks').doc(taskId).get();

  if (!doc.exists) {
    const error = new Error('Care task not found');
    error.status = 404;
    throw error;
  }

  const data = doc.data();
  if (data.created_by !== uid) {
    const error = new Error('Forbidden: Care task does not belong to you');
    error.status = 403;
    throw error;
  }

  return { doc, data };
};

// CREATE - Add new care task
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      start_date,
      end_date,
      recurrence_interval_days,
      task_type,
      care_item_id
    } = req.body;

    // Validation
    if (!name || !start_date || recurrence_interval_days === undefined || !task_type) {
      return res.status(400).json({
        error: 'Missing required fields: name, start_date, recurrence_interval_days, task_type'
      });
    }

    // Validate task_type
    if (!['PURCHASE', 'GENERAL'].includes(task_type)) {
      return res.status(400).json({
        error: 'task_type must be either PURCHASE or GENERAL'
      });
    }

    if (task_type === 'PURCHASE' && !care_item_id) {
      return res.status(400).json({
        error: 'care_item_id is required when task_type is PURCHASE'
      });
    }

    const recurrenceInt = parseInt(recurrence_interval_days, 10);
    if (!Number.isInteger(recurrenceInt) || recurrenceInt < 0) {
      return res.status(400).json({
        error: 'recurrence_interval_days must be an integer greater than or equal to 0'
      });
    }

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

    // If care_item_id provided, verify it exists
    if (care_item_id) {
      const careItemDoc = await db.collection('care_items').doc(care_item_id).get();
      if (!careItemDoc.exists) {
        return res.status(404).json({ error: 'Care item not found' });
      }

      if (careItemDoc.data().created_by !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: Care item does not belong to you' });
      }
    }

    const careTaskData = {
      name,
      description: description || '',
      start_date: parsedStartDate,
      end_date: parsedEndDate,
      recurrence_interval_days: recurrenceInt,
      task_type,
      is_active: true,
      care_item_id: care_item_id || null,
      created_by: req.user.uid,
      deactivated_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await db.collection('care_tasks').add(careTaskData);

    // Auto-generate first task execution
    const executionId = await generateTaskExecution(docRef.id, careTaskData);

    const createdDoc = await db.collection('care_tasks').doc(docRef.id).get();

    res.status(201).json({
      message: 'Care task created successfully',
      id: docRef.id,
      data: formatCareTask(createdDoc),
      generated_execution_id: executionId
    });
  } catch (error) {
    console.error('Error creating care task:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to create care task' : error.message });
  }
});

// READ - Get all care tasks with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      task_type,
      care_item_id,
      is_active = 'true',
      limit = 50,
      offset = 0,
      start_date_from,
      start_date_to
    } = req.query;

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

    let query = db.collection('care_tasks').where('created_by', '==', req.user.uid);

    // Filter by active status
    if (is_active !== 'all') {
      query = query.where('is_active', '==', is_active === 'true');
    }

    // Filter by task type
    if (task_type) {
      if (!['PURCHASE', 'GENERAL'].includes(task_type)) {
        return res.status(400).json({ error: 'task_type must be either PURCHASE or GENERAL' });
      }
      query = query.where('task_type', '==', task_type);
    }

    // Filter by care item
    if (care_item_id) {
      query = query.where('care_item_id', '==', care_item_id);
    }

    // Apply pagination
    query = query.orderBy('created_at', 'desc')
                 .limit(parseInt(limit, 10))
                 .offset(parseInt(offset, 10));

    const snapshot = await query.get();
    let careTasks = snapshot.docs.map(formatCareTask);

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

    res.json({
      care_tasks: careTasks,
      count: careTasks.length,
      pagination: {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching care tasks:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch care tasks' : error.message });
  }
});

// READ - Get specific care task by ID
router.get('/:id', async (req, res) => {
  try {
    const { doc } = await getOwnedCareTask(req.params.id, req.user.uid);
    res.json(formatCareTask(doc));
  } catch (error) {
    console.error('Error fetching care task:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch care task' : error.message });
  }
});

// CREATE - Manually add a task execution to a care task
router.post('/:id/executions', async (req, res) => {
  try {
    const { data: taskData } = await getOwnedCareTask(req.params.id, req.user.uid);

    const {
      scheduled_date,
      execution_date,
      status = 'TODO',
      quantity_purchased = 1,
      quantity_unit,
      actual_cost = null,
      notes = ''
    } = req.body;

    const allowedStatuses = ['TODO', 'DONE', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatuses.join(', ')}`
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

    const parsedQuantityPurchased = parseInt(quantity_purchased, 10);
    if (!Number.isInteger(parsedQuantityPurchased) || parsedQuantityPurchased < 1) {
      return res.status(400).json({ error: 'quantity_purchased must be an integer greater than or equal to 1' });
    }

    let parsedActualCost = null;
    if (actual_cost !== null && actual_cost !== undefined && actual_cost !== '') {
      const cost = parseFloat(actual_cost);
      if (Number.isNaN(cost)) {
        return res.status(400).json({ error: 'actual_cost must be a valid number' });
      }
      parsedActualCost = cost;
    }

    const executionData = {
      care_task_id: req.params.id,
      status,
      quantity_purchased: parsedQuantityPurchased,
      quantity_unit: quantity_unit || (taskData.task_type === 'PURCHASE' ? 'piece' : ''),
      actual_cost: parsedActualCost,
      evidence_url: null,
      scheduled_date: parsedScheduledDate,
      execution_date: parsedExecutionDate,
      covered_by_execution_id: null,
      executed_by: parsedExecutionDate ? req.user.uid : null,
      notes: notes || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await db.collection('task_executions').add(executionData);
    const createdDoc = await db.collection('task_executions').doc(docRef.id).get();

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

// READ - Get task executions for a specific care task
router.get('/:id/executions', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    await getOwnedCareTask(req.params.id, req.user.uid);

    let query = db.collection('task_executions')
                  .where('care_task_id', '==', req.params.id);

    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('scheduled_date', 'desc')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));

    const snapshot = await query.get();
    const executions = snapshot.docs.map(formatExecution);

    res.json({
      executions,
      count: executions.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching task executions:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch task executions' : error.message });
  }
});

// UPDATE - Update care task
const updateCareTaskHandler = async (req, res) => {
  try {
    const careTaskRef = db.collection('care_tasks').doc(req.params.id);
    const { data: existingTask } = await getOwnedCareTask(req.params.id, req.user.uid);

    const {
      name,
      description,
      start_date,
      end_date,
      recurrence_interval_days,
      task_type,
      care_item_id
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
    if (newTaskType && !['PURCHASE', 'GENERAL'].includes(newTaskType)) {
      return res.status(400).json({ error: 'task_type must be either PURCHASE or GENERAL' });
    }

    const newCareItemId = care_item_id !== undefined ? care_item_id : existingTask.care_item_id;

    if (newTaskType === 'PURCHASE' && !newCareItemId) {
      return res.status(400).json({ error: 'care_item_id is required when task_type is PURCHASE' });
    }

    if (care_item_id !== undefined && care_item_id) {
      const careItemDoc = await db.collection('care_items').doc(care_item_id).get();
      if (!careItemDoc.exists) {
        return res.status(404).json({ error: 'Care item not found' });
      }
      if (careItemDoc.data().created_by !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: Care item does not belong to you' });
      }
    }

    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      return res.status(400).json({ error: 'end_date cannot be earlier than start_date' });
    }

    const existingStartDate = toDate(existingTask.start_date);
    if (parsedEndDate && !parsedStartDate && existingStartDate && parsedEndDate < existingStartDate) {
      return res.status(400).json({ error: 'end_date cannot be earlier than start_date' });
    }

    let recurrenceInt;
    if (recurrence_interval_days !== undefined) {
      recurrenceInt = parseInt(recurrence_interval_days, 10);
      if (!Number.isInteger(recurrenceInt) || recurrenceInt < 0) {
        return res.status(400).json({ error: 'recurrence_interval_days must be an integer greater than or equal to 0' });
      }
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
    if (care_item_id !== undefined) updateData.care_item_id = care_item_id || null;

    await careTaskRef.update(updateData);

    const updatedDoc = await careTaskRef.get();

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

// SOFT DELETE - Deactivate care task
const deactivateCareTaskHandler = async (req, res) => {
  try {
    const careTaskRef = db.collection('care_tasks').doc(req.params.id);
    await getOwnedCareTask(req.params.id, req.user.uid);

    const updateData = {
      is_active: false,
      deactivated_at: new Date(),
      updated_at: new Date()
    };

    await careTaskRef.update(updateData);

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

// REACTIVATE - Reactivate a soft-deleted care task
const reactivateCareTaskHandler = async (req, res) => {
  try {
    const careTaskRef = db.collection('care_tasks').doc(req.params.id);
    await getOwnedCareTask(req.params.id, req.user.uid);

    const updateData = {
      is_active: true,
      deactivated_at: null,
      updated_at: new Date()
    };

    await careTaskRef.update(updateData);

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

// GENERATE - Generate next task executions for recurring tasks
router.post('/:id/generate-executions', async (req, res) => {
  try {
    const careTaskRef = db.collection('care_tasks').doc(req.params.id);
    const { data: taskData } = await getOwnedCareTask(req.params.id, req.user.uid);

    if (!taskData.is_active) {
      return res.status(400).json({ error: 'Cannot generate executions for inactive task' });
    }

    if (taskData.recurrence_interval_days === 0) {
      return res.status(400).json({ error: 'Cannot generate executions for one-off task' });
    }

    // Generate next execution
    const executionId = await generateTaskExecution(req.params.id, taskData);

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

// Helper function to generate task executions
async function generateTaskExecution(careTaskId, taskData) {
  try {
    // Find the last execution to determine next scheduled date
    const lastExecutionSnapshot = await db.collection('task_executions')
      .where('care_task_id', '==', careTaskId)
      .orderBy('scheduled_date', 'desc')
      .limit(1)
      .get();

    let nextScheduledDate;

    const startDate = toDate(taskData.start_date);
    if (!startDate) {
      const error = new Error('Task start_date is invalid');
      error.status = 400;
      throw error;
    }

    const endDate = toDate(taskData.end_date);
    const recurrenceInterval = Number(taskData.recurrence_interval_days) || 0;

    if (lastExecutionSnapshot.empty) {
      // First execution - use task start date
      nextScheduledDate = startDate;
    } else {
      // Calculate next date based on recurrence
      const lastExecution = lastExecutionSnapshot.docs[0].data();
      const lastDate = toDate(lastExecution.scheduled_date);
      nextScheduledDate = new Date(lastDate || startDate);
      nextScheduledDate.setDate(nextScheduledDate.getDate() + recurrenceInterval);
    }

    // Check if we should stop generating (past end_date)
    if (endDate && nextScheduledDate > endDate) {
      return null;
    }

    const executionData = {
      care_task_id: careTaskId,
      status: 'TODO',
      quantity_purchased: 1,
      quantity_unit: taskData.task_type === 'PURCHASE' ? 'piece' : '',
      actual_cost: null,
      evidence_url: null,
      scheduled_date: nextScheduledDate,
      execution_date: null,
      covered_by_execution_id: null,
      executed_by: null,
      notes: '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await db.collection('task_executions').add(executionData);
    return docRef.id;
  } catch (error) {
    console.error('Error generating task execution:', error);
    throw error;
  }
}

module.exports = router;
