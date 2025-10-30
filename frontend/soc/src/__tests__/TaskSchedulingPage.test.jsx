import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskSchedulingPage from '../pages/TaskSchedulingPage';

vi.mock('../hooks/useCareTasks', () => ({
  useCareTasks: vi.fn(() => ({
    data: { care_tasks: [{ id: 1, name: 'Medication Reminder', task_type: 'GENERAL' }] },
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  })),
  useCreateManualExecution: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('../hooks/useTaskExecutions', () => ({
  useTaskExecutions: vi.fn(() => ({
    data: { executions: [{ id: 101, care_task_id: 1, status: 'TODO', scheduled_date: '2025-10-17' }] },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  })),
  useUpdateTaskExecution: vi.fn(() => ({ mutateAsync: vi.fn(), mutate: vi.fn(), isLoading: false })),
  useCompleteTaskExecution: vi.fn(() => ({ mutateAsync: vi.fn(), isLoading: false })),
  useRefundTaskExecution: vi.fn(() => ({ mutateAsync: vi.fn(), isLoading: false })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TaskSchedulingPage', () => {
  test('renders the page title', () => {
    renderWithProviders(<TaskSchedulingPage />);
    expect(screen.getByText(/task scheduling/i)).toBeInTheDocument();
  });

  test('clicking "Care tasks" button triggers navigation', () => {
    renderWithProviders(<TaskSchedulingPage />);
    const careTasksButton = screen.getByText(/care tasks/i);
    fireEvent.click(careTasksButton);
    expect(mockNavigate).toHaveBeenCalledWith('/care-tasks');
  });

  test('renders table with a task execution', () => {
    renderWithProviders(<TaskSchedulingPage />);
    expect(screen.getByText(/medication reminder/i)).toBeInTheDocument();
    expect(screen.getByText(/todo/i)).toBeInTheDocument();
  });

  test('search input updates value', () => {
    renderWithProviders(<TaskSchedulingPage />);
    const searchInput = screen.getByPlaceholderText(/search by task or notes/i);
    fireEvent.change(searchInput, { target: { value: 'Medication' } });
    expect(searchInput.value).toBe('Medication');
  });
});
