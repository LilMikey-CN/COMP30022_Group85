import {
  budgetCategories,
  careTasks,
  systemConfig
} from './integratedMockDatabase.js';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: systemConfig.currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export const calculateTotalAnnualBudget = (categories = budgetCategories) => {
  return categories.reduce((total, category) => total + (category.annualBudget || 0), 0);
};

export const calculateTotalActualSpending = (tasksList = careTasks) => {
  return tasksList
    .filter(task => task.status === 'completed' && task.actualCost !== null && task.actualCost !== undefined)
    .reduce((total, task) => total + task.actualCost, 0);
};

export const calculateCategorySpending = (categoryId, tasksList = careTasks) => {
  return tasksList
    .filter(task => task.budgetCategoryId === categoryId && task.status === 'completed' && task.actualCost)
    .reduce((total, task) => total + task.actualCost, 0);
};

const calculateSubcategorySpending = (subcategoryId, tasksList = careTasks) => {
  return tasksList
    .filter(task => task.budgetSubcategoryId === subcategoryId && task.status === 'completed' && task.actualCost)
    .reduce((total, task) => total + task.actualCost, 0);
};

export const calculateCategoryBudgetBreakdown = (categories = budgetCategories, tasksList = careTasks) => {
  return categories.map((category) => {
    const actualSpent = calculateCategorySpending(category.id, tasksList);
    const annualBudget = category.annualBudget || 0;
    const remaining = Math.max(0, annualBudget - actualSpent);
    const utilization = annualBudget > 0 ? Math.round((actualSpent / annualBudget) * 100) : 0;

    const subcategoryBreakdown = (category.subcategories || []).map((subcategory) => {
      const subAnnualBudget = subcategory.annualBudget || 0;
      const subActualSpent = calculateSubcategorySpending(subcategory.id, tasksList);

      return {
        ...subcategory,
        annualBudget: subAnnualBudget,
        actualSpent: subActualSpent,
        remaining: Math.max(0, subAnnualBudget - subActualSpent),
        utilization: subAnnualBudget > 0 ? Math.round((subActualSpent / subAnnualBudget) * 100) : 0
      };
    });

    return {
      ...category,
      actualSpent,
      remaining,
      utilization,
      subcategoryBreakdown
    };
  });
};

export const calculateMonthlySpending = (year = 2025, tasksList = careTasks) => {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthTasks = tasksList.filter((task) => {
      if (!task.completedDate) {
        return false;
      }
      const completed = new Date(task.completedDate);
      return completed.getFullYear() === year && completed.getMonth() + 1 === month;
    });

    const totalSpent = monthTasks.reduce((total, task) => total + (task.actualCost || 0), 0);

    return {
      month,
      monthName: new Date(year, index).toLocaleString('en-AU', { month: 'long' }),
      totalSpent,
      taskCount: monthTasks.length,
      tasks: monthTasks
    };
  });
};

export const calculateProjectedYearEndSpending = (categories = budgetCategories, tasksList = careTasks) => {
  const currentDate = new Date();
  const yearStart = new Date(systemConfig.fiscalYearStart);
  const yearEnd = new Date(systemConfig.fiscalYearEnd);

  const daysElapsed = Math.floor((currentDate - yearStart) / (1000 * 60 * 60 * 24));
  const totalDaysInYear = Math.max(1, Math.floor((yearEnd - yearStart) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, totalDaysInYear - daysElapsed);

  const currentSpending = calculateTotalActualSpending(tasksList);
  const dailySpendingRate = daysElapsed > 0 ? currentSpending / daysElapsed : 0;
  const projectedRemainingSpending = dailySpendingRate * daysRemaining;
  const projectedTotalSpending = currentSpending + projectedRemainingSpending;
  const totalAnnualBudget = calculateTotalAnnualBudget(categories);

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

export const getBudgetAlertStatus = (currentSpending, budget) => {
  if (budget === 0) {
    return { level: 'none', message: null, color: '#52c41a' };
  }

  const utilization = currentSpending / budget;

  if (utilization >= systemConfig.budgetAlertThresholds.critical) {
    return {
      level: 'critical',
      message: 'Critical: Budget nearly exhausted',
      color: '#ff4d4f'
    };
  }

  if (utilization >= systemConfig.budgetAlertThresholds.warning) {
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

export const calculateUpcomingCosts = (days = 30, tasksList = careTasks) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const upcomingTasks = tasksList.filter((task) => {
    if (task.status !== 'scheduled') {
      return false;
    }
    const taskDate = new Date(task.scheduledDate);
    return taskDate >= today && taskDate <= futureDate;
  });

  const totalEstimatedCost = upcomingTasks.reduce((total, task) => total + (task.estimatedCost || 0), 0);

  return {
    tasks: upcomingTasks,
    totalEstimatedCost,
    taskCount: upcomingTasks.length
  };
};

export const getOverBudgetSegments = (categories = budgetCategories, tasksList = careTasks) => {
  const segments = [];

  categories.forEach((category) => {
    (category.subcategories || []).forEach((subcategory) => {
      const budget = subcategory.annualBudget || 0;
      const spent = calculateSubcategorySpending(subcategory.id, tasksList);

      if (budget > 0 && spent > budget) {
        const variance = spent - budget;
        segments.push({
          id: `${category.id}-${subcategory.id}`,
          name: `${category.name} • ${subcategory.name}`,
          annualBudget: budget,
          actualSpent: spent,
          variance: {
            absolute: variance,
            percentage: Math.round((variance / budget) * 100),
            isOverBudget: true
          }
        });
      }
    });
  });

  return segments.sort((a, b) => b.variance.absolute - a.variance.absolute);
};

export const generateBudgetAnalytics = (categories = budgetCategories, tasksList = careTasks) => {
  const totalAnnualBudget = calculateTotalAnnualBudget(categories);
  const totalSpentToDate = calculateTotalActualSpending(tasksList);
  const totalRemainingBudget = Math.max(0, totalAnnualBudget - totalSpentToDate);
  const categoryBreakdown = calculateCategoryBudgetBreakdown(categories, tasksList);
  const monthlySpending = calculateMonthlySpending(2025, tasksList);
  const projectedSpending = calculateProjectedYearEndSpending(categories, tasksList);
  const overBudgetSegments = getOverBudgetSegments(categories, tasksList);
  const upcomingCosts = calculateUpcomingCosts(30, tasksList);

  return {
    totalAnnualBudget,
    totalSpentToDate,
    totalRemainingBudget,
    budgetUtilization: totalAnnualBudget > 0 ? Math.round((totalSpentToDate / totalAnnualBudget) * 100) : 0,
    categoryBreakdown,
    monthlySpending,
    projectedSpending,
    overBudgetSegments,
    upcomingCosts,
    alertStatus: getBudgetAlertStatus(totalSpentToDate, totalAnnualBudget)
  };
};
