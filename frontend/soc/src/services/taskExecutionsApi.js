/**
 * Task Executions API Service
 * Encapsulates authenticated access to task execution endpoints
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
    } catch { /* ignore */ }

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

export const taskExecutionsService = {
  async getTaskExecutions(params = {}) {
    const queryString = buildQueryString(params);
    return await authenticatedApiCall(`/api/task-executions${queryString}`);
  },

  async getTaskExecution(id) {
    if (!id) {
      throw new Error('Task execution id is required');
    }
    return await authenticatedApiCall(`/api/task-executions/${id}`);
  },

  async updateTaskExecution(id, payload = {}) {
    if (!id) {
      throw new Error('Task execution id is required');
    }
    return await authenticatedApiCall(`/api/task-executions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async completeTaskExecution(id, payload = {}) {
    if (!id) {
      throw new Error('Task execution id is required');
    }
    return await authenticatedApiCall(`/api/task-executions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async coverExecutions(executionId, executionIds = []) {
    if (!executionId) {
      throw new Error('Covering execution id is required');
    }
    return await authenticatedApiCall(`/api/task-executions/${executionId}/cover-executions`, {
      method: 'PATCH',
      body: JSON.stringify({ execution_ids: executionIds }),
    });
  },

  async getCoveredExecutions(executionId) {
    if (!executionId) {
      throw new Error('Task execution id is required');
    }
    return await authenticatedApiCall(`/api/task-executions/${executionId}/covered-executions`);
  },
};

export default taskExecutionsService;
