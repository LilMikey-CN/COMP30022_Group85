/**
 * API Service Layer
 * This file contains all API calls to the backend
 * Currently returns mock data, but structured for easy migration to real API
 */

import { patientsData } from '../data/mockData';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        // Add authentication token if available
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

// Patient Services
export const patientService = {
  /**
   * Get all patients
   * @returns {Promise<Array>} List of patients
   */
  async getAllPatients() {
    // TODO: Replace with actual API call
    // return await apiCall('/patients');

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: patientsData, success: true });
      }, 500);
    });
  },

  /**
   * Get patient by ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient details
   */
  async getPatientById(patientId) {
    // TODO: Replace with actual API call
    // return await apiCall(`/patients/${patientId}`);

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const patient = patientsData.find(p => p.id === patientId);
        resolve({ data: patient, success: !!patient });
      }, 300);
    });
  },

  /**
   * Create new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} Created patient
   */
  async createPatient(patientData) {
    // TODO: Replace with actual API call
    // return await apiCall('/patients', {
    //   method: 'POST',
    //   body: JSON.stringify(patientData)
    // });

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPatient = {
          ...patientData,
          id: `PT-2025-${Math.floor(Math.random() * 1000)}`
        };
        resolve({ data: newPatient, success: true });
      }, 500);
    });
  },

  /**
   * Update patient
   * @param {string} patientId - Patient ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated patient
   */
  async updatePatient(patientId, updates) {
    // TODO: Replace with actual API call
    // return await apiCall(`/patients/${patientId}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(updates)
    // });

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: { id: patientId, ...updates }, success: true });
      }, 400);
    });
  },

  /**
   * Delete patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Deletion result
   */
  async deletePatient(patientId) {
    // TODO: Replace with actual API call
    // return await apiCall(`/patients/${patientId}`, {
    //   method: 'DELETE'
    // });

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Patient deleted successfully' });
      }, 300);
    });
  }
};

// Schedule Services
export const scheduleService = {
  /**
   * Get schedule for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Schedule data
   */
  async getPatientSchedule(patientId) {
    // TODO: Replace with actual API call
    // return await apiCall(`/schedule/patient/${patientId}`);

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            patientId,
            appointments: [
              {
                id: '1',
                date: '2025-02-15',
                time: '09:00',
                type: 'Consultation',
                doctor: 'Dr. Smith'
              },
              {
                id: '2',
                date: '2025-02-20',
                time: '14:30',
                type: 'Follow-up',
                doctor: 'Dr. Johnson'
              }
            ]
          },
          success: true
        });
      }, 400);
    });
  },

  /**
   * Create appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(appointmentData) {
    // TODO: Replace with actual API call
    // return await apiCall('/schedule/appointments', {
    //   method: 'POST',
    //   body: JSON.stringify(appointmentData)
    // });

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            ...appointmentData,
            id: `APT-${Date.now()}`
          },
          success: true
        });
      }, 500);
    });
  }
};

// Authentication Services
export const authService = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication result
   */
  async login(email, password) {
    // TODO: Replace with actual API call
    // return await apiCall('/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify({ email, password })
    // });

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === 'admin@healthcare.com' && password === 'password') {
          resolve({
            success: true,
            data: {
              token: 'mock-jwt-token',
              user: {
                id: '1',
                name: 'Admin User',
                email: email,
                role: 'admin'
              }
            }
          });
        } else {
          resolve({
            success: false,
            message: 'Invalid credentials'
          });
        }
      }, 1000);
    });
  },

  /**
   * Logout user
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    // TODO: Replace with actual API call
    // return await apiCall('/auth/logout', {
    //   method: 'POST'
    // });

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 200);
    });
  }
};

// Export all services
export default {
  patients: patientService,
  schedule: scheduleService,
  auth: authService
};
