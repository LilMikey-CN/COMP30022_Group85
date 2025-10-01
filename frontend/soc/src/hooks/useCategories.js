/**
 * TanStack Query hook for Categories retrieval
 */

import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '../services/categoriesApi';

export const CATEGORIES_QUERY_KEY = 'categories';

export const useCategories = (params = {}) => {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, params],
    queryFn: async () => {
      try {
        return await categoriesService.getCategories(params);
      } catch (error) {
        if (error.message.includes('User not authenticated')) {
          return { categories: [] };
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
