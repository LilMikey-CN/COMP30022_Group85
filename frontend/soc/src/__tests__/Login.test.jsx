import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Login from '../pages/Login'
import { message } from 'antd'

// Mock message from Ant Design
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn() },
  }
})

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock auth store
const mockLogin = vi.fn()
vi.mock('../store/authStore', () => ({
  __esModule: true,
  default: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
  }),
}))

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('user can type into email field', () => {
    renderWithRouter(<Login />)

    const emailInput = screen.getByPlaceholderText(/email address/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput.value).toBe('test@example.com')
  })

  test('user can type into password field', () => {
    renderWithRouter(<Login />)

    const passwordInput = screen.getByPlaceholderText(/password/i)
    fireEvent.change(passwordInput, { target: { value: 'secret123' } })
    expect(passwordInput.value).toBe('secret123')
  })

  test('user can check/uncheck "Remember me" checkbox', () => {
    renderWithRouter(<Login />)

    const checkbox = screen.getByRole('checkbox', { name: /remember me/i })
    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(true)

    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(false)
  })

  test('successful login calls login() and navigates to /home', async () => {
    mockLogin.mockResolvedValue({ success: true })

    renderWithRouter(<Login />)

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: /remember me/i }))
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123', true)
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
        expect(message.success).toHaveBeenCalledWith('Login successful!')    
    })
  })

  test('clicking "Create Your Account" navigates to /signup', () => {
    renderWithRouter(<Login />)

    fireEvent.click(screen.getByRole('button', { name: /create your account/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })

  // FIX: firebase error message -> user-friendly error message
  test.skip('login failure shows error message and does not navigate', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      error: 'auth/wrong-password',
    })
  
    renderWithRouter(<Login />)
  
    fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrongpassword' },
    })
  
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  
    // Assert: login was called, error is shown, no navigation
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'wrongpassword', undefined)
      expect(message.error).toHaveBeenCalledWith('Incorrect password. Please try again.')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })  
})