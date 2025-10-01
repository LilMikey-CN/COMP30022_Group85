import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Signup from '../pages/Signup'
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
const mockSignup = vi.fn()
vi.mock('../store/authStore', () => ({
    __esModule: true,
    default: () => ({
        signup: mockSignup,
        isAuthenticated: false,
        isLoading: false,
    }),
}))

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Signup Component', () => {
  beforeEach(() => {
      vi.clearAllMocks()
  })

  test('user can type into email field', () => {
    renderWithRouter(<Signup />)

    const emailInput = screen.getByPlaceholderText(/enter your email address/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput.value).toBe('test@example.com')
  })

  test('user can type into password field', () => {
    renderWithRouter(<Signup />)

    const passwordInput = screen.getByPlaceholderText(/create a secure password/i)
    fireEvent.change(passwordInput, { target: { value: 'mypassword123' } })
    expect(passwordInput.value).toBe('mypassword123')
  })

  test('user can type into confirm password field', () => {
    renderWithRouter(<Signup />)

    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i)
    fireEvent.change(confirmPasswordInput, { target: { value: 'mypassword123' } })
    expect(confirmPasswordInput.value).toBe('mypassword123')
  })

  test('clicking "Create My Account" calls signup and redirects user', async () => {
    mockSignup.mockResolvedValue({ success: true })

    renderWithRouter(<Signup />)

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
      target: { value: 'password123' },
    })

    // Tick checkbox Terms and Conditions
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button', { name: /create my account/i }))

    // Assert: signup was called, then navigated to home
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('user@test.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/')
      expect(screen.getByRole('checkbox')).toBeChecked()
      expect(message.success).toHaveBeenCalledWith('Account created successfully!')
    })
  })

  // FIX: firebase error message -> user-friendly error message
  test.skip('signup failure shows error message and does not navigate', async () => {
    mockSignup.mockResolvedValue({
      success: false,
      error: 'auth/email-already-in-use',
    })

    renderWithRouter(<Signup />)

    fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('checkbox'))

    fireEvent.click(screen.getByRole('button', { name: /create my account/i }))

    // Assert: error message is shown, navigation does not occur
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('existing@example.com', 'password123')
      expect(message.error).toHaveBeenCalledWith(
        'This email is already registered. Please use a different email or try logging in.'
      )      
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  test('error message if passwords do not match', async () => {
    renderWithRouter(<Signup />)
  
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
      target: { value: 'differentpass' },
    });
  
    fireEvent.click(screen.getByRole('button', { name: /create my account/i }));
  
    // Wait to render validation message
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });
  
  test('error message if Terms and Conditions are not accepted', async () => {
    renderWithRouter(<Signup />)
  
    fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
      target: { value: 'password123' },
    });
  
    fireEvent.click(screen.getByRole('button', { name: /create my account/i }));
  
    // Assert: render validation message, doesn't allow sign up or navigate
    expect(await screen.findByText('Please accept the terms')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSignup).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})