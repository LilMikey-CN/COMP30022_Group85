const {
  EXECUTION_CREATION_ALLOWED_STATUSES,
  EXECUTION_UPDATE_ALLOWED_STATUSES,
  DEFAULT_PURCHASE_QUANTITY_UNIT
} = require('../../constants/tasks');
const {
  requireDate,
  optionalDate,
  parseOptionalInteger,
  parseOptionalNumber,
  requireNumber
} = require('../../utils/careTaskValidation');
const { startOfDay } = require('../../utils/careTaskTime');
const {
  toDate,
  getOwnedCareTask,
  getTaskExecutionsCollection,
  getTaskExecutionRef,
  formatExecution
} = require('./shared');

const formatDateForNote = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().substring(0, 10);
};

const registerExecutionRoutes = (router) => {
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

      const parsedQuantityPurchased = parseOptionalInteger(
        quantity_purchased,
        'quantity_purchased',
        { min: 1 }
      );

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
      const { data: taskData } = await getOwnedCareTask(req.user.uid, req.params.taskId);

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

      let refundUpdateRequested = false;
      let shouldRecalculateRefundStatus = false;

      if (req.body.refund !== undefined) {
        if (!executionData.refund) {
          return res.status(400).json({ error: 'No refund has been recorded for this execution' });
        }

        const incomingRefund = req.body.refund || {};
        const nextRefund = { ...executionData.refund };

        if (incomingRefund.refund_amount !== undefined) {
          const parsedRefundAmount = parseOptionalNumber(
            incomingRefund.refund_amount,
            'refund.refund_amount',
            { min: 0 }
          );

          if (parsedRefundAmount === null || parsedRefundAmount <= 0) {
            return res.status(400).json({ error: 'refund_amount must be greater than 0 when updating a refund' });
          }

          nextRefund.refund_amount = parsedRefundAmount;
          refundUpdateRequested = true;
        }

        if (incomingRefund.refund_reason !== undefined) {
          nextRefund.refund_reason = incomingRefund.refund_reason || '';
          refundUpdateRequested = true;
        }

        if (incomingRefund.refund_evidence_url !== undefined) {
          nextRefund.refund_evidence_url = incomingRefund.refund_evidence_url || null;
          refundUpdateRequested = true;
        }

        if (incomingRefund.refund_date !== undefined) {
          const parsedRefundDate = incomingRefund.refund_date
            ? optionalDate(incomingRefund.refund_date, 'refund.refund_date')
            : null;
          nextRefund.refund_date = parsedRefundDate ? startOfDay(parsedRefundDate) : null;
          refundUpdateRequested = true;
        }

        if (refundUpdateRequested) {
          nextRefund.updated_at = new Date();
        }

        updateData.refund = nextRefund;
        shouldRecalculateRefundStatus = true;
      }

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

      let parsedActualCost = null;
      let actualCostProvided = false;
      if (actual_cost !== undefined) {
        parsedActualCost = parseOptionalNumber(
          actual_cost,
          'actual_cost',
          { min: 0 }
        );
        actualCostProvided = true;
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

      let parsedQuantity = null;
      if (quantity !== undefined) {
        parsedQuantity = parseOptionalInteger(quantity, 'quantity', { min: 1 });
      }

      let targetStatus = updateData.status || executionData.status;
      const existingQuantity = Number(executionData.quantity || 1);
      const desiredQuantity = Math.max(parsedQuantity || existingQuantity || 1, 1);
      const isPurchaseTask = taskData.task_type === 'PURCHASE';

      let coverCandidates = [];
      if (isPurchaseTask && targetStatus === 'DONE' && desiredQuantity > 1) {
        const scheduledDateValue = executionData.scheduled_date ? toDate(executionData.scheduled_date) : null;
        const snapshot = await executionsCollection
          .where('status', '==', 'TODO')
          .orderBy('scheduled_date')
          .get();

        coverCandidates = snapshot.docs
          .filter((doc) => doc.id !== executionRef.id)
          .filter((doc) => {
            if (!scheduledDateValue) {
              return true;
            }
            const candidateData = doc.data() || {};
            const candidateDate = candidateData.scheduled_date ? toDate(candidateData.scheduled_date) : null;
            if (!candidateDate) {
              return false;
            }
            return candidateDate.getTime() >= scheduledDateValue.getTime();
          })
          .slice(0, Math.max(desiredQuantity - 1, 0));
      }

      const appliedQuantity = targetStatus === 'DONE'
        ? Math.max(1, Math.min(desiredQuantity, 1 + coverCandidates.length))
        : desiredQuantity;

      updateData.quantity = appliedQuantity;

      if (actualCostProvided) {
        if (parsedActualCost === null) {
          updateData.actual_cost = null;
        } else if (isPurchaseTask) {
          updateData.actual_cost = Number((parsedActualCost / appliedQuantity).toFixed(2));
        } else {
          updateData.actual_cost = parsedActualCost;
        }

        if (executionData.refund || updateData.refund) {
          shouldRecalculateRefundStatus = true;
        }
      }

      if (shouldRecalculateRefundStatus) {
        const refundData = updateData.refund || executionData.refund;

        if (!refundData) {
          return res.status(400).json({ error: 'No refund has been recorded for this execution' });
        }

        const refundAmountValue = Number(refundData.refund_amount);
        if (!Number.isFinite(refundAmountValue) || refundAmountValue < 0) {
          return res.status(400).json({ error: 'refund_amount must be a valid number' });
        }

        const actualCostValue = updateData.actual_cost !== undefined && updateData.actual_cost !== null
          ? Number(updateData.actual_cost)
          : Number(executionData.actual_cost ?? 0);

        if (!Number.isFinite(actualCostValue) || actualCostValue <= 0) {
          return res.status(400).json({ error: 'A positive actual_cost is required to update a refund' });
        }

        if (refundAmountValue > actualCostValue) {
          return res.status(400).json({ error: 'Refund amount cannot exceed actual cost' });
        }

        const amountsEqual = Math.abs(refundAmountValue - actualCostValue) < 0.000001;
        updateData.status = amountsEqual ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      }

      targetStatus = updateData.status || executionData.status;

      if (targetStatus === 'DONE' && updateData.execution_date !== undefined) {
        if (updateData.execution_date) {
          updateData.executed_by_uid = req.user.uid;
        } else {
          updateData.execution_date = null;
          updateData.executed_by_uid = null;
        }
      }

      await executionRef.update(updateData);

      if (isPurchaseTask && targetStatus === 'DONE' && coverCandidates.length > 0) {
        const sharedExecutionDate = updateData.execution_date !== undefined
          ? (updateData.execution_date ? toDate(updateData.execution_date) : null)
          : (executionData.execution_date ? toDate(executionData.execution_date) : null);
        const sharedEvidenceUrl = updateData.evidence_url !== undefined
          ? updateData.evidence_url
          : executionData.evidence_url ?? null;
        const sharedExecutedBy = updateData.executed_by_uid ?? executionData.executed_by_uid ?? req.user.uid;
        const perExecutionCostForCover = actualCostProvided
          ? updateData.actual_cost
          : executionData.actual_cost ?? null;
        const now = new Date();

        const coverageNoteDate = formatDateForNote(sharedExecutionDate);
        for (const doc of coverCandidates) {
          const coverUpdate = {
            status: 'COVERED',
            covered_by_execution_ref: executionRef.id,
            quantity: 1,
            updated_at: now,
            actual_cost: perExecutionCostForCover,
            evidence_url: sharedEvidenceUrl ?? null,
            notes: coverageNoteDate
              ? `covered by the purchase on ${coverageNoteDate}`
              : 'covered by the purchase'
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
};

module.exports = {
  registerExecutionRoutes
};
