import { message } from 'antd';

// Configure global message settings
message.config({
  top: 100, // Distance from top
  duration: 3, // Default duration in seconds
  maxCount: 3, // Maximum number of messages to show at once
  rtl: false,
});

// Custom message utilities with consistent styling
export const showSuccessMessage = (content, duration = 3) => {
  return message.success({
    content,
    duration,
    style: {
      marginTop: '10vh',
      fontSize: '14px'
    },
    className: 'client-profile-message'
  });
};

export const showErrorMessage = (content, duration = 4) => {
  return message.error({
    content,
    duration,
    style: {
      marginTop: '10vh',
      fontSize: '14px'
    },
    className: 'client-profile-message'
  });
};

export const showWarningMessage = (content, duration = 3) => {
  return message.warning({
    content,
    duration,
    style: {
      marginTop: '10vh',
      fontSize: '14px'
    },
    className: 'client-profile-message'
  });
};

export const showInfoMessage = (content, duration = 3) => {
  return message.info({
    content,
    duration,
    style: {
      marginTop: '10vh',
      fontSize: '14px'
    },
    className: 'client-profile-message'
  });
};

export const showLoadingMessage = (content = 'Loading...') => {
  return message.loading({
    content,
    style: {
      marginTop: '10vh',
      fontSize: '14px'
    },
    className: 'client-profile-message'
  });
};

// Predefined message templates for client profile operations
export const CLIENT_PROFILE_MESSAGES = {
  SUCCESS: {
    PERSONAL_DETAILS: 'Personal details updated successfully!',
    CONTACT_DETAILS: 'Contact details updated successfully!',
    EMERGENCY_CONTACTS: 'Emergency contacts updated successfully!',
    EMERGENCY_CONTACT_ADDED: 'Emergency contact added successfully!',
    EMERGENCY_CONTACT_UPDATED: 'Emergency contact updated successfully!',
    EMERGENCY_CONTACT_DELETED: 'Emergency contact deleted successfully!',
    NOTES: 'Notes updated successfully!',
    HEALTH_CARE_INFO: 'Health & care information updated successfully!',
    VITALS: 'Vital signs updated successfully!'
  },
  ERROR: {
    PERSONAL_DETAILS: 'Failed to update personal details. Server error occurred. Please try again.',
    CONTACT_DETAILS: 'Failed to update contact details. Server error occurred. Please try again.',
    EMERGENCY_CONTACTS: 'Failed to update emergency contacts. Server error occurred. Please try again.',
    EMERGENCY_CONTACT_DELETE: 'Failed to delete emergency contact. Server error occurred. Please try again.',
    NOTES: 'Failed to update notes. Server error occurred. Please try again.',
    HEALTH_CARE_INFO: 'Failed to update health & care information. Server error occurred. Please try again.',
    VITALS: 'Failed to update vital signs. Server error occurred. Please try again.',
    NETWORK: 'Network connection error. Please check your internet connection and try again.',
    VALIDATION: 'Please check all required fields before saving.'
  },
  LOADING: {
    SAVING: 'Saving changes...',
    DELETING: 'Deleting...',
    LOADING: 'Loading...'
  }
};