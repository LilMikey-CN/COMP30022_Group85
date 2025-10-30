import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { message } from 'antd';
import { careTasksService } from '../services/careTasksApi';
import { taskExecutionsService } from '../services/taskExecutionsApi';

export const TASK_EXECUTIONS_QUERY_KEY = 'taskExecutions';

// Remove empty values so query strings stay clean.
const sanitizeParams = (params = {}) => {
  const queryParams = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams[key] = value;
    }
  });
  return queryParams;
};

// Fetch executions for a single task and swallow auth errors into empty payloads.
const fetchExecutionsForTask = async (taskId, params = {}) => {
  try {
    return await careTasksService.getExecutionsForTask(taskId, params);
  } catch (error) {
    if (error.message?.includes('User not authenticated')) {
      return { executions: [], count: 0 };
    }
    throw error;
  }
};

// Aggregate execution queries per task ID while keeping individual caches per task.
export const useTaskExecutions = ({ taskIds = [], params = {} } = {}) => {
  const sanitizedIds = useMemo(() => (
    Array.isArray(taskIds)
      ? [...new Set(taskIds.filter(Boolean))]
      : []
  ), [taskIds]);

  const queryParams = useMemo(() => sanitizeParams(params), [params]);

  const queries = useQueries({
    queries: sanitizedIds.map((taskId) => ({
      queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', taskId, queryParams],
      queryFn: () => fetchExecutionsForTask(taskId, queryParams),
      placeholderData: { executions: [], count: 0 },
      staleTime: 60 * 1000,
    })),
  });

  const combinedExecutions = useMemo(() => {
    return queries.flatMap((query, index) => {
      const executions = query.data?.executions || [];
      const taskId = sanitizedIds[index];
      return executions.map((execution) => ({
        ...execution,
        care_task_id: execution.care_task_id || taskId,
      }));
    });
  }, [queries, sanitizedIds]);

  const data = useMemo(() => ({
    executions: sanitizedIds.length === 0 ? [] : combinedExecutions,
    count: sanitizedIds.length === 0 ? 0 : combinedExecutions.length,
  }), [combinedExecutions, sanitizedIds.length]);

  const hasTasks = sanitizedIds.length > 0;
  const isLoading = hasTasks ? queries.some((query) => query.isLoading || query.isPending) : false;
  const isFetching = hasTasks ? queries.some((query) => query.isFetching) : false;
  const isSuccess = hasTasks ? queries.every((query) => query.isSuccess) : true;
  const isError = hasTasks ? queries.some((query) => query.isError) : false;
  const error = hasTasks ? queries.find((query) => query.error)?.error ?? null : null;

  const refetch = async () => {
    if (!hasTasks) {
      return [];
    }
    return Promise.all(queries.map((query) => query.refetch()));
  };

  return {
    data,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    error,
    refetch,
  };
};

// Convenience hook for views that only need executions for one task.
export const useTaskExecutionsForTask = (taskId, params = {}) => {
  const queryParams = useMemo(() => sanitizeParams(params), [params]);

  return useQuery({
    queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', taskId, queryParams],
    queryFn: async () => await fetchExecutionsForTask(taskId, queryParams),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
};

// Patch a single execution and refresh the parent task plus the care-task lists.
export const useUpdateTaskExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload, taskId }) => {
      if (!taskId) {
        throw new Error('Care task id is required to update an execution');
      }
      return await taskExecutionsService.updateTaskExecution(taskId, id, payload);
    },
    onSuccess: (_, variables) => {
      if (variables?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['careTasks'], exact: false });
        queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', variables.taskId], exact: false });
        queryClient.invalidateQueries({ queryKey: ['careTasks', 'detail', variables.taskId] });
      }
      message.success('Task execution updated');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to update task execution';
      message.error(reason);
    },
  });
};

// Mark an execution as complete and refresh the relevant caches.
export const useCompleteTaskExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload, taskId }) => {
      if (!taskId) {
        throw new Error('Care task id is required to complete an execution');
      }
      return await taskExecutionsService.completeTaskExecution(taskId, id, payload);
    },
    onSuccess: (_, variables) => {
      if (variables?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['careTasks'], exact: false });
        queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', variables.taskId], exact: false });
        queryClient.invalidateQueries({ queryKey: ['careTasks', 'detail', variables.taskId] });
      }
      message.success('Task execution marked complete');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to complete task execution';
      message.error(reason);
    },
  });
};

// Mark executions as covered by another execution and keep caches in sync.
export const useCoverTaskExecutions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ coveringExecutionId, executionIds, taskId }) => {
      if (!taskId) {
        throw new Error('Care task id is required to cover executions');
      }
      return await taskExecutionsService.coverExecutions(coveringExecutionId, executionIds);
    },
    onSuccess: (_, variables) => {
      if (variables?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['careTasks'], exact: false });
        queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', variables.taskId], exact: false });
        queryClient.invalidateQueries({ queryKey: ['careTasks', 'detail', variables.taskId] });
      }
      message.success('Executions marked as covered');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to cover executions';
      message.error(reason);
    },
  });
};

// Record a refund against an execution and refresh the parent task caches.
export const useRefundTaskExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, executionId, payload }) => {
      if (!taskId) {
        throw new Error('Care task id is required to record a refund');
      }
      if (!executionId) {
        throw new Error('Execution id is required to record a refund');
      }
      return await taskExecutionsService.refundTaskExecution(taskId, executionId, payload);
    },
    onSuccess: (_, variables) => {
      if (variables?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['careTasks'], exact: false });
        queryClient.invalidateQueries({
          queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', variables.taskId],
          exact: false
        });
        queryClient.invalidateQueries({ queryKey: ['careTasks', 'detail', variables.taskId] });
      }
      message.success('Refund recorded');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to record refund';
      message.error(reason);
    }
  });
};
