import dayjs from 'dayjs';

export const filterExecutions = (
  executions = [],
  {
    searchTerm = '',
    startDateRange = null,
    careTasksById = {}
  } = {}
) => {
  const lowered = searchTerm.trim().toLowerCase();
  const [from, to] = startDateRange || [];
  const fromBoundary = from ? dayjs(from) : null;
  const toBoundary = to ? dayjs(to) : null;

  return executions.filter((execution) => {
    const parentTask = careTasksById[execution.care_task_id];
    if (!parentTask || parentTask.is_active === false) {
      return false;
    }
    const taskName = parentTask?.name?.toLowerCase() || '';
    const notes = execution.notes?.toLowerCase() || '';

    if (lowered && !taskName.includes(lowered) && !notes.includes(lowered)) {
      return false;
    }

    if (fromBoundary || toBoundary) {
      const scheduled = execution.scheduled_date ? dayjs(execution.scheduled_date) : null;
      if (fromBoundary && scheduled && scheduled.isBefore(fromBoundary, 'day')) {
        return false;
      }
      if (toBoundary && scheduled && scheduled.isAfter(toBoundary, 'day')) {
        return false;
      }
    }

    return true;
  });
};

export const sortExecutions = (executions = [], sortConfig, careTasksById = {}) => {
  if (!sortConfig) {
    return executions;
  }

  const { field, order } = sortConfig;

  const getValue = (execution) => {
    switch (field) {
      case 'task_name':
        return careTasksById[execution.care_task_id]?.name?.toLowerCase() || '';
      case 'status':
        return execution.status || '';
      case 'scheduled_date':
        return execution.scheduled_date ? dayjs(execution.scheduled_date).valueOf() : -Infinity;
      case 'execution_date':
        return execution.execution_date ? dayjs(execution.execution_date).valueOf() : Number.MAX_SAFE_INTEGER;
      case 'created_at':
        return execution.created_at ? dayjs(execution.created_at).valueOf() : -Infinity;
      case 'updated_at':
        return execution.updated_at ? dayjs(execution.updated_at).valueOf() : -Infinity;
      default:
        return execution.scheduled_date ? dayjs(execution.scheduled_date).valueOf() : -Infinity;
    }
  };

  return [...executions].sort((a, b) => {
    const valueA = getValue(a);
    const valueB = getValue(b);

    if (valueA === valueB) {
      return 0;
    }

    if (order === 'ascend') {
      return valueA > valueB ? 1 : -1;
    }
    return valueA > valueB ? -1 : 1;
  });
};

// Adds an `isOverdue` flag to executions so UI layers can highlight outstanding work.
export const annotateExecutionsWithOverdue = (executions = [], todayInput) => {
  const today = todayInput ? dayjs(todayInput).startOf('day') : dayjs().startOf('day');

  return executions.map((execution) => {
    const scheduled = execution?.scheduled_date ? dayjs(execution.scheduled_date) : null;
    const isOverdue =
      execution?.status === 'TODO' &&
      scheduled?.isValid() &&
      scheduled.isBefore(today, 'day');

    if (execution?.isOverdue === isOverdue) {
      return execution;
    }

    return {
      ...execution,
      isOverdue
    };
  });
};

export const countOverdueExecutions = (executions = []) =>
  executions.reduce((total, execution) => (execution?.isOverdue ? total + 1 : total), 0);
