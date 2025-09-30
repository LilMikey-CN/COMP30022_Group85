import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Signup from '../pages/Signup'

describe('Signup Component', () => {
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
})