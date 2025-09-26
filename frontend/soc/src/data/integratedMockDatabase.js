// Integrated Mock Database for Care Item and Budget Tracking System
// This file represents the data structure that would be retrieved from the backend

// Budget Categories and Subcategories
export const budgetCategories = [
  {
    id: 'hygiene',
    name: 'Hygiene',
    description: 'Personal hygiene and cleanliness items',
    color: '#722ed1',
    subcategories: [
      {
        id: 'toothbrush',
        name: 'Toothbrush',
        categoryId: 'hygiene'
      },
      {
        id: 'bedsheets',
        name: 'Bedsheets',
        categoryId: 'hygiene'
      },
      {
        id: 'air-filter',
        name: 'Air Filter',
        categoryId: 'hygiene'
      }
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Clothing and wearable items',
    color: '#13c2c2',
    subcategories: [
      {
        id: 'socks',
        name: 'Socks',
        categoryId: 'clothing'
      },
      {
        id: 'shirts',
        name: 'Shirts',
        categoryId: 'clothing'
      },
      {
        id: 'pants',
        name: 'Pants',
        categoryId: 'clothing'
      }
    ]
  },
  {
    id: 'medical',
    name: 'Medical',
    description: 'Healthcare and medical related expenses',
    color: '#1890ff',
    subcategories: [
      {
        id: 'dental-visits',
        name: 'Dental Visits',
        categoryId: 'medical'
      },
      {
        id: 'physical-exams',
        name: 'Physical Exams',
        categoryId: 'medical'
      },
      {
        id: 'medications',
        name: 'Medications',
        categoryId: 'medical'
      },
      {
        id: 'blood-tests',
        name: 'Blood Tests',
        categoryId: 'medical'
      }
    ]
  }
];

// Care Items with budget integration
export const careItems = [
  {
    id: 'CI-001',
    name: 'Replace toothbrush',
    description: 'Replace toothbrush for oral hygiene',
    estimatedCostPerItem: 10.00,
    frequency: 30, // days
    frequencyUnit: 'days',
    frequencyDescription: 'Monthly',
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'toothbrush',
    priority: 'medium',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2025-01-30',
    isRecurring: true,
    notes: 'Use soft bristles for sensitive gums'
  },
  {
    id: 'CI-002',
    name: 'Replace bedsheets',
    description: 'Replace bedsheets for hygiene and comfort',
    estimatedCostPerItem: 45.00,
    frequency: 180, // days (6 months)
    frequencyUnit: 'days',
    frequencyDescription: 'Every 6 months',
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'bedsheets',
    priority: 'low',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2025-07-01',
    isRecurring: true,
    notes: 'Prefer cotton or bamboo fiber'
  },
  {
    id: 'CI-003',
    name: 'New socks',
    description: 'Purchase new socks for daily wear',
    estimatedCostPerItem: 25.00,
    frequency: 365, // days (yearly)
    frequencyUnit: 'days',
    frequencyDescription: 'Yearly',
    budgetCategoryId: 'clothing',
    budgetSubcategoryId: 'socks',
    priority: 'low',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2026-01-01',
    isRecurring: true,
    notes: 'Buy 6-pack of cotton socks'
  },
  {
    id: 'CI-004',
    name: 'Dental visit',
    description: 'Regular dental checkup and cleaning',
    estimatedCostPerItem: 150.00,
    frequency: 180, // days (6 months)
    frequencyUnit: 'days',
    frequencyDescription: 'Every 6 months',
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'dental-visits',
    priority: 'high',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2025-07-01',
    isRecurring: true,
    notes: 'Book with Dr. Smith at Central Dental'
  },
  {
    id: 'CI-005',
    name: 'Physical exam',
    description: 'Comprehensive physical examination',
    estimatedCostPerItem: 200.00,
    frequency: 90, // days (3 months)
    frequencyUnit: 'days',
    frequencyDescription: 'Every 3 months',
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'physical-exams',
    priority: 'high',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2025-04-01',
    isRecurring: true,
    notes: 'Include blood pressure and weight monitoring'
  },
  {
    id: 'CI-006',
    name: 'Medication refill',
    description: 'Monthly prescription medication refill',
    estimatedCostPerItem: 75.00,
    frequency: 30, // days (monthly)
    frequencyUnit: 'days',
    frequencyDescription: 'Monthly',
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'medications',
    priority: 'high',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2025-01-30',
    isRecurring: true,
    notes: 'Metformin 500mg and Lisinopril 10mg'
  },
  {
    id: 'CI-007',
    name: 'Blood pressure check',
    description: 'Regular blood pressure monitoring',
    estimatedCostPerItem: 0.00, // Free at home
    frequency: 14, // days (bi-weekly)
    frequencyUnit: 'days',
    frequencyDescription: 'Bi-weekly',
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'blood-tests',
    priority: 'medium',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2025-01-15',
    isRecurring: true,
    notes: 'Use home blood pressure monitor'
  },
  {
    id: 'CI-008',
    name: 'Replace air filter',
    description: 'Replace HVAC air filter for clean air',
    estimatedCostPerItem: 20.00,
    frequency: 90, // days (3 months)
    frequencyUnit: 'days',
    frequencyDescription: 'Every 3 months',
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'air-filter',
    priority: 'low',
    status: 'active',
    createdDate: '2025-01-01',
    nextDueDate: '2025-04-01',
    isRecurring: true,
    notes: 'MERV 11 filter, 16x25x1 size'
  }
];

// Care Tasks - Individual instances of completed or scheduled care items
export const careTasks = [
  // Completed tasks for tracking actual spending
  {
    id: 'CT-001',
    careItemId: 'CI-001',
    careItemName: 'Replace toothbrush',
    scheduledDate: '2025-01-30',
    completedDate: '2025-01-30',
    actualCost: 12.50,
    estimatedCost: 10.00,
    status: 'completed',
    notes: 'Bought electric toothbrush instead',
    receiptUrl: null,
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'toothbrush'
  },
  {
    id: 'CT-002',
    careItemId: 'CI-001',
    careItemName: 'Replace toothbrush',
    scheduledDate: '2025-03-01',
    completedDate: '2025-03-01',
    actualCost: 8.00,
    estimatedCost: 10.00,
    status: 'completed',
    notes: 'Found on sale',
    receiptUrl: null,
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'toothbrush'
  },
  {
    id: 'CT-003',
    careItemId: 'CI-001',
    careItemName: 'Replace toothbrush',
    scheduledDate: '2025-04-01',
    completedDate: '2025-04-02',
    actualCost: 15.00,
    estimatedCost: 10.00,
    status: 'completed',
    notes: 'Premium brand with whitening',
    receiptUrl: null,
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'toothbrush'
  },
  {
    id: 'CT-004',
    careItemId: 'CI-006',
    careItemName: 'Medication refill',
    scheduledDate: '2025-01-30',
    completedDate: '2025-01-30',
    actualCost: 75.00,
    estimatedCost: 75.00,
    status: 'completed',
    notes: 'Standard refill',
    receiptUrl: null,
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'medications'
  },
  {
    id: 'CT-005',
    careItemId: 'CI-006',
    careItemName: 'Medication refill',
    scheduledDate: '2025-03-01',
    completedDate: '2025-03-01',
    actualCost: 80.00,
    estimatedCost: 75.00,
    status: 'completed',
    notes: 'Price increase from pharmacy',
    receiptUrl: null,
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'medications'
  },
  {
    id: 'CT-006',
    careItemId: 'CI-005',
    careItemName: 'Physical exam',
    scheduledDate: '2025-04-01',
    completedDate: '2025-04-01',
    actualCost: 180.00,
    estimatedCost: 200.00,
    status: 'completed',
    notes: 'Insurance covered part of the cost',
    receiptUrl: null,
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'physical-exams'
  },
  // Upcoming scheduled tasks
  {
    id: 'CT-007',
    careItemId: 'CI-001',
    careItemName: 'Replace toothbrush',
    scheduledDate: '2025-05-01',
    completedDate: null,
    actualCost: null,
    estimatedCost: 10.00,
    status: 'scheduled',
    notes: null,
    receiptUrl: null,
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'toothbrush'
  },
  {
    id: 'CT-008',
    careItemId: 'CI-006',
    careItemName: 'Medication refill',
    scheduledDate: '2025-04-30',
    completedDate: null,
    actualCost: null,
    estimatedCost: 75.00,
    status: 'scheduled',
    notes: null,
    receiptUrl: null,
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'medications'
  },
  {
    id: 'CT-009',
    careItemId: 'CI-004',
    careItemName: 'Dental visit',
    scheduledDate: '2025-07-01',
    completedDate: null,
    actualCost: null,
    estimatedCost: 150.00,
    status: 'scheduled',
    notes: null,
    receiptUrl: null,
    budgetCategoryId: 'medical',
    budgetSubcategoryId: 'dental-visits'
  },
  // Overdue tasks
  {
    id: 'CT-010',
    careItemId: 'CI-002',
    careItemName: 'Replace bedsheets',
    scheduledDate: '2025-01-01',
    completedDate: null,
    actualCost: null,
    estimatedCost: 45.00,
    status: 'overdue',
    notes: null,
    receiptUrl: null,
    budgetCategoryId: 'hygiene',
    budgetSubcategoryId: 'bedsheets'
  }
];

// Patient information
export const patients = [
  {
    id: 'PT-2025-02-001',
    name: 'Mary Poppins',
    initials: 'MP',
    age: 40,
    email: 'spoonful.of.sugar@gmail.com',
    mobile: '04 8888 8888',
    notes: 'Prefers morning treatments',
    careItems: ['CI-001', 'CI-002', 'CI-003', 'CI-004', 'CI-005', 'CI-006', 'CI-007', 'CI-008']
  }
];

// Budget Analytics Data (calculated from care items and tasks)
export const budgetAnalytics = {
  totalAnnualBudget: 0, // Will be calculated
  totalSpentToDate: 0, // Will be calculated
  totalRemainingBudget: 0, // Will be calculated
  categoryBreakdown: [], // Will be calculated
  monthlySpending: [], // Will be calculated
  varianceAnalysis: [], // Will be calculated
  projectedYearEndSpending: 0 // Will be calculated
};

// System configuration
export const systemConfig = {
  currency: 'AUD',
  fiscalYearStart: '2025-01-01',
  fiscalYearEnd: '2025-12-31',
  defaultFrequencyUnit: 'days',
  budgetAlertThresholds: {
    warning: 0.8, // 80% of budget spent
    critical: 0.95 // 95% of budget spent
  }
};