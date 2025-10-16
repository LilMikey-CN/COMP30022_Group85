import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useCareTasks } from './useCareTasks';
import { useTaskExecutions } from './useTaskExecutions';
import { useCategories } from './useCategories';
import { useClientProfile } from './useClientProfile';
import { buildBudgetAnalytics } from '../utils/budgetAnalytics';
import {
  splitExecutionsForDashboard,
  mapExecutionsToListItems,
  buildBudgetSummary,
} from '../utils/patientHome';

const CARE_TASKS_QUERY_PARAMS = { is_active: 'true', limit: 500, offset: 0 };
const EXECUTION_QUERY_PARAMS = { limit: 500, offset: 0 };

const buildCareTaskMap = (careTasks = []) => {
  return careTasks.reduce((acc, task) => {
    if (task?.id) {
      acc[task.id] = task;
    }
    return acc;
  }, {});
};

export const usePatientHomeDashboard = () => {
  const referenceDate = dayjs();

  const {
    data: careTasksResponse,
    isFetching: careTasksFetching,
    isLoading: careTasksLoading,
    error: careTasksError,
  } = useCareTasks(CARE_TASKS_QUERY_PARAMS);

  const careTasks = useMemo(
    () => careTasksResponse?.care_tasks || [],
    [careTasksResponse],
  );
  const careTasksById = useMemo(
    () => buildCareTaskMap(careTasks),
    [careTasks],
  );

  const taskIds = useMemo(
    () => careTasks.map((task) => task.id).filter(Boolean),
    [careTasks],
  );

  const {
    data: executionsResponse,
    isLoading: executionsLoading,
    isFetching: executionsFetching,
    error: executionsError,
  } = useTaskExecutions({
    taskIds,
    params: EXECUTION_QUERY_PARAMS,
  });

  const executions = useMemo(
    () => (executionsResponse?.executions || []).filter((execution) => {
      const task = careTasksById[execution.care_task_id];
      return task && task.is_active !== false;
    }),
    [careTasksById, executionsResponse],
  );

  const {
    todayExecutions,
    overdueExecutions,
    upcomingExecutions,
    earliestOverdueDate,
  } = useMemo(
    () => splitExecutionsForDashboard(executions, referenceDate),
    [executions, referenceDate],
  );

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    isFetching: categoriesFetching,
    error: categoriesError,
  } = useCategories();

  const categories = useMemo(
    () => categoriesResponse?.categories || [],
    [categoriesResponse],
  );

  const budgetAnalytics = useMemo(() => {
    if (!categories.length || !careTasks.length) {
      return null;
    }
    return buildBudgetAnalytics({
      categories,
      careTasks,
      executions,
    });
  }, [categories, careTasks, executions]);

  const budgetSummary = useMemo(
    () => buildBudgetSummary(budgetAnalytics),
    [budgetAnalytics],
  );

  const summaryMetrics = useMemo(() => ({
    todayCount: todayExecutions.length,
    overdueCount: overdueExecutions.length,
    budget: budgetSummary,
  }), [budgetSummary, overdueExecutions.length, todayExecutions.length]);

  const upcomingItems = useMemo(() => mapExecutionsToListItems({
    executions: upcomingExecutions,
    careTasksById,
    today: referenceDate,
    markOverdue: false,
  }), [careTasksById, upcomingExecutions, referenceDate]);

  const overdueItems = useMemo(() => mapExecutionsToListItems({
    executions: overdueExecutions,
    careTasksById,
    today: referenceDate,
    markOverdue: true,
  }), [careTasksById, overdueExecutions, referenceDate]);

  const {
    data: clientProfile,
    isLoading: clientProfileLoading,
    isFetching: clientProfileFetching,
  } = useClientProfile();

  const clientName = useMemo(() => {
    const name = clientProfile?.personalDetails?.fullName?.trim();
    if (name) {
      return name;
    }
    return 'Client';
  }, [clientProfile]);

  const loading = careTasksLoading
    || careTasksFetching
    || executionsLoading
    || executionsFetching
    || categoriesLoading
    || categoriesFetching
    || clientProfileLoading
    || clientProfileFetching;

  const error = careTasksError || executionsError || categoriesError || null;

  const todayDateIso = referenceDate.startOf('day').format('YYYY-MM-DD');
  const overdueDateIso = earliestOverdueDate
    ? earliestOverdueDate.startOf('day').format('YYYY-MM-DD')
    : todayDateIso;

  return {
    loading,
    error,
    clientName,
    summaryMetrics,
    upcoming: {
      items: upcomingItems,
      total: upcomingExecutions.length,
      hasOverflow: upcomingExecutions.length > 5,
    },
    overdue: {
      items: overdueItems,
      total: overdueExecutions.length,
      hasOverflow: overdueExecutions.length > 5,
      earliestDate: earliestOverdueDate,
    },
    navigationTargets: {
      calendarToday: {
        path: '/calendar',
        state: { focusDate: todayDateIso },
      },
      calendarOverdue: {
        path: '/calendar',
        state: { focusDate: overdueDateIso, focusType: 'overdue' },
      },
      budget: {
        path: '/budget',
      },
      scheduling: {
        path: '/task-scheduling',
      },
    },
  };
};

export default usePatientHomeDashboard;
