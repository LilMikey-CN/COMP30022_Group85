/**
 * User Profile API Service
 * Handles all user profile related API calls (guardian/family member profile)
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
 * User Profile Service
 */
export const userProfileService = {
  /**
   * Get user profile for authenticated user
   */
  async getUserProfile() {
    return await authenticatedApiCall('/api/users/profile');
  },

  /**
   * Update user profile (partial update)
   */
  async updateUserProfile(updates) {
    return await authenticatedApiCall('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};

export default userProfileService;