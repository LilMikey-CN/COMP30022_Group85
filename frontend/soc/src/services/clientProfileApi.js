/**
 * Client Profile API Service
 * Handles all client profile related API calls
 */

import { auth } from '../firebase/config';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get authenticated user's Firebase JWT token
 */
const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  return await currentUser.getIdToken();
};


/**
 * Make authenticated API call
 */
const authenticatedApiCall = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

/**
 * Client Profile Service
 */
export const clientProfileService = {
  /**
   * Get client profile for authenticated user
   */
  async getClientProfile() {
    return await authenticatedApiCall('/api/users/client-profile');
  },

  /**
   * Create or update client profile (full replacement)
   */
  async createOrUpdateClientProfile(profileData) {
    return await authenticatedApiCall('/api/users/client-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  /**
   * Update specific fields in client profile (partial update)
   */
  async updateClientProfile(updates) {
    return await authenticatedApiCall('/api/users/client-profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Deactivate client profile (soft delete)
   */
  async deactivateClientProfile() {
    return await authenticatedApiCall('/api/users/client-profile', {
      method: 'DELETE',
    });
  },

  /**
   * Reactivate client profile
   */
  async reactivateClientProfile() {
    return await authenticatedApiCall('/api/users/client-profile/reactivate', {
      method: 'PATCH',
    });
  },
};

export default clientProfileService;