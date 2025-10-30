import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatCurrency } from './budgetAnalytics';

dayjs.extend(relativeTime);

const TODO_STATUSES = new Set(['TODO']);
const MAX_DAYS_AHEAD = 3;

const normaliseExecutionDate = (value) => {
  if (!value) {
    return null;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

export const splitExecutionsForDashboard = (executions = [], referenceDate = dayjs()) => {
  const today = referenceDate.startOf('day');
  const upcomingBoundary = today.add(MAX_DAYS_AHEAD, 'day');

  const todayExecutions = [];
  const overdueExecutions = [];
  const upcomingExecutions = [];

  executions.forEach((execution) => {
    if (!execution) {
      return;
    }
    if (!TODO_STATUSES.has(execution.status)) {
      return;
    }

    const scheduled = normaliseExecutionDate(execution.scheduled_date);
    if (!scheduled) {
      return;
    }

    if (scheduled.isBefore(today, 'day')) {
      overdueExecutions.push(execution);
      return;
    }

    if (scheduled.isSame(today, 'day')) {
      todayExecutions.push(execution);
      return;
    }

    if (scheduled.isAfter(upcomingBoundary, 'day')) {
      return;
    }

    upcomingExecutions.push(execution);
  });

  overdueExecutions.sort((a, b) => {
    const aTime = normaliseExecutionDate(a.scheduled_date)?.valueOf() ?? 0;
    const bTime = normaliseExecutionDate(b.scheduled_date)?.valueOf() ?? 0;
    return aTime - bTime;
  });

  upcomingExecutions.sort((a, b) => {
    const aTime = normaliseExecutionDate(a.scheduled_date)?.valueOf() ?? 0;
    const bTime = normaliseExecutionDate(b.scheduled_date)?.valueOf() ?? 0;
    return aTime - bTime;
  });

  todayExecutions.sort((a, b) => {
    const aTime = normaliseExecutionDate(a.scheduled_date)?.valueOf() ?? Number.NaN;
    const bTime = normaliseExecutionDate(b.scheduled_date)?.valueOf() ?? Number.NaN;
    if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) {
      return 0;
    }
    return aTime - bTime;
  });

  const earliestOverdueDate = overdueExecutions.length > 0
    ? normaliseExecutionDate(overdueExecutions[0].scheduled_date)
    : null;

  return {
    todayExecutions,
    overdueExecutions,
    upcomingExecutions,
    earliestOverdueDate,
  };
};

const buildRelativeLabel = (scheduled, reference) => {
  if (!scheduled) {
    return '';
  }
  const diffDays = scheduled.diff(reference, 'day');
  if (diffDays === 0) {
    return 'Due today';
  }
  if (diffDays === 1) {
    return 'Due tomorrow';
  }
  if (diffDays > 1) {
    return `Due in ${diffDays} days`;
  }
  if (diffDays === -1) {
    return '1 day overdue';
  }
  return `${Math.abs(diffDays)} days overdue`;
};

export const mapExecutionsToListItems = ({
  executions = [],
  careTasksById = {},
  today = dayjs(),
  markOverdue = false,
}) => {
  return executions
    .map((execution) => {
      const scheduled = normaliseExecutionDate(execution.scheduled_date);
      const parentTask = careTasksById[execution.care_task_id];
      if (!parentTask || parentTask.is_active === false) {
        return null;
      }
      const taskName = parentTask?.name || execution.title || 'Care task';

      return {
        id: execution.id || `${execution.care_task_id}-${execution.scheduled_date}`,
        title: taskName,
        notes: execution.notes || parentTask?.notes || '',
        dateLabel: scheduled ? scheduled.format('ddd, DD MMM') : 'N/A',
        relativeLabel: buildRelativeLabel(scheduled, today.startOf('day')),
        isOverdue: markOverdue,
      };
    })
    .filter(Boolean);
};

export const buildBudgetSummary = (analytics) => {
  if (!analytics) {
    return {
      total: 0,
      spent: 0,
      remaining: 0,
      formatted: {
        total: 'N/A',
        spent: 'N/A',
        remaining: 'N/A',
      },
    };
  }

  const {
    totalAnnualBudget = 0,
    totalSpentToDate = 0,
    totalRemainingBudget = 0,
  } = analytics;

  return {
    total: totalAnnualBudget,
    spent: totalSpentToDate,
    remaining: totalRemainingBudget,
    formatted: {
      total: formatCurrency(totalAnnualBudget),
      spent: formatCurrency(totalSpentToDate),
      remaining: formatCurrency(totalRemainingBudget),
    },
  };
};

export const formatCountValue = (value) => {
  if (value === null || value === undefined) {
    return '--';
  }
  return value.toString();
};
