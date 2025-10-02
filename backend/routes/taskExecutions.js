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

const getOwnedExecution = async (executionId, uid) => {
  const executionDoc = await db.collection('task_executions').doc(executionId).get();

  if (!executionDoc.exists) {
    const error = new Error('Task execution not found');
    error.status = 404;
    throw error;
  }

  const executionData = executionDoc.data();
  const careTaskDoc = await db.collection('care_tasks').doc(executionData.care_task_id).get();

  if (!careTaskDoc.exists) {
    const error = new Error('Parent care task not found');
    error.status = 404;
    throw error;
  }

  const careTaskData = careTaskDoc.data();
  if (careTaskData.created_by !== uid) {
    const error = new Error('Forbidden: Task execution does not belong to you');
    error.status = 403;
    throw error;
  }

  return { executionDoc, executionData, careTaskData };
};

// READ - Get all task executions with filtering
router.get('/', async (req, res) => {
  try {
    const {
      status,
      care_task_id,
      executed_by,
      date_from,
      date_to,
      limit = 100,
      offset = 0
    } = req.query;

    let query = db.collection('task_executions');

    const validStatuses = ['TODO', 'DONE', 'COVERED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    let parsedDateFrom;
    let parsedDateTo;

    try {
      parsedDateFrom = optionalDate(date_from, 'date_from');
      parsedDateTo = optionalDate(date_to, 'date_to');
    } catch (parseError) {
      const statusCode = parseError.status || 400;
      return res.status(statusCode).json({ error: parseError.message });
    }

    if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
      return res.status(400).json({ error: 'date_from cannot be after date_to' });
    }

    let allowedTaskIds = null;

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (care_task_id) {
      const careTaskDoc = await db.collection('care_tasks').doc(care_task_id).get();
      if (!careTaskDoc.exists) {
        return res.status(404).json({ error: 'Care task not found' });
      }

      if (careTaskDoc.data().created_by !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: Care task does not belong to you' });
      }

      query = query.where('care_task_id', '==', care_task_id);
    } else {
      const tasksSnapshot = await db.collection('care_tasks')
        .where('created_by', '==', req.user.uid)
        .get();

      allowedTaskIds = new Set();
      tasksSnapshot.forEach(taskDoc => allowedTaskIds.add(taskDoc.id));

      if (allowedTaskIds.size === 0) {
        return res.json({
          executions: [],
          count: 0,
          pagination: {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
          }
        });
      }
    }

    if (executed_by) {
      query = query.where('executed_by', '==', executed_by);
    }

    // Date range filtering (client-side since Firestore has limitations)
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    query = query.orderBy('scheduled_date', 'desc')
                 .limit(limitNum)
                 .offset(offsetNum);

    const snapshot = await query.get();
    let executions = snapshot.docs.map(formatExecution);

    if (allowedTaskIds) {
      executions = executions.filter(execution => allowedTaskIds.has(execution.care_task_id));
    }

    if (parsedDateFrom || parsedDateTo) {
      executions = executions.filter(execution => {
        const schedDate = execution.scheduled_date;
        if (!schedDate) {
          return false;
        }
        if (parsedDateFrom && schedDate < parsedDateFrom) {
          return false;
        }
        if (parsedDateTo && schedDate > parsedDateTo) {
          return false;
        }
        return true;
      });
    }

    res.json({
      executions,
      count: executions.length,
      pagination: {
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('Error fetching task executions:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch task executions' : error.message });
  }
});

// READ - Get specific task execution
router.get('/:id', async (req, res) => {
  try {
    const { executionDoc } = await getOwnedExecution(req.params.id, req.user.uid);
    res.json(formatExecution(executionDoc));
  } catch (error) {
    console.error('Error fetching task execution:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch task execution' : error.message });
  }
});

// UPDATE - Update task execution status and details
router.put('/:id', async (req, res) => {
  try {
    const executionRef = db.collection('task_executions').doc(req.params.id);
    const { executionDoc, executionData } = await getOwnedExecution(req.params.id, req.user.uid);

    const {
      status,
      quantity_purchased,
      quantity_unit,
      actual_cost,
      evidence_url,
      execution_date,
      notes
    } = req.body;

    // Validate status
    const validStatuses = ['TODO', 'DONE', 'COVERED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateData = { updated_at: new Date() };

    if (status !== undefined) {
      updateData.status = status;
      // Set execution_date if status is DONE and not already set
      if (status === 'DONE' && !execution_date && !executionData.execution_date) {
        updateData.execution_date = new Date();
        updateData.executed_by = req.user.uid;
      }
    }

    if (quantity_purchased !== undefined) {
      const parsedQuantity = parseInt(quantity_purchased, 10);
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({ error: 'quantity_purchased must be an integer greater than or equal to 1' });
      }
      updateData.quantity_purchased = parsedQuantity;
    }
    if (quantity_unit !== undefined) updateData.quantity_unit = quantity_unit;
    if (actual_cost !== undefined) {
      if (actual_cost === null || actual_cost === '') {
        updateData.actual_cost = null;
      } else {
        const parsedCost = parseFloat(actual_cost);
        if (Number.isNaN(parsedCost)) {
          return res.status(400).json({ error: 'actual_cost must be a valid number' });
        }
        updateData.actual_cost = parsedCost;
      }
    }
    if (evidence_url !== undefined) updateData.evidence_url = evidence_url;
    if (execution_date !== undefined) {
      try {
        updateData.execution_date = optionalDate(execution_date, 'execution_date');
      } catch (parseError) {
        const statusCode = parseError.status || 400;
        return res.status(statusCode).json({ error: parseError.message });
      }
      if (updateData.execution_date) {
        updateData.executed_by = req.user.uid;
      } else {
        updateData.executed_by = null;
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    await executionRef.update(updateData);

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

// COMPLETE - Convenience endpoint to mark execution as DONE
router.post('/:id/complete', async (req, res) => {
  try {
    const executionRef = db.collection('task_executions').doc(req.params.id);
    const { executionData } = await getOwnedExecution(req.params.id, req.user.uid);

    const {
      actual_cost,
      quantity_purchased,
      notes,
      execution_date
    } = req.body;

    const updateData = {
      status: 'DONE',
      updated_at: new Date(),
      executed_by: req.user.uid
    };

    try {
      updateData.execution_date = execution_date !== undefined
        ? optionalDate(execution_date, 'execution_date')
        : new Date();
    } catch (parseError) {
      const statusCode = parseError.status || 400;
      return res.status(statusCode).json({ error: parseError.message });
    }

    if (!updateData.execution_date) {
      updateData.execution_date = new Date();
    }

    if (actual_cost !== undefined) {
      if (actual_cost === null || actual_cost === '') {
        updateData.actual_cost = null;
      } else {
        const parsedCost = parseFloat(actual_cost);
        if (Number.isNaN(parsedCost)) {
          return res.status(400).json({ error: 'actual_cost must be a valid number' });
        }
        updateData.actual_cost = parsedCost;
      }
    }

    if (quantity_purchased !== undefined) {
      const parsedQuantity = parseInt(quantity_purchased, 10);
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({ error: 'quantity_purchased must be an integer greater than or equal to 1' });
      }
      updateData.quantity_purchased = parsedQuantity;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await executionRef.update(updateData);

    const updatedDoc = await executionRef.get();

    res.json({
      message: 'Task execution marked as complete',
      data: formatExecution(updatedDoc)
    });
  } catch (error) {
    console.error('Error marking execution complete:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to complete task execution' : error.message });
  }
});

// PATCH - Mark execution as covering other executions (bulk purchase)
router.patch('/:id/cover-executions', async (req, res) => {
  try {
    const { execution_ids } = req.body;

    if (!Array.isArray(execution_ids) || execution_ids.length === 0) {
      return res.status(400).json({
        error: 'execution_ids must be a non-empty array'
      });
    }

    await getOwnedExecution(req.params.id, req.user.uid);

    const batch = db.batch();

    // Update covered executions
    for (const executionId of execution_ids) {
      const executionRef = db.collection('task_executions').doc(executionId);
      await getOwnedExecution(executionId, req.user.uid);

      batch.update(executionRef, {
        status: 'COVERED',
        covered_by_execution_id: req.params.id,
        updated_at: new Date()
      });
    }

    await batch.commit();

    res.json({
      message: `${execution_ids.length} executions marked as covered`,
      covered_executions: execution_ids,
      covering_execution_id: req.params.id
    });
  } catch (error) {
    console.error('Error covering executions:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to cover executions' : error.message });
  }
});

// GET - Get executions covered by this execution
router.get('/:id/covered-executions', async (req, res) => {
  try {
    await getOwnedExecution(req.params.id, req.user.uid);

    const snapshot = await db.collection('task_executions')
      .where('covered_by_execution_id', '==', req.params.id)
      .get();

    const coveredExecutions = snapshot.docs.map(formatExecution);

    res.json({ covered_executions });
  } catch (error) {
    console.error('Error fetching covered executions:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to fetch covered executions' : error.message });
  }
});

module.exports = router;
