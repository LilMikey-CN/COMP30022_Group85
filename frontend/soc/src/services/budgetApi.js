// Mock API Layer for Budget Management
// Simulates backend API calls with in-memory data persistence

import {
  budgetCategories as initialCategories,
  careTasks as initialTasks
} from '../data/integratedMockDatabase.js';
import { generateBudgetAnalytics } from '../data/budgetCalculations.js';

// No longer using default patient ID - all APIs now require explicit patientId

// In-memory data store (simulates backend database)
let mockData = {
  categories: [...initialCategories],
  tasks: [...initialTasks]
};

// Utility function to simulate API delay
const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ================================
// BUDGET ANALYTICS API
// ================================

export const fetchBudgetAnalytics = async (patientId) => {
  if (!patientId) {
    throw new Error('Patient ID is required');
  }

  await simulateDelay(200);

  // In a real API, you would filter data by patientId
  // For now, we use all data since we have only one patient
  const analytics = generateBudgetAnalytics(mockData.categories, mockData.tasks);

  return {
    success: true,
    data: analytics,
    patientId,
    timestamp: new Date().toISOString()
  };
};

// ================================
// CATEGORY MANAGEMENT API
// ================================

export const fetchCategories = async (patientId) => {
  if (!patientId) {
    throw new Error('Patient ID is required');
  }

  await simulateDelay(150);

  // In a real API, you would filter categories by patientId
  // For now, we return all categories since we have only one patient
  return {
    success: true,
    data: mockData.categories,
    patientId,
    timestamp: new Date().toISOString()
  };
};

export const createCategory = async (categoryData) => {
  await simulateDelay(400);

  // Validate required fields
  if (!categoryData.name || !categoryData.description) {
    throw new Error('Category name and description are required');
  }

  const newCategory = {
    id: generateId('cat'),
    name: categoryData.name.trim(),
    description: categoryData.description.trim(),
    color: categoryData.color || '#1890ff',
    annualBudget: Number(categoryData.annualBudget) || 0,
    subcategories: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockData.categories.push(newCategory);

  return {
    success: true,
    data: newCategory,
    message: `Category "${newCategory.name}" created successfully`
  };
};

export const updateCategory = async (categoryId, updateData) => {
  await simulateDelay(350);

  const categoryIndex = mockData.categories.findIndex(cat => cat.id === categoryId);

  if (categoryIndex === -1) {
    throw new Error('Category not found');
  }

  const updatedCategory = {
    ...mockData.categories[categoryIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  mockData.categories[categoryIndex] = updatedCategory;

  return {
    success: true,
    data: updatedCategory,
    message: `Category "${updatedCategory.name}" updated successfully`
  };
};

export const deleteCategory = async (categoryId) => {
  await simulateDelay(300);

  const categoryIndex = mockData.categories.findIndex(cat => cat.id === categoryId);

  if (categoryIndex === -1) {
    throw new Error('Category not found');
  }

  const deletedCategory = mockData.categories[categoryIndex];

  // Check if category has subcategories
  if (deletedCategory.subcategories && deletedCategory.subcategories.length > 0) {
    throw new Error(`Cannot delete category "${deletedCategory.name}" because it has ${deletedCategory.subcategories.length} subcategories`);
  }

  // Check if any tasks reference this category
  const associatedTasks = mockData.tasks.filter(task => task.budgetCategoryId === categoryId);
  if (associatedTasks.length > 0) {
    throw new Error(`Cannot delete category "${deletedCategory.name}" because ${associatedTasks.length} tasks reference it`);
  }

  mockData.categories.splice(categoryIndex, 1);

  return {
    success: true,
    data: { id: categoryId },
    message: `Category "${deletedCategory.name}" deleted successfully`
  };
};

// ================================
// SUBCATEGORY MANAGEMENT API
// ================================

export const createSubcategory = async (categoryId, subcategoryData) => {
  await simulateDelay(350);

  const categoryIndex = mockData.categories.findIndex(cat => cat.id === categoryId);

  if (categoryIndex === -1) {
    throw new Error('Parent category not found');
  }

  if (!subcategoryData.name) {
    throw new Error('Subcategory name is required');
  }

  const newSubcategory = {
    id: generateId('sub'),
    name: subcategoryData.name.trim(),
    categoryId: categoryId,
    annualBudget: Number(subcategoryData.annualBudget) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockData.categories[categoryIndex].subcategories.push(newSubcategory);

  return {
    success: true,
    data: newSubcategory,
    message: `Subcategory "${newSubcategory.name}" created successfully`
  };
};

export const updateSubcategory = async (categoryId, subcategoryId, updateData) => {
  await simulateDelay(300);

  const categoryIndex = mockData.categories.findIndex(cat => cat.id === categoryId);

  if (categoryIndex === -1) {
    throw new Error('Parent category not found');
  }

  const subcategoryIndex = mockData.categories[categoryIndex].subcategories.findIndex(
    sub => sub.id === subcategoryId
  );

  if (subcategoryIndex === -1) {
    throw new Error('Subcategory not found');
  }

  const updatedSubcategory = {
    ...mockData.categories[categoryIndex].subcategories[subcategoryIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  mockData.categories[categoryIndex].subcategories[subcategoryIndex] = updatedSubcategory;

  return {
    success: true,
    data: updatedSubcategory,
    message: `Subcategory "${updatedSubcategory.name}" updated successfully`
  };
};

export const deleteSubcategory = async (categoryId, subcategoryId) => {
  await simulateDelay(250);

  const categoryIndex = mockData.categories.findIndex(cat => cat.id === categoryId);

  if (categoryIndex === -1) {
    throw new Error('Parent category not found');
  }

  const subcategoryIndex = mockData.categories[categoryIndex].subcategories.findIndex(
    sub => sub.id === subcategoryId
  );

  if (subcategoryIndex === -1) {
    throw new Error('Subcategory not found');
  }

  const deletedSubcategory = mockData.categories[categoryIndex].subcategories[subcategoryIndex];

  // Check if any tasks reference this subcategory
  const associatedTasks = mockData.tasks.filter(task => task.budgetSubcategoryId === subcategoryId);
  if (associatedTasks.length > 0) {
    throw new Error(`Cannot delete subcategory "${deletedSubcategory.name}" because ${associatedTasks.length} tasks reference it`);
  }

  mockData.categories[categoryIndex].subcategories.splice(subcategoryIndex, 1);

  return {
    success: true,
    data: { id: subcategoryId },
    message: `Subcategory "${deletedSubcategory.name}" deleted successfully`
  };
};

// ================================
// UTILITY FUNCTIONS
// ================================

// Get current mock data state (for debugging)
export const getMockDataState = () => ({ ...mockData });

// Reset mock data to initial state
export const resetMockData = () => {
  mockData = {
    categories: [...initialCategories],
    tasks: [...initialTasks]
  };

  return {
    success: true,
    message: 'Mock data reset to initial state'
  };
};

// Query Keys for TanStack Query
export const queryKeys = {
  budget: {
    all: ['budget'],
    analytics: (patientId) => [...queryKeys.budget.all, 'analytics', patientId],
    categories: (patientId) => [...queryKeys.budget.all, 'categories', patientId],
    category: (categoryId) => [...queryKeys.budget.all, 'category', categoryId],
  }
};
