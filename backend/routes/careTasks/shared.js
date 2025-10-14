const { db, auth, admin } = require('../../config/firebase');
const { readCategoriesDoc, findCategoryById } = require('../../utils/categories');
const {
  DEFAULT_PURCHASE_QUANTITY_UNIT
} = require('../../constants/tasks');
const {
  startOfDay,
  startOfYear,
  endOfYear,
  addDays
} = require('../../utils/careTaskTime');
const {
  toDate
} = require('../../utils/careTaskValidation');

const FieldValue = admin.firestore.FieldValue;

const getUserRef = (uid) => db.collection('users').doc(uid);
const getCareTasksCollection = (uid) => getUserRef(uid).collection('care_tasks');
const getCareTaskRef = (uid, taskId) => getCareTasksCollection(uid).doc(taskId);
const getTaskExecutionsCollection = (uid, taskId) =>
  getCareTaskRef(uid, taskId).collection('task_executions');
const getTaskExecutionRef = (uid, taskId, executionId) =>
  getTaskExecutionsCollection(uid, taskId).doc(executionId);
const getBudgetTransfersCollection = (uid) =>
  getUserRef(uid).collection('care_task_budget_transfers');

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

const calculateNetSpendFromExecutions = (executionDocs) => {
  return executionDocs.reduce((total, executionDoc) => {
    const executionData = typeof executionDoc.data === 'function'
      ? executionDoc.data()
      : executionDoc;

    const rawActual = Number(executionData?.actual_cost ?? 0);
    const actualCost = Number.isFinite(rawActual) ? rawActual : 0;

    const rawRefund = Number(executionData?.refund?.refund_amount ?? 0);
    const refundAmount = Number.isFinite(rawRefund) ? rawRefund : 0;

    const net = actualCost - refundAmount;
    return total + Math.max(net, 0);
  }, 0);
};

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
      quantity_unit: taskData.quantity_unit || (taskData.task_type === 'PURCHASE'
        ? DEFAULT_PURCHASE_QUANTITY_UNIT
        : ''),
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

module.exports = {
  db,
  auth,
  FieldValue,
  getUserRef,
  getCareTasksCollection,
  getCareTaskRef,
  getTaskExecutionsCollection,
  getTaskExecutionRef,
  getBudgetTransfersCollection,
  formatCareTask,
  formatExecution,
  ensureCategoryExists,
  getOwnedCareTask,
  calculateNetSpendFromExecutions,
  generateTaskExecution,
  startOfDay,
  startOfYear,
  endOfYear,
  addDays,
  toDate
};
