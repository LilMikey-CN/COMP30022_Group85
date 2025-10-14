/**
 * Care Tasks API Service
 * Provides authenticated access to care task endpoints
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
    } catch { /* no-op */ }

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

export const careTasksService = {
  async getCareTasks(params = {}) {
    const queryString = buildQueryString(params);
    return await authenticatedApiCall(`/api/care-tasks${queryString}`);
  },

  async getCareTask(id) {
    if (!id) {
      throw new Error('Care task id is required');
    }
    return await authenticatedApiCall(`/api/care-tasks/${id}`);
  },

  async createCareTask(payload = {}) {
    return await authenticatedApiCall('/api/care-tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCareTask(id, payload = {}) {
    if (!id) {
      throw new Error('Care task id is required');
    }
    return await authenticatedApiCall(`/api/care-tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deactivateCareTask(id) {
    if (!id) {
      throw new Error('Care task id is required');
    }
    return await authenticatedApiCall(`/api/care-tasks/${id}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async reactivateCareTask(id) {
    if (!id) {
      throw new Error('Care task id is required');
    }
    return await authenticatedApiCall(`/api/care-tasks/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async generateTaskExecution(id) {
    if (!id) {
      throw new Error('Care task id is required');
    }
    return await authenticatedApiCall(`/api/care-tasks/${id}/generate-executions`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async createManualExecution(id, payload = {}) {
    if (!id) {
      throw new Error('Care task id is required');
    }
    return await authenticatedApiCall(`/api/care-tasks/${id}/executions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getExecutionsForTask(id, params = {}) {
    if (!id) {
      throw new Error('Care task id is required');
    }
    const queryString = buildQueryString(params);
    return await authenticatedApiCall(`/api/care-tasks/${id}/executions${queryString}`);
  },

  async transferBudget(payload = {}) {
    const { fromTaskId, toTaskId, amount } = payload;
    if (!fromTaskId) {
      throw new Error('Source care task id is required');
    }
    if (!toTaskId) {
      throw new Error('Destination care task id is required');
    }
    if (amount === undefined || amount === null) {
      throw new Error('Transfer amount is required');
    }

    return await authenticatedApiCall('/api/care-tasks/transfer-budget', {
      method: 'POST',
      body: JSON.stringify({ fromTaskId, toTaskId, amount })
    });
  },
};

export default careTasksService;
