/**
 * TanStack Query hooks for Client Profile operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { clientProfileService } from '../services/clientProfileApi';
import { mapApiToUi, mapPartialUiToApi, mapUiToApiForCreate } from '../utils/clientProfileMapper';

// Query keys
export const CLIENT_PROFILE_QUERY_KEY = ['clientProfile'];

/**
 * Hook to fetch client profile data
 */
export const useClientProfile = () => {
  return useQuery({
    queryKey: CLIENT_PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        const apiData = await clientProfileService.getClientProfile();
        return mapApiToUi(apiData);
      } catch (error) {
        // Handle specific error cases gracefully
        if (error.message.includes('404') ||
            error.message.includes('Profile not found') ||
            error.message.includes('not found') ||
            error.message.toLowerCase().includes('404')) {
          // Profile doesn't exist yet - return null to show empty state
          console.info('Client profile not found, returning null to show empty state');
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
 * Hook to create or update client profile (full replacement)
 */
export const useCreateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uiData) => {
      const apiData = mapUiToApiForCreate(uiData);
      const response = await clientProfileService.createOrUpdateClientProfile(apiData);
      return mapApiToUi(response);
    },
    onSuccess: (data) => {
      // Set the data directly since this is a complete profile creation
      queryClient.setQueryData(CLIENT_PROFILE_QUERY_KEY, data);
      message.success('Client profile saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save client profile:', error);
      message.error(`Failed to save client profile: ${error.message}`);
    },
  });
};

/**
 * Hook to update specific sections of client profile (partial update)
 */
export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ section, sectionData }) => {
      const apiData = mapPartialUiToApi(section, sectionData);
      const response = await clientProfileService.updateClientProfile(apiData);
      return mapApiToUi(response);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch to ensure we have the latest complete data
      queryClient.invalidateQueries({ queryKey: CLIENT_PROFILE_QUERY_KEY });
      message.success(`${getSectionDisplayName(variables.section)} updated successfully`);
    },
    onError: (error, variables) => {
      console.error(`Failed to update ${variables.section}:`, error);
      message.error(`Failed to update ${getSectionDisplayName(variables.section)}: ${error.message}`);
    },
  });
};

/**
 * Hook to deactivate client profile
 */
export const useDeactivateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientProfileService.deactivateClientProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_PROFILE_QUERY_KEY });
      message.success('Client profile deactivated successfully');
    },
    onError: (error) => {
      console.error('Failed to deactivate client profile:', error);
      message.error(`Failed to deactivate client profile: ${error.message}`);
    },
  });
};

/**
 * Hook to reactivate client profile
 */
export const useReactivateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientProfileService.reactivateClientProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_PROFILE_QUERY_KEY });
      message.success('Client profile reactivated successfully');
    },
    onError: (error) => {
      console.error('Failed to reactivate client profile:', error);
      message.error(`Failed to reactivate client profile: ${error.message}`);
    },
  });
};

/**
 * Helper function to get display name for sections
 */
const getSectionDisplayName = (section) => {
  const sectionNames = {
    personalDetails: 'Personal Details',
    contactDetails: 'Contact Details',
    emergencyContacts: 'Emergency Contacts',
    notes: 'Notes',
    healthCareInfo: 'Health & Care Information',
    vitals: 'Vitals',
  };
  return sectionNames[section] || section;
};

/**
 * Hook for prefetching client profile (useful for navigation preloading)
 */
export const usePrefetchClientProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: CLIENT_PROFILE_QUERY_KEY,
      queryFn: async () => {
        const apiData = await clientProfileService.getClientProfile();
        return mapApiToUi(apiData);
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Hook to check if client profile exists
 */
export const useClientProfileExists = () => {
  const { data, isLoading, error } = useClientProfile();

  return {
    exists: !!data && !error,
    isLoading,
    error,
  };
};