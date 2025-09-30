/**
 * TanStack Query hooks for User Profile operations
 * Manages the authenticated user's own profile (guardian/family member)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { userProfileService } from '../services/userProfileApi';

// Query keys
export const USER_PROFILE_QUERY_KEY = ['userProfile'];

/**
 * Hook to fetch user profile data
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await userProfileService.getUserProfile();
        return response.data;
      } catch (error) {
        // Handle specific error cases gracefully
        if (error.message.includes('404') ||
            error.message.includes('Profile not found') ||
            error.message.includes('not found') ||
            error.message.toLowerCase().includes('404')) {
          // Profile doesn't exist yet - return null to show empty state
          console.info('User profile not found, returning null to show empty state');
          return null;
        }
        if (error.message.includes('User not authenticated')) {
          // User not logged in - return null and let auth redirect handle it
          console.warn('User not authenticated, returning null profile');
          return null;
        }
        if (error.message.includes('fetch') || error.message.includes('network')) {
          // Network/API server issues - return null to show empty state
          console.warn('API server not available, returning null profile');
          return null;
        }
        // Re-throw other errors to be handled by error boundary
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's a 404, auth error, or network error
      if (error.message.includes('404') ||
          error.message.includes('Profile not found') ||
          error.message.includes('not found') ||
          error.message.includes('User not authenticated') ||
          error.message.includes('fetch') ||
          error.message.includes('network')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to update user profile (partial update)
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const response = await userProfileService.updateUserProfile(updates);
      return response.data;
    },
    onSuccess: (data) => {
      // Update cache with new data
      queryClient.setQueryData(USER_PROFILE_QUERY_KEY, data);
      message.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update user profile:', error);
      message.error(`Failed to update profile: ${error.message}`);
    },
  });
};

/**
 * Hook for prefetching user profile (useful for navigation preloading)
 */
export const usePrefetchUserProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: USER_PROFILE_QUERY_KEY,
      queryFn: async () => {
        const response = await userProfileService.getUserProfile();
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Hook to check if user profile exists
 */
export const useUserProfileExists = () => {
  const { data, isLoading, error } = useUserProfile();

  return {
    exists: !!data && !error,
    isLoading,
    error,
  };
};