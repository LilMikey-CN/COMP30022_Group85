/**
 * TanStack Query hook for Care Items retrieval
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { careItemsService } from '../services/careItemsApi';

export const CARE_ITEMS_QUERY_KEY = 'careItems';

export const useCareItems = (params = {}) => {
  return useQuery({
    queryKey: [CARE_ITEMS_QUERY_KEY, params],
    queryFn: async () => {
      try {
        return await careItemsService.getCareItems(params);
      } catch (error) {
        if (error.message.includes('User not authenticated')) {
          return { care_items: [], count: 0 };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('User not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useCreateCareItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return await careItemsService.createCareItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_QUERY_KEY], exact: false });
      message.success('Care item added successfully');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to add care item';
      message.error(`Failed to add care item: ${reason}`);
    },
  });
};

export const useUpdateCareItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await careItemsService.updateCareItem(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_QUERY_KEY], exact: false });
      message.success('Care item updated successfully');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to update care item';
      message.error(`Failed to update care item: ${reason}`);
    },
  });
};
