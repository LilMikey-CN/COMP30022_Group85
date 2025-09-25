// Mock API Layer for Budget Management
// Simulates backend API calls with in-memory data persistence

import {
  budgetCategories as initialCategories,
  careItems as initialCareItems,
  careTasks as initialTasks
} from '../data/integratedMockDatabase.js';
import { generateBudgetAnalytics } from '../data/budgetCalculations.js';

// Default patient ID for single patient scenario
const DEFAULT_PATIENT_ID = 'PT-2025-02-001';

// In-memory data store (simulates backend database)
let mockData = {
  categories: [...initialCategories],
  careItems: [...initialCareItems],
  tasks: [...initialTasks]
};

// Utility function to simulate API delay
const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ================================
// BUDGET ANALYTICS API
// ================================

export const fetchBudgetAnalytics = async (patientId = DEFAULT_PATIENT_ID) => {
  await simulateDelay(200);

  // In a real API, you would filter data by patientId
  // For now, we use all data since we have only one patient
  const analytics = generateBudgetAnalytics(mockData.careItems, mockData.tasks);

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

export const fetchCategories = async (patientId = DEFAULT_PATIENT_ID) => {
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

  // Check if any care items are using this category
  const associatedCareItems = mockData.careItems.filter(item => item.budgetCategoryId === categoryId);
  if (associatedCareItems.length > 0) {
    throw new Error(`Cannot delete category "${deletedCategory.name}" because it has ${associatedCareItems.length} associated care items`);
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

  // Check if any care items are using this subcategory
  const associatedCareItems = mockData.careItems.filter(item => item.budgetSubcategoryId === subcategoryId);
  if (associatedCareItems.length > 0) {
    throw new Error(`Cannot delete subcategory "${deletedSubcategory.name}" because it has ${associatedCareItems.length} associated care items`);
  }

  mockData.categories[categoryIndex].subcategories.splice(subcategoryIndex, 1);

  return {
    success: true,
    data: { id: subcategoryId },
    message: `Subcategory "${deletedSubcategory.name}" deleted successfully`
  };
};

// ================================
// CARE ITEMS API (for future use)
// ================================

export const fetchCareItems = async (patientId = DEFAULT_PATIENT_ID) => {
  await simulateDelay(200);

  // In a real API, you would filter care items by patientId
  // For now, we return all care items since we have only one patient
  return {
    success: true,
    data: mockData.careItems,
    patientId,
    timestamp: new Date().toISOString()
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
    careItems: [...initialCareItems],
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
    careItems: (patientId) => [...queryKeys.budget.all, 'careItems', patientId],
  }
};