/**
 * Care Items API Service
 * Handles fetching and managing care items from the backend API
 */

import { auth } from '../firebase/config';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  return await currentUser.getIdToken();
};

const authenticatedApiCall = async (endpoint, options = {}) => {
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
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        errorMessage = errorBody.error;
      }
    } catch { /* noop */ }

    throw new Error(errorMessage);
  }

  return await response.json();
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export const careItemsService = {
  async getCareItems(params = {}) {
    const queryString = buildQueryString(params);
    return await authenticatedApiCall(`/api/care-items${queryString}`);
  },
  async createCareItem(payload = {}) {
    return await authenticatedApiCall('/api/care-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateCareItem(id, payload = {}) {
    return await authenticatedApiCall(`/api/care-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

export default careItemsService;
