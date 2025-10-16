const {
  TASK_TYPES,
  DEFAULT_PURCHASE_QUANTITY_UNIT
} = require('../../constants/tasks');
const {
  requireDate,
  optionalDate,
  parseOptionalNumber,
  parseOptionalInteger
} = require('../../utils/careTaskValidation');
const {
  startOfDay,
  endOfYear
} = require('../../utils/careTaskTime');
const {
  getCareTasksCollection,
  getOwnedCareTask,
  getTaskExecutionsCollection,
  formatCareTask,
  ensureCategoryExists,
  generateTaskExecution,
  toDate
} = require('./shared');

const registerTaskRoutes = (router) => {
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
        yearly_budget,
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

      let parsedYearlyBudget = null;
      try {
        parsedYearlyBudget = parseOptionalNumber(yearly_budget, 'yearly_budget', { min: 0 });
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
        yearly_budget: parsedYearlyBudget,
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

      const tasksCollection = getCareTasksCollection(req.user.uid);

      let query = tasksCollection.orderBy('created_at', 'desc');

      if (task_type) {
        query = query.where('task_type', '==', task_type);
      }
      if (category_id) {
        query = query.where('category_id', '==', category_id);
      }

      const limitNum = Number(limit);
      const offsetNum = Number(offset);

      const snapshot = await query.get();
      let careTasks = snapshot.docs.map(formatCareTask);

      if (is_active !== 'all') {
        const activeFlag = is_active === 'true';
        careTasks = careTasks.filter((task) => Boolean(task.is_active) === activeFlag);
      }

      if (start_date_from) {
        const fromDate = requireDate(start_date_from, 'start_date_from');
        careTasks = careTasks.filter((task) => {
          const taskStart = task.start_date ? new Date(task.start_date) : null;
          return taskStart ? taskStart >= fromDate : false;
        });
      }

      if (start_date_to) {
        const toDate = requireDate(start_date_to, 'start_date_to');
        careTasks = careTasks.filter((task) => {
          const taskStart = task.start_date ? new Date(task.start_date) : null;
          return taskStart ? taskStart <= toDate : false;
        });
      }

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
        yearly_budget,
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

      const existingStartDate = existingTask.start_date ? new Date(existingTask.start_date) : null;
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

      let parsedYearlyBudget = null;
      if (yearly_budget !== undefined) {
        parsedYearlyBudget = parseOptionalNumber(
          yearly_budget,
          'yearly_budget',
          { min: 0 }
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
      if (parsedYearlyBudget !== null || yearly_budget === null) {
        updateData.yearly_budget = parsedYearlyBudget;
      }

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

  router.post('/:id/generate-executions/rest', async (req, res) => {
    try {
      const { data: taskData } = await getOwnedCareTask(req.user.uid, req.params.id);

      if (!taskData.is_active) {
        return res.status(400).json({ error: 'Cannot generate executions for inactive task' });
      }

      const recurrenceInterval = Number(taskData.recurrence_interval_days ?? 0);
      if (recurrenceInterval === 0) {
        return res.status(400).json({ error: 'Cannot generate executions for one-off task' });
      }

      const currentYearEnd = endOfYear(new Date().getFullYear());
      const endDate = taskData.end_date ? startOfDay(toDate(taskData.end_date)) : null;
      const maxScheduledDate = endDate
        ? new Date(Math.min(endDate.getTime(), currentYearEnd.getTime()))
        : currentYearEnd;

      const generatedIds = [];

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const executionId = await generateTaskExecution(req.user.uid, req.params.id, taskData, {
          maxScheduledDate
        });
        if (!executionId) {
          break;
        }
        generatedIds.push(executionId);
      }

      if (generatedIds.length === 0) {
        return res.json({
          generated_count: 0,
          execution_ids: [],
          message: 'Schedule already up to date for the current year'
        });
      }

      res.json({
        generated_count: generatedIds.length,
        execution_ids: generatedIds,
        message: `Generated ${generatedIds.length} execution${generatedIds.length === 1 ? '' : 's'} up to ${maxScheduledDate.toISOString().substring(0, 10)}`
      });
    } catch (error) {
      console.error('Error generating remaining executions:', error);
      const status = error.status || 500;
      res.status(status).json({ error: status === 500 ? 'Failed to generate remaining task executions' : error.message });
    }
  });
};

module.exports = {
  registerTaskRoutes
};
