import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { careTasksService } from '../services/careTasksApi';

export const CARE_TASKS_QUERY_KEY = 'careTasks';

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

export const useCareTaskDetails = (taskId, options = {}) => {
  return useQuery({
    queryKey: [CARE_TASKS_QUERY_KEY, 'detail', taskId],
    queryFn: async () => await careTasksService.getCareTask(taskId),
    enabled: !!taskId,
    staleTime: 60 * 1000,
    ...options,
  });
};

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

export const useGenerateTaskExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => await careTasksService.generateTaskExecution(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', id] });
      }
      message.success(response?.message || 'Next execution generated');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to generate execution';
      message.error(reason);
    },
  });
};

export const useCreateManualExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, payload }) => await careTasksService.createManualExecution(taskId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY], exact: false });
      if (variables?.taskId) {
        queryClient.invalidateQueries({ queryKey: [CARE_TASKS_QUERY_KEY, 'detail', variables.taskId] });
      }
      message.success('Task execution created');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to create task execution';
      message.error(reason);
    },
  });
};

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
