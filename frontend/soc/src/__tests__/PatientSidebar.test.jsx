import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PatientSidebar from '../components/Layout/PatientSidebar'
import { expect, vi } from 'vitest'
import { message } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Ant Design message
vi.mock('antd', async () => {
    const actual = await vi.importActual('antd')
    return {
      ...actual,
      message: { success: vi.fn(), error: vi.fn() },
    }
  })  

// Mock authStore
const mockLogout = vi.fn()
vi.mock('../store/authStore', () => ({
  __esModule: true,
  default: () => ({
    user: { displayName: 'John Doe', email: 'johndoe@example.com' },
    logout: mockLogout,
  }),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // so tests fail fast instead of retrying
    },
  })

const renderWithProviders = (path = '/home') => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<PatientSidebar />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('PatientSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('sidebar renders with header text "Scheduling of Care" present', () => {
    renderWithProviders(<PatientSidebar />)
    expect(screen.getByText('Scheduling of Care')).toBeInTheDocument()
  })

  test('renders all sidebar pages', () => {
    renderWithProviders(<PatientSidebar />)
    const menuItems = ['Home', 'Calendar', 'List', 'Budget', 'Client Profile', 'Settings']
    menuItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  test.skip('displays user initials and display name correctly', () => {
    renderWithProviders()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  test('active menu item gets correct styling', () => {
    renderWithProviders('/list')

    const listItem = screen.getByText('List')
    expect(listItem).toHaveStyle({ color: '#1890ff', fontWeight: '500' })

    const homeItem = screen.getByText('Home')
    expect(homeItem).toHaveStyle({ color: '#595959', fontWeight: 'normal' })
  })

  test('clicking logout calls logout and navigates to login page on success', async () => {
    mockLogout.mockResolvedValue({ success: true })

    renderWithProviders()
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(message.success).toHaveBeenCalledWith('Logged out successfully')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  test('shows error message if logout fails', async () => {
    mockLogout.mockResolvedValue({ success: false, error: 'Server error' })

    renderWithProviders()
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(message.error).toHaveBeenCalledWith('Server error')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  test('shows generic error message if logout throws an exception', async () => {
    mockLogout.mockRejectedValue(new Error('Unexpected failure'))

    renderWithProviders()
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(message.error).toHaveBeenCalledWith(
        'An unexpected error occurred during logout'
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  test('clicking a sidebar menu item navigates to that page', async () => {
    renderWithProviders()
    const calendarItem = screen.getByText('Calendar')
    fireEvent.click(calendarItem)
    expect(mockNavigate).toHaveBeenCalledWith('/calendar')
  })
})