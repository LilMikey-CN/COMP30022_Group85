const { db } = require('../config/firebase');
const careTasksModule = require('../routes/careTasks');

const {
  generateTaskExecution,
  startOfDay,
  startOfYear,
  endOfYear,
  toDate
} = careTasksModule._internal;

const MS_IN_DAY = 24 * 60 * 60 * 1000;

let schedulerStarted = false;
let scheduledTimeout = null;

const normalizeDate = (value) => {
  const parsed = toDate(value);
  return parsed ? startOfDay(parsed) : null;
};

const calculateNextRunDelay = () => {
  const now = new Date();
  const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 10, 0, 0);
  return Math.max(nextRun.getTime() - now.getTime(), MS_IN_DAY);
};

// Generate any missing executions for a single recurring task inside a user doc.
const generateForTask = async (taskDoc, currentYear) => {
  const taskData = taskDoc.data();
  if (!taskData || taskData.is_active === false) {
    return 0;
  }

  const recurrence = Number(taskData.recurrence_interval_days || 0);
  if (recurrence === 0) {
    return 0;
  }

  const startDate = normalizeDate(taskData.start_date);
  if (!startDate) {
    return 0;
  }

  if (startDate.getFullYear() > currentYear) {
    return 0;
  }

  const rangeStart = startOfYear(currentYear);
  const calendarRangeEnd = endOfYear(currentYear);
  const taskEndDate = taskData.end_date ? normalizeDate(taskData.end_date) : null;
  const rangeEnd = taskEndDate && taskEndDate < calendarRangeEnd ? taskEndDate : calendarRangeEnd;

  if (rangeEnd < rangeStart) {
    return 0;
  }

  const generationOptions = {
    minScheduledDate: rangeStart,
    maxScheduledDate: rangeEnd
  };

  const normalizedTaskData = {
    ...taskData,
    start_date: startDate,
    end_date: taskEndDate
  };

  let createdCount = 0;
  let createdId;

  const userRef = taskDoc.ref.parent.parent;
  if (!userRef) {
    return 0;
  }

  const uid = userRef.id;

  do {
    // eslint-disable-next-line no-await-in-loop
    createdId = await generateTaskExecution(uid, taskDoc.id, normalizedTaskData, generationOptions);
    if (createdId) {
      createdCount += 1;
    }
  } while (createdId);

  return createdCount;
};

const runDailyGeneration = async () => {
  const now = new Date();
  const currentYear = now.getFullYear();

  try {
    const snapshot = await db
      .collectionGroup('care_tasks')
      .where('is_active', '==', true)
      .get();

    let totalGenerated = 0;

    for (const doc of snapshot.docs) {
      // eslint-disable-next-line no-await-in-loop
      totalGenerated += await generateForTask(doc, currentYear);
    }

    if (totalGenerated > 0) {
      console.info(`Task scheduler generated ${totalGenerated} execution(s) for year ${currentYear}`);
    }
  } catch (error) {
    console.error('Task scheduler failed to generate executions:', error);
  }
};

const scheduleNextRun = () => {
  const delay = calculateNextRunDelay();
  scheduledTimeout = setTimeout(async () => {
    await runDailyGeneration();
    scheduleNextRun();
  }, delay);

  if (typeof scheduledTimeout.unref === 'function') {
    scheduledTimeout.unref();
  }
};

const startTaskExecutionScheduler = () => {
  if (schedulerStarted) {
    return;
  }

  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_TASK_SCHEDULER === 'true') {
    return;
  }

  schedulerStarted = true;

  runDailyGeneration().finally(() => {
    scheduleNextRun();
  });
};

module.exports = {
  startTaskExecutionScheduler,
  _internal: {
    runDailyGeneration,
    generateForTask,
    calculateNextRunDelay
  }
};
