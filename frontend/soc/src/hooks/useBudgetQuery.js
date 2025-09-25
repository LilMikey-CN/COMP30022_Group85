// TanStack Query hooks for Budget Management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBudgetAnalytics,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  queryKeys
} from '../services/budgetApi.js';

// ================================
// QUERY HOOKS
// ================================

export const useBudgetAnalytics = (patientId) => {
  return useQuery({
    queryKey: queryKeys.budget.analytics(patientId),
    queryFn: () => fetchBudgetAnalytics(patientId),
    select: (response) => response.data,
    staleTime: 2 * 60 * 1000, // 2 minutes (budget data changes frequently)
  });
};

export const useCategories = (patientId) => {
  return useQuery({
    queryKey: queryKeys.budget.categories(patientId),
    queryFn: () => fetchCategories(patientId),
    select: (response) => response.data,
  });
};

// ================================
// CATEGORY MUTATION HOOKS
// ================================

export const useCreateCategory = (patientId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onMutate: async (newCategoryData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.budget.categories(patientId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.budget.analytics(patientId) });

      // Snapshot the previous values
      const previousCategories = queryClient.getQueryData(queryKeys.budget.categories(patientId));
      const previousAnalytics = queryClient.getQueryData(queryKeys.budget.analytics(patientId));

      // Optimistically update categories
      if (previousCategories) {
        const optimisticCategory = {
          id: `temp-${Date.now()}`,
          name: newCategoryData.name,
          description: newCategoryData.description,
          color: newCategoryData.color || '#1890ff',
          subcategories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        queryClient.setQueryData(
          queryKeys.budget.categories(patientId),
          [...previousCategories, optimisticCategory]
        );
      }

      return { previousCategories, previousAnalytics, patientId };
    },
    onError: (err, newCategoryData, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.budget.categories(context.patientId), context.previousCategories);
      }
      if (context?.previousAnalytics) {
        queryClient.setQueryData(queryKeys.budget.analytics(context.patientId), context.previousAnalytics);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.analytics(patientId) });
    },
  });
};

export const useUpdateCategory = (patientId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, updateData }) => updateCategory(categoryId, updateData),
    onMutate: async ({ categoryId, updateData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budget.categories(patientId) });

      const previousCategories = queryClient.getQueryData(queryKeys.budget.categories(patientId));

      // Optimistically update
      if (previousCategories) {
        const updatedCategories = previousCategories.map(cat =>
          cat.id === categoryId
            ? { ...cat, ...updateData, updatedAt: new Date().toISOString() }
            : cat
        );
        queryClient.setQueryData(queryKeys.budget.categories(patientId), updatedCategories);
      }

      return { previousCategories, patientId };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.budget.categories(context.patientId), context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.analytics(patientId) });
    },
  });
};

export const useDeleteCategory = (patientId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budget.categories(patientId) });

      const previousCategories = queryClient.getQueryData(queryKeys.budget.categories(patientId));

      // Optimistically remove category
      if (previousCategories) {
        const filteredCategories = previousCategories.filter(cat => cat.id !== categoryId);
        queryClient.setQueryData(queryKeys.budget.categories(patientId), filteredCategories);
      }

      return { previousCategories, patientId };
    },
    onError: (err, categoryId, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.budget.categories(context.patientId), context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.analytics(patientId) });
    },
  });
};

// ================================
// SUBCATEGORY MUTATION HOOKS
// ================================

export const useCreateSubcategory = (patientId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, subcategoryData }) => createSubcategory(categoryId, subcategoryData),
    onMutate: async ({ categoryId, subcategoryData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budget.categories(patientId) });

      const previousCategories = queryClient.getQueryData(queryKeys.budget.categories(patientId));

      // Optimistically add subcategory
      if (previousCategories) {
        const optimisticSubcategory = {
          id: `temp-sub-${Date.now()}`,
          name: subcategoryData.name,
          categoryId: categoryId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const updatedCategories = previousCategories.map(cat =>
          cat.id === categoryId
            ? { ...cat, subcategories: [...(cat.subcategories || []), optimisticSubcategory] }
            : cat
        );

        queryClient.setQueryData(queryKeys.budget.categories(patientId), updatedCategories);
      }

      return { previousCategories, patientId };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.budget.categories(context.patientId), context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.analytics(patientId) });
    },
  });
};

export const useUpdateSubcategory = (patientId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, subcategoryId, updateData }) =>
      updateSubcategory(categoryId, subcategoryId, updateData),
    onMutate: async ({ categoryId, subcategoryId, updateData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budget.categories(patientId) });

      const previousCategories = queryClient.getQueryData(queryKeys.budget.categories(patientId));

      // Optimistically update subcategory
      if (previousCategories) {
        const updatedCategories = previousCategories.map(cat =>
          cat.id === categoryId
            ? {
                ...cat,
                subcategories: cat.subcategories.map(sub =>
                  sub.id === subcategoryId
                    ? { ...sub, ...updateData, updatedAt: new Date().toISOString() }
                    : sub
                )
              }
            : cat
        );

        queryClient.setQueryData(queryKeys.budget.categories(patientId), updatedCategories);
      }

      return { previousCategories, patientId };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.budget.categories(context.patientId), context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.analytics(patientId) });
    },
  });
};

export const useDeleteSubcategory = (patientId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, subcategoryId }) => deleteSubcategory(categoryId, subcategoryId),
    onMutate: async ({ categoryId, subcategoryId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budget.categories(patientId) });

      const previousCategories = queryClient.getQueryData(queryKeys.budget.categories(patientId));

      // Optimistically remove subcategory
      if (previousCategories) {
        const updatedCategories = previousCategories.map(cat =>
          cat.id === categoryId
            ? {
                ...cat,
                subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId)
              }
            : cat
        );

        queryClient.setQueryData(queryKeys.budget.categories(patientId), updatedCategories);
      }

      return { previousCategories, patientId };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.budget.categories(context.patientId), context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.analytics(patientId) });
    },
  });
};