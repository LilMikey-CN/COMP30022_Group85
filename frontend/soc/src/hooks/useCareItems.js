/**
 * TanStack Query hook for Care Items retrieval
 */

import { useQuery } from '@tanstack/react-query';
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
