/**
 * QueryClient utilities for cache management
 */

import { QueryClient } from '@tanstack/react-query';

// Create a singleton QueryClient instance that can be accessed from anywhere
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Clear all cached query data
 * Used when user logs out to prevent data leakage between users
 */
export const clearAllQueries = () => {
  queryClient.clear();
};

/**
 * Clear specific query cache
 */
export const clearQuery = (queryKey) => {
  queryClient.removeQueries({ queryKey });
};