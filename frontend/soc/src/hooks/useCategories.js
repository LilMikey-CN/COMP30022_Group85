/**
 * TanStack Query hook for Categories retrieval
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
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

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return await categoriesService.createCategory(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY], exact: false });
      message.success('Category created successfully');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to create category';
      message.error(`Failed to create category: ${reason}`);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await categoriesService.updateCategory(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY], exact: false });
      message.success('Category updated successfully');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to update category';
      message.error(`Failed to update category: ${reason}`);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => await categoriesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY], exact: false });
      message.success('Category deleted successfully');
    },
    onError: (error) => {
      const reason = error?.message || 'Failed to delete category';
      message.error(`Failed to delete category: ${reason}`);
    },
  });
};
