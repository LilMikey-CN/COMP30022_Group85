import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { careTasksService } from '../services/careTasksApi';
import { taskExecutionsService } from '../services/taskExecutionsApi';

export const TASK_EXECUTIONS_QUERY_KEY = 'taskExecutions';

export const useTaskExecutions = (params = {}) => {
  return useQuery({
    queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'list', params],
    queryFn: async () => {
      try {
        return await taskExecutionsService.getTaskExecutions(params);
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
    mutationFn: async ({ id, payload }) => await taskExecutionsService.updateTaskExecution(id, payload),
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
    mutationFn: async ({ id, payload }) => await taskExecutionsService.completeTaskExecution(id, payload),
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

