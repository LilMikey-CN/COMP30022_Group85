import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import CalendarPage from '../pages/CalendarPage'

// Mock react-router navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: {} }),
  }
})

// Mock careTasks and executions hooks
vi.mock('../hooks/useCareTasks', () => ({
  useCareTasks: () => ({
    data: { care_tasks: [{ id: 1, name: 'Task A' }] },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('../hooks/useTaskExecutions', () => ({
  useTaskExecutions: () => ({
    data: {
      executions: [
        {
          id: 1,
          care_task_id: 1,
          scheduled_date: dayjs().format('YYYY-MM-DD'),
          status: 'TODO',
        },
      ],
    },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCompleteTaskExecution: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}))

// Mock utils
vi.mock('../utils/taskExecutions', () => ({
  groupExecutionsByDate: (executions) => {
    const map = new Map()
    executions.forEach((e) => map.set(e.scheduled_date, [e]))
    return map
  },
  determineExecutionDayStatus: () => 'upcoming',
  sortExecutionsByTaskThenDate: (items) => items,
  computeCoverableExecutions: vi.fn(() => 0),
  COMPLETED_EXECUTION_STATUSES: new Set(['COMPLETED']),
}))

vi.mock('../utils/messageConfig', () => ({
  showErrorMessage: vi.fn(),
}))

vi.mock('../utils/objectStorage', () => ({
  default: vi.fn(),
}))

vi.mock('../components/CareTasks/CompleteExecutionModal', () => ({
  __esModule: true,
  default: () => <div data-testid="complete-modal" />,
}))

// Helper render
const renderCalendar = () => render(
  <MemoryRouter>
    <CalendarPage />
  </MemoryRouter>
)

describe('CalendarPage', () => {

  it('clicking a date cell updates the right panels selected day label', async () => {
    renderCalendar()
    const today = dayjs().startOf('day')
    const nextDay = today.add(1, 'day')

    const dateCell = screen.getByText(nextDay.date())
    fireEvent.click(dateCell)

    const label = await screen.findByText(nextDay.format('DD/MM/YYYY'))
    expect(label).toBeInTheDocument()
  })

  it('calendar cells display dot indicators when statusByDate includes entries', async () => {
    renderCalendar()

    const dotElements = document.querySelectorAll('span[style*="width: 8px"]')
    expect(dotElements.length).toBeGreaterThan(0)
  })

  it('clicking “Go to task scheduling” redirects to task scheduling page', async () => {
    renderCalendar()
    const button = screen.getByRole('button', { name: /Go to task scheduling/i })
    fireEvent.click(button)
    expect(mockNavigate).toHaveBeenCalledWith('/task-scheduling')
  })
})
