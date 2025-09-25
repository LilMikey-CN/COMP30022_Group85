// Mock data for budget management

export const budgetData = {
  totalBudget: 8000.00,
  totalSpent: 1020.00,
  totalRemaining: 6980.00,
  categories: [
    {
      id: 'clothing',
      name: 'Clothing',
      budget: 1000.00,
      spent: 20.00,
      remaining: 980.00,
      subcategories: [
        {
          id: 'shirts',
          name: 'Shirts',
          budget: 100.00,
          spent: 20.00,
          remaining: 80.00
        },
        {
          id: 'socks',
          name: 'Socks',
          budget: 50.00,
          spent: 0.00,
          remaining: 50.00
        },
        {
          id: 'pants',
          name: 'Pants',
          budget: 100.00,
          spent: 0.00,
          remaining: 100.00
        }
      ]
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      budget: 500.00,
      spent: 0.00,
      remaining: 500.00,
      subcategories: []
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      budget: 2000.00,
      spent: 1000.00,
      remaining: 1000.00,
      subcategories: [
        {
          id: 'medications',
          name: 'Medications',
          budget: 500.00,
          spent: 500.00,
          remaining: 0.00
        },
        {
          id: 'equipment',
          name: 'Medical Equipment',
          budget: 800.00,
          spent: 300.00,
          remaining: 500.00
        }
      ]
    },
    {
      id: 'transportation',
      name: 'Transportation',
      budget: 1500.00,
      spent: 0.00,
      remaining: 1500.00,
      subcategories: [
        {
          id: 'taxi',
          name: 'Taxi Services',
          budget: 600.00,
          spent: 0.00,
          remaining: 600.00
        },
        {
          id: 'public-transport',
          name: 'Public Transport',
          budget: 200.00,
          spent: 0.00,
          remaining: 200.00
        }
      ]
    }
  ]
};

// Helper functions for budget calculations
export const calculatePercentageSpent = (spent, budget) => {
  if (budget === 0) return 0;
  return Math.round((spent / budget) * 100);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const getTotalAllocatedInSubcategories = (subcategories) => {
  return subcategories.reduce((total, sub) => total + sub.budget, 0);
};

export const getAvailableForSubcategories = (categoryBudget, subcategories) => {
  const allocated = getTotalAllocatedInSubcategories(subcategories);
  return Math.max(0, categoryBudget - allocated);
};
