import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CareTasksPage from '../pages/CareTasksPage';

vi.mock('../hooks/useCareTasks', async () => {
  const actual = await vi.importActual('../hooks/useCareTasks');
  return {
    ...actual,
    useCareTasks: vi.fn(() => ({
      data: [
        { id: 1, name: 'Medication Reminder', type: 'daily' },
        { id: 2, name: 'Check-up Appointment', type: 'weekly' },
      ],
      isLoading: false,
    })),
    useCreateManualExecution: vi.fn(() => ({
      mutateAsync: vi.fn(),
    })),
    useCareTaskFilters: vi.fn(() => ({
      filters: { type: 'all' },
      setFilters: vi.fn(),
    })),
  };
});

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('CareTasksPage', () => {
  test('Pressing "New care task" opens "create care task" popup', () => {
    renderWithProviders(<CareTasksPage />);
    const button = screen.getByText(/new care task/i);
    fireEvent.click(button);

    expect(screen.getByText(/create care task/i)).toBeInTheDocument();
  });

  test('Pressing "Task Scheduling" redirects user to Task Scheduling page', () => {
    renderWithProviders(<CareTasksPage />);
    const schedulingBtn = screen.getByRole('button', { name: /task scheduling/i });
    fireEvent.click(schedulingBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/task-scheduling')
  });
});
