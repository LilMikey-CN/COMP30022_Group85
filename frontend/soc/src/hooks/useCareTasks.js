import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { careTasksService } from '../services/careTasksApi';
import { TASK_EXECUTIONS_QUERY_KEY } from './useTaskExecutions';

export const CARE_TASKS_QUERY_KEY = 'careTasks';

// Fetch the current user's care tasks with optional query params (pagination, filters).
export const useCareTasks = (params = {}) => {
  return useQuery({
    queryKey: [CARE_TASKS_QUERY_KEY, params],
    queryFn: async () => {
      try {
        return await careTasksService.getCareTasks(params);
      } catch (error) {
        if (error.message.includes('User not authenticated')) {
          return { care_tasks: [], count: 0 };
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('User not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Fetch a specific care task document and keep it cached for detail views.
export const useCareTaskDetails = (taskId, options = {}) => {
  return useQuery({
    queryKey: [CARE_TASKS_QUERY_KEY, 'detail', taskId],
    queryFn: async () => await careTasksService.getCareTask(taskId),
    enabled: !!taskId,
    staleTime: 60 * 1000,
    ...options,
  });
};

// Create a new care task and refresh all task lists when the mutation succeeds.
export const useCreateCareTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => await careTasksService.createCareTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      message.success('Care task created successfully');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to create care task';
      message.error(reason);
    },
  });
};

// Patch an existing care task and invalidate both the list and the task detail caches.
export const useUpdateCareTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => await careTasksService.updateCareTask(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', variables.id] });
      }
      message.success('Care task updated successfully');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to update care task';
      message.error(reason);
    },
  });
};

// Mark a care task inactive and refresh the relevant caches.
export const useDeactivateCareTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => await careTasksService.deactivateCareTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', id] });
      }
      message.success('Care task deactivated');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to deactivate care task';
      message.error(reason);
    },
  });
};

// Reactivate a previously deactivated care task and refresh cached views.
export const useReactivateCareTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => await careTasksService.reactivateCareTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', id] });
      }
      message.success('Care task reactivated');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to reactivate care task';
      message.error(reason);
    },
  });
};

// Request the backend to generate the next execution for a task and refresh the task/exec caches.
export const useGenerateTaskExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => await careTasksService.generateTaskExecution(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', id] });
        queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', id], exact: false });
      }
      message.success(response?.message || 'Next execution generated');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to generate execution';
      message.error(reason);
    },
  });
};

// Create a manual task execution entry and refresh the owning task's caches.
export const useCreateManualExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, payload }) => await careTasksService.createManualExecution(taskId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (variables?.taskId) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', variables.taskId] });
        queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', variables.taskId], exact: false });
      }
      message.success('Task execution created');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to create task execution';
      message.error(reason);
    },
  });
};

// Generate all remaining executions for a task and refresh the owning task's caches.
export const useGenerateRemainingExecutions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => await careTasksService.generateRemainingExecutions(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', id] });
        queryClient.invalidateQueries({ queryKey: [TASK_EXECUTIONS_QUERY_KEY, 'task', id], exact: false });
      }
      message.success(response?.message || 'Generated remaining executions');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to generate remaining executions';
      message.error(reason);
    },
  });
};

// Transfer budget between two tasks and refresh the core task list.
export const useTransferCareTaskBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromTaskId, toTaskId, amount }) =>
      await careTasksService.transferBudget({ fromTaskId, toTaskId, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to transfer budget';
      message.error(reason);
    },
  });
};
