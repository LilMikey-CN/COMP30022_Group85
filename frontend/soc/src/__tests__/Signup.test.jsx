import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Signup from '../pages/Signup'

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

describe('Signup Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

  test('user can type into email field', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText(/enter your email address/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput.value).toBe('test@example.com')
  })

  test('user can type into password field', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const passwordInput = screen.getByPlaceholderText(/create a secure password/i)
    fireEvent.change(passwordInput, { target: { value: 'mypassword123' } })
    expect(passwordInput.value).toBe('mypassword123')
  })

  test('user can type into confirm password field', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i)
    fireEvent.change(confirmPasswordInput, { target: { value: 'mypassword123' } })
    expect(confirmPasswordInput.value).toBe('mypassword123')
  })

  test('when "Create My Account" is pressed, signup is called and user is redirected', async () => {
    // Arrange: make signup resolve successfully
    mockSignup.mockResolvedValue({ success: true })

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    // Act: fill out the form
    fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
      target: { value: 'password123' },
    })

    // tick the checkbox if you have Terms & Conditions
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    // click submit
    fireEvent.click(screen.getByRole('button', { name: /create my account/i }))

    // Assert: signup was called, then navigated to home
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('user@test.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})