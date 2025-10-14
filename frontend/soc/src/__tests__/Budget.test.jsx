import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Budget from '../pages/Budget'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock subcomponents
vi.mock('../components/Budget/BudgetSummaryCard', () => ({
  __esModule: true,
  default: () => <div data-testid="BudgetSummaryCard" />,
}))

vi.mock('../components/Budget/BudgetAnalytics', () => ({
  __esModule: true,
  default: () => <div data-testid="BudgetAnalytics" />,
}))

vi.mock('../components/Budget/CategoryBudgetCard', () => ({
  __esModule: true,
  default: ({ category }) => (
    <div data-testid="CategoryBudgetCard">{category.name}</div>
  ),
}))

// Mock the useBudgetManagement hook
const mockHandleAddCategory = vi.fn()

vi.mock('../hooks/useBudgetManagement', () => ({
  __esModule: true,
  default: () => ({
    isLoading: false,
    error: null,
    categories: [],
    categoriesLoading: false,
    budgetAnalytics: {
      categoryBreakdown: [
        { id: 1, name: 'Supplies', amountSpent: 100 },
        { id: 2, name: 'Transport', amountSpent: 50 },
      ],
    },
    categoryModalState: { open: false },
    careTaskModalState: { open: false },
    createCategoryMutation: { isPending: false },
    createCareTask: { isPending: false },
    updateCareTask: { isPending: false },
    handleAddCategory: mockHandleAddCategory,
    handleEditCategory: vi.fn(),
    handleAddCareTask: vi.fn(),
    handleEditCareTask: vi.fn(),
    handleCreateCareTask: vi.fn(),
    handleUpdateCareTask: vi.fn(),
    handleCreateCategory: vi.fn(),
    closeCategoryModal: vi.fn(),
    closeCareTaskModal: vi.fn(),
  }),
}))

function renderWithClient(ui) {
    const queryClient = new QueryClient()
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    )
  }  

describe('Budget Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders main title “Budget Management”', () => {
    renderWithClient(<Budget />)

    expect(screen.getByText('Budget Management')).toBeInTheDocument()
  })

  test('renders BudgetSummaryCard and BudgetAnalytics components', () => {
    renderWithClient(<Budget />)

    expect(screen.getByTestId('BudgetSummaryCard')).toBeInTheDocument()
    expect(screen.getByTestId('BudgetAnalytics')).toBeInTheDocument()
  })

  test('clicking "Add category" calls handleAddCategory', () => {
    renderWithClient(<Budget />)

    const button = screen.getByRole('button', { name: /add category/i })
    fireEvent.click(button)
    expect(mockHandleAddCategory).toHaveBeenCalledTimes(1)
  })

  test('renders one CategoryBudgetCard per entry in categoryBreakdown', () => {
    renderWithClient(<Budget />)

    const cards = screen.getAllByTestId('CategoryBudgetCard')
    expect(cards).toHaveLength(2)
    expect(screen.getByText('Supplies')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
  })
})