import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { careTasksService } from '../services/careTasksApi';
import { taskExecutionsService } from '../services/taskExecutionsApi';

export const TASK_EXECUTIONS_QUERY_KEY = 'taskExecutions';

export const useTaskExecutions = ({ taskIds = [], params = {} } = {}) => {
  const sanitizedIds = Array.isArray(taskIds)
    ? [...new Set(taskIds.filter(Boolean))]
    : [];

  return useQuery({
    queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'list', sanitizedIds.slice().sort(), params],
    enabled: sanitizedIds.length > 0,
    placeholderData: { executions: [], count: 0 },
    queryFn: async () => {
      const queryParams = {};
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams[key] = value;
        }
      });

      try {
        const executionLists = await Promise.all(
          sanitizedIds.map(async (taskId) => {
            try {
              const response = await careTasksService.getExecutionsForTask(taskId, queryParams);
              const executions = response?.executions || [];
              return executions.map((execution) => ({
                ...execution,
                care_task_id: execution.care_task_id || taskId,
              }));
            } catch (error) {
              if (error.message.includes('User not authenticated')) {
                return [];
              }
              throw error;
            }
          })
        );

        const flattened = executionLists.flat();
        return {
          executions: flattened,
          count: flattened.length,
        };
      } catch (error) {
        if (error.message.includes('User not authenticated')) {
          return { executions: [], count: 0 };
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('User not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useTaskExecutionsForTask = (taskId, params = {}) => {
  return useQuery({
    queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', taskId, params],
    queryFn: async () => await careTasksService.getExecutionsForTask(taskId, params),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
};

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
      queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY], exact: false });
      if (variables?.taskId) {
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
      queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY], exact: false });
      if (variables?.taskId) {
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

export const useCoverTaskExecutions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ coveringExecutionId, executionIds }) => await taskExecutionsService.coverExecutions(coveringExecutionId, executionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY], exact: false });
      if (variables?.taskId) {
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
