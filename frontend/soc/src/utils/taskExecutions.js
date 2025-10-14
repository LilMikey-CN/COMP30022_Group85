import dayjs from 'dayjs';

export const COMPLETED_EXECUTION_STATUSES = new Set([
  'DONE',
  'COVERED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
]);

export const groupExecutionsByDate = (executions = []) => {
  const map = new Map();

  executions.forEach((execution) => {
    if (!execution?.scheduled_date) {
      return;
    }
    const scheduled = dayjs(execution.scheduled_date);
    if (!scheduled.isValid()) {
      return;
    }
    const key = scheduled.format('YYYY-MM-DD');
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(execution);
  });

  return map;
};

export const determineExecutionDayStatus = (executions = [], today = dayjs().startOf('day')) => {
  if (!executions.length) {
    return null;
  }

  let hasOverdue = false;
  let hasUpcoming = false;
  let hasCompleted = false;

  executions.forEach((execution) => {
    if (!execution || execution.status === 'CANCELLED') {
      return;
    }

    const scheduled = execution.scheduled_date ? dayjs(execution.scheduled_date) : null;
    if (!scheduled?.isValid()) {
      return;
    }

    if (COMPLETED_EXECUTION_STATUSES.has(execution.status)) {
      hasCompleted = true;
      return;
    }

    if (execution.status === 'TODO') {
      if (scheduled.isBefore(today, 'day')) {
        hasOverdue = true;
      } else {
        hasUpcoming = true;
      }
    }
  });

  if (hasOverdue) {
    return 'overdue';
  }
  if (hasUpcoming) {
    return 'upcoming';
  }
  if (hasCompleted) {
    return 'completed';
  }
  return null;
};

export const sortExecutionsByTaskThenDate = (executions = [], careTasksById = {}) => {
  return [...executions].sort((a, b) => {
    const aTask = careTasksById[a.care_task_id]?.name?.toLowerCase() || '';
    const bTask = careTasksById[b.care_task_id]?.name?.toLowerCase() || '';

    if (aTask !== bTask) {
      return aTask.localeCompare(bTask);
    }

    const aTime = a.scheduled_date ? dayjs(a.scheduled_date).valueOf() : 0;
    const bTime = b.scheduled_date ? dayjs(b.scheduled_date).valueOf() : 0;

    return aTime - bTime;
  });
};

export const computeCoverableExecutions = (execution, executions = [], careTasksById = {}) => {
  if (!execution) {
    return 0;
  }

  const parentTask = careTasksById[execution.care_task_id];
  if (!parentTask || parentTask.task_type !== 'PURCHASE') {
    return 0;
  }

  const baseScheduled = execution.scheduled_date ? dayjs(execution.scheduled_date) : null;
  const baseScheduledTime = baseScheduled ? baseScheduled.valueOf() : null;

  return executions
    .filter((candidate) => (
      candidate?.care_task_id === execution.care_task_id &&
      candidate.id !== execution.id &&
      candidate.status === 'TODO'
    ))
    .filter((candidate) => {
      if (!baseScheduled) {
        return true;
      }
      if (!candidate?.scheduled_date) {
        return false;
      }
      const candidateDate = dayjs(candidate.scheduled_date);
      if (!candidateDate.isValid()) {
        return false;
      }
      return candidateDate.valueOf() >= baseScheduledTime;
    })
    .length;
};

export const formatExecutionDate = (value, fallback = '—') => {
  if (!value) {
    return fallback;
  }
  return dayjs(value).format('DD MMM YYYY');
};
