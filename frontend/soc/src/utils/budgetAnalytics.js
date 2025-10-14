import dayjs from 'dayjs';

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const formatCurrency = (value = 0) => {
  const numeric = Number(value);
  return CURRENCY_FORMATTER.format(Number.isFinite(numeric) ? numeric : 0);
};

const THRESHOLDS = {
  warning: 0.8,
  critical: 0.95
};

const buildAlertStatus = (utilizationFraction) => {
  if (utilizationFraction >= 1) {
    return {
      level: 'critical',
      message: 'Over budget',
      color: '#ff4d4f'
    };
  }
  if (utilizationFraction >= THRESHOLDS.critical) {
    return {
      level: 'critical',
      message: 'Critical: Budget nearly exhausted',
      color: '#ff4d4f'
    };
  }
  if (utilizationFraction >= THRESHOLDS.warning) {
    return {
      level: 'warning',
      message: 'Warning: Approaching budget limit',
      color: '#fa8c16'
    };
  }
  return {
    level: 'good',
    message: 'Budget on track',
    color: '#52c41a'
  };
};

const clampNumber = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const createMonthlyBuckets = () => {
  const now = dayjs();
  const year = now.year();
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthDate = dayjs(new Date(year, index, 1));
    return {
      month,
      monthName: monthDate.format('MMMM'),
      totalSpent: 0,
      taskIds: new Set()
    };
  });
};

const summariseUpcoming = (task, execution, averageCost) => {
  const scheduled = execution?.scheduled_date ? dayjs(execution.scheduled_date) : null;
  return {
    id: `${task.id}-${execution?.id || 'upcoming'}`,
    taskId: task.id,
    taskName: task.name,
    scheduledDate: scheduled ? scheduled.toISOString() : null,
    estimatedCost: clampNumber(averageCost),
    categoryId: task.category_id || null
  };
};

export const buildBudgetAnalytics = ({
  categories = [],
  careTasks = [],
  executions = []
}) => {
  const purchaseTasks = careTasks.filter((task) => task.task_type === 'PURCHASE');
  const categoriesById = categories.reduce((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

  const taskStats = new Map();
  purchaseTasks.forEach((task) => {
    taskStats.set(task.id, {
      netSpend: 0,
      upcomingExecutions: [],
      monthlySpend: new Map(),
      spendSamples: []
    });
  });

  const monthlyBuckets = createMonthlyBuckets();
  const monthIndexMap = monthlyBuckets.reduce((acc, bucket, idx) => {
    acc[bucket.month] = idx;
    return acc;
  }, {});

  const now = dayjs();
  const upcomingWindowEnd = now.add(30, 'day');

  const taskAverageSpend = new Map();

  executions.forEach((execution) => {
    const taskId = execution.care_task_id;
    if (!taskStats.has(taskId)) {
      return;
    }
    const stats = taskStats.get(taskId);
    const actualCost = clampNumber(execution.actual_cost ?? 0);
    const refundAmount = clampNumber(execution?.refund?.refund_amount ?? 0);
    const net = Math.max(0, actualCost - refundAmount);
    const hasSpend = net > 0;
    const referenceDate = execution.execution_date
      ? dayjs(execution.execution_date)
      : execution.scheduled_date
        ? dayjs(execution.scheduled_date)
        : null;
    const isCurrentYear = referenceDate && referenceDate.year() === now.year();

    if (hasSpend && isCurrentYear) {
      stats.netSpend += net;
      stats.spendSamples.push(net);
      const monthNumber = referenceDate.month() + 1; // month() is 0-indexed
      const currentMonthTotal = stats.monthlySpend.get(monthNumber) || 0;
      stats.monthlySpend.set(monthNumber, currentMonthTotal + net);

      const bucketIndex = monthIndexMap[monthNumber];
      if (bucketIndex !== undefined) {
        monthlyBuckets[bucketIndex].totalSpent += net;
        monthlyBuckets[bucketIndex].taskIds.add(taskId);
      }
    }

    if (execution.status === 'TODO') {
      const scheduled = execution.scheduled_date ? dayjs(execution.scheduled_date) : null;
      if (scheduled && !scheduled.isBefore(now, 'day') && !scheduled.isAfter(upcomingWindowEnd, 'day')) {
        const task = purchaseTasks.find((item) => item.id === taskId);
        if (task) {
          stats.upcomingExecutions.push(execution);
        }
      }
    }
  });

  statsLoop:
  for (const [taskId, stats] of taskStats.entries()) {
    if (stats.spendSamples.length > 0) {
      const sum = stats.spendSamples.reduce((acc, value) => acc + value, 0);
      taskAverageSpend.set(taskId, sum / stats.spendSamples.length);
      continue statsLoop;
    }

    const task = purchaseTasks.find((item) => item.id === taskId);
    if (!task) {
      taskAverageSpend.set(taskId, 0);
      continue statsLoop;
    }

    const interval = Number(task.recurrence_interval_days ?? 0);
    const yearlyBudget = clampNumber(task.yearly_budget ?? 0);
    if (yearlyBudget <= 0 || interval <= 0) {
      taskAverageSpend.set(taskId, 0);
      continue statsLoop;
    }

    const expectedExecutionsPerYear = Math.max(1, Math.floor(365 / interval));
    taskAverageSpend.set(taskId, yearlyBudget / expectedExecutionsPerYear);
  }

  const categoriesAnalytics = new Map();
  const overBudgetSegments = [];
  const upcomingByTask = new Map();

  purchaseTasks.forEach((task) => {
    const stats = taskStats.get(task.id) || { netSpend: 0, upcomingExecutions: [] };
    const categoryId = task.category_id || 'uncategorized';
    const categoryDefinition = categoriesById[categoryId];
    if (!categoriesAnalytics.has(categoryId)) {
      categoriesAnalytics.set(categoryId, {
        id: categoryId,
        name: categoryDefinition?.name || 'Uncategorised',
        description: categoryDefinition?.description || '',
        color: categoryDefinition?.color_code || '#d9d9d9',
        annualBudget: 0,
        actualSpent: 0,
        remaining: 0,
        utilization: 0,
        careTasks: []
      });
    }

    const yearlyBudget = clampNumber(task.yearly_budget ?? 0);
    const actualSpent = stats.netSpend;
    const remaining = Math.max(0, yearlyBudget - actualSpent);
    const utilizationFraction = yearlyBudget > 0 ? actualSpent / yearlyBudget : 0;
    const averageSpend = taskAverageSpend.get(task.id) ?? 0;

    const hasUpcoming = stats.upcomingExecutions.length > 0;
    if (hasUpcoming) {
      const itemisedUpcoming = stats.upcomingExecutions.map((execution) => summariseUpcoming(task, execution, averageSpend));
      const combinedUpcoming = itemisedUpcoming.reduce((acc, item) => acc + item.estimatedCost, 0);
      const nextDate = itemisedUpcoming
        .map((item) => item.scheduledDate)
        .filter(Boolean)
        .sort()[0] || null;

      const existing = upcomingByTask.get(task.id);
      if (existing) {
        existing.estimatedCost += combinedUpcoming;
        if (nextDate && (!existing.nextScheduledDate || nextDate < existing.nextScheduledDate)) {
          existing.nextScheduledDate = nextDate;
        }
      } else {
        upcomingByTask.set(task.id, {
          taskId: task.id,
          name: task.name,
          estimatedCost: combinedUpcoming,
          categoryId,
          nextScheduledDate: nextDate
        });
      }
    }

    const categorySummary = categoriesAnalytics.get(categoryId);
    categorySummary.annualBudget += yearlyBudget;
    categorySummary.actualSpent += actualSpent;

    categorySummary.careTasks.push({
      id: task.id,
      name: task.name,
      description: task.description || '',
      yearlyBudget,
      actualSpent,
      remaining,
      utilization: Number((utilizationFraction * 100).toFixed(1)),
      isOverUtilization: utilizationFraction >= THRESHOLDS.warning,
      estimatedUpcomingCost: taskAverageSpend.has(task.id)
        ? stats.upcomingExecutions.length * averageSpend
        : 0
    });

    if (yearlyBudget > 0 && actualSpent > yearlyBudget) {
      overBudgetSegments.push({
        id: task.id,
        name: task.name,
        annualBudget: yearlyBudget,
        actualSpent,
        variance: {
          absolute: actualSpent - yearlyBudget,
          percentage: Number(((actualSpent - yearlyBudget) / yearlyBudget * 100).toFixed(1)),
          isOverBudget: true
        }
      });
    }
  });

  categories.forEach((category) => {
    if (!categoriesAnalytics.has(category.id)) {
      categoriesAnalytics.set(category.id, {
        id: category.id,
        name: category.name,
        description: category.description || '',
        color: category.color_code || '#d9d9d9',
        annualBudget: 0,
        actualSpent: 0,
        remaining: 0,
        utilization: 0,
        careTasks: [],
        isOverUtilization: false
      });
    }
  });

  let totalAnnualBudget = 0;
  let totalSpentToDate = 0;

  categoriesAnalytics.forEach((summary) => {
    summary.remaining = Math.max(0, summary.annualBudget - summary.actualSpent);
    const utilizationFraction = summary.annualBudget > 0 ? summary.actualSpent / summary.annualBudget : 0;
    summary.utilization = Number((utilizationFraction * 100).toFixed(1));
    summary.isOverUtilization = utilizationFraction >= THRESHOLDS.warning;
    summary.careTasks.sort((a, b) => b.utilization - a.utilization);

    totalAnnualBudget += summary.annualBudget;
    totalSpentToDate += summary.actualSpent;
  });

  const totalRemainingBudget = Math.max(0, totalAnnualBudget - totalSpentToDate);
  const utilizationFraction = totalAnnualBudget > 0 ? totalSpentToDate / totalAnnualBudget : 0;
  const budgetUtilization = Number((utilizationFraction * 100).toFixed(1));

  const daysElapsed = Math.max(1, now.diff(now.startOf('year'), 'day') + 1);
  const daysRemaining = Math.max(0, now.endOf('year').diff(now, 'day'));
  const dailySpendingRate = totalSpentToDate / daysElapsed;
  const projectedRemainingSpending = dailySpendingRate * daysRemaining;
  const projectedTotalSpending = totalSpentToDate + projectedRemainingSpending;
  const projectedOverage = Math.max(0, projectedTotalSpending - totalAnnualBudget);

  const monthlySpending = monthlyBuckets.map((bucket) => ({
    month: bucket.month,
    monthName: bucket.monthName,
    totalSpent: bucket.totalSpent,
    taskCount: bucket.taskIds.size
  }));

  const upcomingTasks = Array.from(upcomingByTask.values()).sort((a, b) => {
    if (!a.nextScheduledDate) return 1;
    if (!b.nextScheduledDate) return -1;
    return a.nextScheduledDate.localeCompare(b.nextScheduledDate);
  });

  const totalUpcomingCost = upcomingTasks.reduce((acc, item) => acc + item.estimatedCost, 0);

  overBudgetSegments.sort((a, b) => b.variance.absolute - a.variance.absolute);

  return {
    totalAnnualBudget,
    totalSpentToDate,
    totalRemainingBudget,
    budgetUtilization,
    alertStatus: buildAlertStatus(utilizationFraction),
    categoryBreakdown: Array.from(categoriesAnalytics.values()).sort((a, b) => b.actualSpent - a.actualSpent),
    monthlySpending,
    projectedSpending: {
      currentSpending: totalSpentToDate,
      projectedTotalSpending,
      projectedRemainingSpending,
      totalAnnualBudget,
      projectedOverage,
      daysElapsed,
      daysRemaining,
      dailySpendingRate
    },
    overBudgetSegments,
    upcomingCosts: {
      totalEstimatedCost: totalUpcomingCost,
      taskCount: upcomingTasks.length,
      tasks: upcomingTasks
    }
  };
};
