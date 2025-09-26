// Budget Calculation Functions for Integrated Care Item and Budget System
import {
  budgetCategories,
  careItems,
  careTasks,
  systemConfig
} from './integratedMockDatabase.js';

// Currency formatting
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: systemConfig.currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Calculate annual budget for a specific care item
export const calculateAnnualBudget = (careItem) => {
  if (!careItem.isRecurring) return careItem.estimatedCostPerItem;

  const daysInYear = 365;
  const timesPerYear = Math.floor(daysInYear / careItem.frequency);
  return careItem.estimatedCostPerItem * timesPerYear;
};

// Calculate total annual budget for all care items
export const calculateTotalAnnualBudget = (careItemsList = careItems) => {
  return careItemsList.reduce((total, item) => {
    return total + calculateAnnualBudget(item);
  }, 0);
};

// Calculate actual spending for a specific care item from completed tasks
export const calculateActualSpending = (careItemId, tasksList = careTasks) => {
  const completedTasks = tasksList.filter(task =>
    task.careItemId === careItemId &&
    task.status === 'completed' &&
    task.actualCost !== null
  );

  return completedTasks.reduce((total, task) => total + task.actualCost, 0);
};

// Calculate total actual spending across all completed tasks
export const calculateTotalActualSpending = (tasksList = careTasks) => {
  const completedTasks = tasksList.filter(task =>
    task.status === 'completed' &&
    task.actualCost !== null
  );

  return completedTasks.reduce((total, task) => total + task.actualCost, 0);
};

// Calculate remaining budget for a specific care item
export const calculateRemainingBudget = (careItem, tasksList = careTasks) => {
  const annualBudget = calculateAnnualBudget(careItem);
  const actualSpent = calculateActualSpending(careItem.id, tasksList);
  return Math.max(0, annualBudget - actualSpent);
};

// Calculate budget utilization percentage for a care item
export const calculateBudgetUtilization = (careItem, tasksList = careTasks) => {
  const annualBudget = calculateAnnualBudget(careItem);
  if (annualBudget === 0) return 0;

  const actualSpent = calculateActualSpending(careItem.id, tasksList);
  return Math.round((actualSpent / annualBudget) * 100);
};

// Calculate variance (actual vs estimated) for a specific care item
export const calculateVariance = (careItem, tasksList = careTasks) => {
  const completedTasks = tasksList.filter(task =>
    task.careItemId === careItem.id &&
    task.status === 'completed'
  );

  if (completedTasks.length === 0) return { absolute: 0, percentage: 0 };

  const totalActual = completedTasks.reduce((sum, task) => sum + task.actualCost, 0);
  const totalEstimated = completedTasks.reduce((sum, task) => sum + task.estimatedCost, 0);

  const absoluteVariance = totalActual - totalEstimated;
  const percentageVariance = totalEstimated > 0 ?
    Math.round((absoluteVariance / totalEstimated) * 100) : 0;

  return {
    absolute: absoluteVariance,
    percentage: percentageVariance,
    isOverBudget: absoluteVariance > 0
  };
};

// Calculate spending by category
export const calculateCategorySpending = (categoryId, tasksList = careTasks) => {
  const categoryTasks = tasksList.filter(task =>
    task.budgetCategoryId === categoryId &&
    task.status === 'completed'
  );

  return categoryTasks.reduce((total, task) => total + task.actualCost, 0);
};

// Calculate category budget breakdown
export const calculateCategoryBudgetBreakdown = (careItemsList = careItems, tasksList = careTasks) => {
  return budgetCategories.map(category => {
    const categoryItems = careItemsList.filter(item => item.budgetCategoryId === category.id);

    const annualBudget = categoryItems.reduce((sum, item) => sum + calculateAnnualBudget(item), 0);
    const actualSpent = calculateCategorySpending(category.id, tasksList);
    const remaining = Math.max(0, annualBudget - actualSpent);
    const utilization = annualBudget > 0 ? Math.round((actualSpent / annualBudget) * 100) : 0;

    // Calculate subcategory breakdown
    const subcategoryBreakdown = category.subcategories.map(subcategory => {
      const subcategoryItems = categoryItems.filter(item => item.budgetSubcategoryId === subcategory.id);
      const subAnnualBudget = subcategoryItems.reduce((sum, item) => sum + calculateAnnualBudget(item), 0);
      const subActualSpent = tasksList
        .filter(task => task.budgetSubcategoryId === subcategory.id && task.status === 'completed')
        .reduce((sum, task) => sum + task.actualCost, 0);

      return {
        ...subcategory,
        annualBudget: subAnnualBudget,
        actualSpent: subActualSpent,
        remaining: Math.max(0, subAnnualBudget - subActualSpent),
        utilization: subAnnualBudget > 0 ? Math.round((subActualSpent / subAnnualBudget) * 100) : 0,
        careItems: subcategoryItems
      };
    });

    return {
      ...category,
      annualBudget,
      actualSpent,
      remaining,
      utilization,
      careItems: categoryItems,
      subcategoryBreakdown
    };
  });
};

// Calculate monthly spending breakdown
export const calculateMonthlySpending = (year = 2025, tasksList = careTasks) => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTasks = tasksList.filter(task => {
      if (!task.completedDate) return false;
      const taskDate = new Date(task.completedDate);
      return taskDate.getFullYear() === year && taskDate.getMonth() + 1 === month;
    });

    const totalSpent = monthTasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);

    return {
      month,
      monthName: new Date(year, i).toLocaleString('en-AU', { month: 'long' }),
      totalSpent,
      taskCount: monthTasks.length,
      tasks: monthTasks
    };
  });

  return months;
};

// Calculate projected year-end spending
export const calculateProjectedYearEndSpending = (careItemsList = careItems, tasksList = careTasks) => {
  const currentDate = new Date();
  const yearStart = new Date(systemConfig.fiscalYearStart);
  const yearEnd = new Date(systemConfig.fiscalYearEnd);

  // Calculate days elapsed and remaining
  const daysElapsed = Math.floor((currentDate - yearStart) / (1000 * 60 * 60 * 24));
  const totalDaysInYear = Math.floor((yearEnd - yearStart) / (1000 * 60 * 60 * 24));
  const daysRemaining = totalDaysInYear - daysElapsed;

  // Current spending
  const currentSpending = calculateTotalActualSpending(tasksList);

  // Calculate average daily spending rate
  const dailySpendingRate = daysElapsed > 0 ? currentSpending / daysElapsed : 0;

  // Project remaining spending
  const projectedRemainingSpending = dailySpendingRate * daysRemaining;

  // Total projected spending
  const projectedTotalSpending = currentSpending + projectedRemainingSpending;

  // Compare with annual budget
  const totalAnnualBudget = calculateTotalAnnualBudget(careItemsList);

  return {
    currentSpending,
    projectedTotalSpending,
    projectedRemainingSpending,
    totalAnnualBudget,
    projectedOverage: Math.max(0, projectedTotalSpending - totalAnnualBudget),
    daysElapsed,
    daysRemaining,
    dailySpendingRate
  };
};

// Get budget alert status for a care item or category
export const getBudgetAlertStatus = (currentSpending, budget) => {
  if (budget === 0) return { level: 'none', message: null };

  const utilization = currentSpending / budget;

  if (utilization >= systemConfig.budgetAlertThresholds.critical) {
    return {
      level: 'critical',
      message: 'Critical: Budget nearly exhausted',
      color: '#ff4d4f'
    };
  } else if (utilization >= systemConfig.budgetAlertThresholds.warning) {
    return {
      level: 'warning',
      message: 'Warning: Approaching budget limit',
      color: '#fa8c16'
    };
  } else {
    return {
      level: 'good',
      message: 'Budget on track',
      color: '#52c41a'
    };
  }
};

// Calculate upcoming tasks and their estimated costs
export const calculateUpcomingCosts = (days = 30, tasksList = careTasks) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const upcomingTasks = tasksList.filter(task => {
    if (task.status !== 'scheduled') return false;
    const taskDate = new Date(task.scheduledDate);
    return taskDate >= today && taskDate <= futureDate;
  });

  const totalEstimatedCost = upcomingTasks.reduce((sum, task) => sum + task.estimatedCost, 0);

  return {
    tasks: upcomingTasks,
    totalEstimatedCost,
    taskCount: upcomingTasks.length
  };
};

// Get care items that are over budget
export const getOverBudgetItems = (careItemsList = careItems, tasksList = careTasks) => {
  return careItemsList
    .map(item => {
      const variance = calculateVariance(item, tasksList);
      const annualBudget = calculateAnnualBudget(item);
      const actualSpent = calculateActualSpending(item.id, tasksList);

      return {
        ...item,
        annualBudget,
        actualSpent,
        variance,
        isOverBudget: actualSpent > annualBudget
      };
    })
    .filter(item => item.isOverBudget)
    .sort((a, b) => b.variance.absolute - a.variance.absolute);
};

// Generate comprehensive budget analytics
export const generateBudgetAnalytics = (careItemsList = careItems, tasksList = careTasks) => {
  const totalAnnualBudget = calculateTotalAnnualBudget(careItemsList);
  const totalSpentToDate = calculateTotalActualSpending(tasksList);
  const totalRemainingBudget = Math.max(0, totalAnnualBudget - totalSpentToDate);
  const categoryBreakdown = calculateCategoryBudgetBreakdown(careItemsList, tasksList);
  const monthlySpending = calculateMonthlySpending(2025, tasksList);
  const projectedSpending = calculateProjectedYearEndSpending(careItemsList, tasksList);
  const overBudgetItems = getOverBudgetItems(careItemsList, tasksList);
  const upcomingCosts = calculateUpcomingCosts(30, tasksList);

  return {
    totalAnnualBudget,
    totalSpentToDate,
    totalRemainingBudget,
    budgetUtilization: totalAnnualBudget > 0 ? Math.round((totalSpentToDate / totalAnnualBudget) * 100) : 0,
    categoryBreakdown,
    monthlySpending,
    projectedSpending,
    overBudgetItems,
    upcomingCosts,
    alertStatus: getBudgetAlertStatus(totalSpentToDate, totalAnnualBudget)
  };
};