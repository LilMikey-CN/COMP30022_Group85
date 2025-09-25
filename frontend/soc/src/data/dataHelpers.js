// Helper Functions for Data Relationships and Analytics
import {
  budgetCategories,
  careItems,
  careTasks,
  patients
} from './integratedMockDatabase.js';

// Data Retrieval Helpers

// Get category by ID
export const getCategoryById = (categoryId) => {
  return budgetCategories.find(cat => cat.id === categoryId);
};

// Get subcategory by ID
export const getSubcategoryById = (subcategoryId) => {
  for (const category of budgetCategories) {
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (subcategory) {
      return { ...subcategory, parentCategory: category };
    }
  }
  return null;
};

// Get care item by ID
export const getCareItemById = (careItemId) => {
  return careItems.find(item => item.id === careItemId);
};

// Get all care items for a specific category
export const getCareItemsByCategory = (categoryId) => {
  return careItems.filter(item => item.budgetCategoryId === categoryId);
};

// Get all care items for a specific subcategory
export const getCareItemsBySubcategory = (subcategoryId) => {
  return careItems.filter(item => item.budgetSubcategoryId === subcategoryId);
};

// Get all tasks for a specific care item
export const getTasksByCareItem = (careItemId) => {
  return careTasks.filter(task => task.careItemId === careItemId);
};

// Get all tasks for a specific patient
export const getTasksByPatient = (patientId) => {
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return [];

  return careTasks.filter(task =>
    patient.careItems.includes(task.careItemId)
  );
};

// Date and Time Helpers

// Check if a task is overdue
export const isTaskOverdue = (task) => {
  if (task.status === 'completed') return false;
  const today = new Date();
  const taskDate = new Date(task.scheduledDate);
  return taskDate < today;
};

// Get days until due date
export const getDaysUntilDue = (scheduledDate) => {
  const today = new Date();
  const dueDate = new Date(scheduledDate);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format date for display
export const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get relative date description (e.g., "2 days ago", "in 3 days")
export const getRelativeDateDescription = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
};

// Task Status Helpers

// Get tasks by status
export const getTasksByStatus = (status) => {
  return careTasks.filter(task => task.status === status);
};

// Get overdue tasks
export const getOverdueTasks = () => {
  return careTasks.filter(task => isTaskOverdue(task));
};

// Get upcoming tasks (next 7 days)
export const getUpcomingTasks = (days = 7) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return careTasks.filter(task => {
    if (task.status === 'completed') return false;
    const taskDate = new Date(task.scheduledDate);
    return taskDate >= today && taskDate <= futureDate;
  }).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
};

// Get tasks due today
export const getTasksDueToday = () => {
  const today = new Date().toISOString().split('T')[0];
  return careTasks.filter(task =>
    task.scheduledDate === today && task.status !== 'completed'
  );
};

// Priority and Status Helpers

// Get priority color
export const getPriorityColor = (priority) => {
  const colors = {
    high: '#ff4d4f',
    medium: '#fa8c16',
    low: '#52c41a'
  };
  return colors[priority.toLowerCase()] || '#d9d9d9';
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    active: '#1890ff',
    completed: '#52c41a',
    overdue: '#ff4d4f',
    scheduled: '#722ed1'
  };
  return colors[status.toLowerCase()] || '#d9d9d9';
};

// Get category color
export const getCategoryColor = (categoryId) => {
  const category = getCategoryById(categoryId);
  return category?.color || '#d9d9d9';
};

// Data Aggregation Helpers

// Group tasks by date
export const groupTasksByDate = (tasks) => {
  return tasks.reduce((groups, task) => {
    const date = task.scheduledDate || task.completedDate;
    if (!date) return groups;

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});
};

// Group tasks by category
export const groupTasksByCategory = (tasks) => {
  return tasks.reduce((groups, task) => {
    const categoryId = task.budgetCategoryId;
    if (!groups[categoryId]) {
      groups[categoryId] = [];
    }
    groups[categoryId].push(task);
    return groups;
  }, {});
};

// Group care items by category
export const groupCareItemsByCategory = (items = careItems) => {
  return items.reduce((groups, item) => {
    const categoryId = item.budgetCategoryId;
    if (!groups[categoryId]) {
      const category = getCategoryById(categoryId);
      groups[categoryId] = {
        category,
        items: []
      };
    }
    groups[categoryId].items.push(item);
    return groups;
  }, {});
};

// Statistics Helpers

// Calculate completion rate for care items
export const calculateCompletionRate = (careItemId, periodDays = 30) => {
  const tasks = getTasksByCareItem(careItemId);
  const recentTasks = tasks.filter(task => {
    const taskDate = new Date(task.scheduledDate);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    return taskDate >= cutoffDate;
  });

  if (recentTasks.length === 0) return 0;

  const completedTasks = recentTasks.filter(task => task.status === 'completed');
  return Math.round((completedTasks.length / recentTasks.length) * 100);
};

// Calculate average cost variance for a care item
export const calculateAverageCostVariance = (careItemId) => {
  const completedTasks = careTasks.filter(task =>
    task.careItemId === careItemId &&
    task.status === 'completed' &&
    task.actualCost !== null &&
    task.estimatedCost !== null
  );

  if (completedTasks.length === 0) return 0;

  const totalVariance = completedTasks.reduce((sum, task) => {
    return sum + (task.actualCost - task.estimatedCost);
  }, 0);

  return totalVariance / completedTasks.length;
};

// Search and Filter Helpers

// Search care items by name or description
export const searchCareItems = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return careItems.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term) ||
    item.notes.toLowerCase().includes(term)
  );
};

// Filter care items by multiple criteria
export const filterCareItems = (filters) => {
  return careItems.filter(item => {
    // Category filter
    if (filters.categoryId && item.budgetCategoryId !== filters.categoryId) {
      return false;
    }

    // Priority filter
    if (filters.priority && item.priority !== filters.priority) {
      return false;
    }

    // Status filter
    if (filters.status && item.status !== filters.status) {
      return false;
    }

    // Cost range filter
    if (filters.minCost !== undefined && item.estimatedCostPerItem < filters.minCost) {
      return false;
    }
    if (filters.maxCost !== undefined && item.estimatedCostPerItem > filters.maxCost) {
      return false;
    }

    // Frequency filter
    if (filters.maxFrequency !== undefined && item.frequency > filters.maxFrequency) {
      return false;
    }

    return true;
  });
};

// Sorting Helpers

// Sort care items by various criteria
export const sortCareItems = (items, sortBy, direction = 'asc') => {
  const sorted = [...items].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'cost':
        aValue = a.estimatedCostPerItem;
        bValue = b.estimatedCostPerItem;
        break;
      case 'frequency':
        aValue = a.frequency;
        bValue = b.frequency;
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority.toLowerCase()];
        bValue = priorityOrder[b.priority.toLowerCase()];
        break;
      case 'dueDate':
        aValue = new Date(a.nextDueDate);
        bValue = new Date(b.nextDueDate);
        break;
      case 'category':
        aValue = getCategoryById(a.budgetCategoryId)?.name || '';
        bValue = getCategoryById(b.budgetCategoryId)?.name || '';
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;

    return direction === 'desc' ? -comparison : comparison;
  });

  return sorted;
};

// Validation Helpers

// Validate care item data
export const validateCareItem = (careItem) => {
  const errors = [];

  if (!careItem.name || careItem.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!careItem.estimatedCostPerItem || careItem.estimatedCostPerItem < 0) {
    errors.push('Estimated cost must be a positive number');
  }

  if (!careItem.frequency || careItem.frequency <= 0) {
    errors.push('Frequency must be a positive number');
  }

  if (!careItem.budgetCategoryId) {
    errors.push('Budget category is required');
  }

  if (!careItem.priority || !['high', 'medium', 'low'].includes(careItem.priority.toLowerCase())) {
    errors.push('Priority must be high, medium, or low');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate care task data
export const validateCareTask = (careTask) => {
  const errors = [];

  if (!careTask.careItemId) {
    errors.push('Care item ID is required');
  }

  if (!careTask.scheduledDate) {
    errors.push('Scheduled date is required');
  }

  if (careTask.status === 'completed' && (!careTask.actualCost || careTask.actualCost < 0)) {
    errors.push('Actual cost is required for completed tasks');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export all functions for easy importing
export default {
  // Data retrieval
  getCategoryById,
  getSubcategoryById,
  getCareItemById,
  getCareItemsByCategory,
  getCareItemsBySubcategory,
  getTasksByCareItem,
  getTasksByPatient,

  // Date helpers
  isTaskOverdue,
  getDaysUntilDue,
  formatDateForDisplay,
  getRelativeDateDescription,

  // Task status
  getTasksByStatus,
  getOverdueTasks,
  getUpcomingTasks,
  getTasksDueToday,

  // Colors and styling
  getPriorityColor,
  getStatusColor,
  getCategoryColor,

  // Data aggregation
  groupTasksByDate,
  groupTasksByCategory,
  groupCareItemsByCategory,

  // Statistics
  calculateCompletionRate,
  calculateAverageCostVariance,

  // Search and filter
  searchCareItems,
  filterCareItems,
  sortCareItems,

  // Validation
  validateCareItem,
  validateCareTask
};