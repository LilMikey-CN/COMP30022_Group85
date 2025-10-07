// Integrated mock data used by the budgeting UI.
// In production these values would be supplied by the backend API.

export const budgetCategories = [
  {
    id: 'hygiene',
    name: 'Hygiene',
    description: 'Personal hygiene and cleanliness',
    color: '#722ed1',
    annualBudget: 900,
    subcategories: [
      {
        id: 'toothbrush',
        name: 'Toothbrush',
        categoryId: 'hygiene',
        annualBudget: 150
      },
      {
        id: 'bedsheets',
        name: 'Bedsheets',
        categoryId: 'hygiene',
        annualBudget: 240
      },
      {
        id: 'air-filter',
        name: 'Air Filter',
        categoryId: 'hygiene',
        annualBudget: 210
      }
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Clothing and wearable items',
    color: '#13c2c2',
    annualBudget: 600,
    subcategories: [
      {
        id: 'socks',
        name: 'Socks',
        categoryId: 'clothing',
        annualBudget: 150
      },
      {
        id: 'shirts',
        name: 'Shirts',
        categoryId: 'clothing',
        annualBudget: 220
      },
      {
        id: 'pants',
        name: 'Pants',
        categoryId: 'clothing',
        annualBudget: 230
      }
    ]
  },
  {
    id: 'medical',
    name: 'Medical',
    description: 'Healthcare and medical related expenses',
    color: '#1890ff',
    annualBudget: 4200,
    subcategories: [
      {
        id: 'dental-visits',
        name: 'Dental Visits',
        categoryId: 'medical',
        annualBudget: 900
      },
      {
        id: 'physical-exams',
        name: 'Physical Exams',
        categoryId: 'medical',
        annualBudget: 1100
      },
      {
        id: 'medications',
        name: 'Medications',
        categoryId: 'medical',
        annualBudget: 1600
      },
      {
        id: 'blood-tests',
        name: 'Blood Tests',
        categoryId: 'medical',
        annualBudget: 600
      }
    ]
  }
];

// Task-centric budget events (completed, scheduled, and overdue)
export const careTasks = [
  {
    id: 'CT-001',
    name: 'Replace toothbrush',
    taskType: 'PURCHASE',
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
    name: 'Replace toothbrush',
    taskType: 'PURCHASE',
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
    name: 'Replace toothbrush',
    taskType: 'PURCHASE',
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
    name: 'Medication refill',
    taskType: 'PURCHASE',
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
    name: 'Medication refill',
    taskType: 'PURCHASE',
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
    name: 'Physical exam',
    taskType: 'GENERAL',
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
  {
    id: 'CT-007',
    name: 'Replace toothbrush',
    taskType: 'PURCHASE',
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
    name: 'Medication refill',
    taskType: 'PURCHASE',
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
    name: 'Dental visit',
    taskType: 'GENERAL',
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
  {
    id: 'CT-010',
    name: 'Replace bedsheets',
    taskType: 'PURCHASE',
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

export const patients = [
  {
    id: 'PT-2025-02-001',
    name: 'Mary Poppins',
    initials: 'MP',
    age: 40,
    email: 'spoonful.of.sugar@gmail.com',
    mobile: '04 8888 8888',
    notes: 'Prefers morning treatments'
  }
];

export const budgetAnalytics = {
  totalAnnualBudget: 0,
  totalSpentToDate: 0,
  totalRemainingBudget: 0,
  categoryBreakdown: [],
  monthlySpending: [],
  varianceAnalysis: [],
  projectedYearEndSpending: 0
};

export const systemConfig = {
  currency: 'AUD',
  fiscalYearStart: '2025-01-01',
  fiscalYearEnd: '2025-12-31',
  defaultFrequencyUnit: 'days',
  budgetAlertThresholds: {
    warning: 0.8,
    critical: 0.95
  }
};
