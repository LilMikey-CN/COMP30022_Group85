/**
 * Centralized error handling utilities
 */

import React from 'react';
import { message, Modal } from 'antd';

/**
 * Error types for different handling strategies
 */
export const ERROR_TYPES = {
  TOAST: 'toast',
  MODAL: 'modal',
  INLINE: 'inline',
  SILENT: 'silent',
};

/**
 * Handle different types of errors with appropriate UI feedback
 */
export const handleError = (error, type = ERROR_TYPES.TOAST, options = {}) => {
  const {
    title = 'Error',
    context = '',
    onRetry = null,
    showDetails = false,
  } = options;

  const errorMessage = getErrorMessage(error);
  const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

  switch (type) {
    case ERROR_TYPES.TOAST:
      message.error(fullMessage);
      break;

    case ERROR_TYPES.MODAL:
      Modal.error({
        title,
        content: (
          <div>
            <p>{fullMessage}</p>
            {showDetails && error.stack && (
              <details style={{ marginTop: 16 }}>
                <summary>Technical Details</summary>
                <pre style={{
                  fontSize: '12px',
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: '#f5f5f5',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        ),
        okText: 'Close',
        onOk: onRetry || undefined,
      });
      break;

    case ERROR_TYPES.INLINE:
      // Return error message for inline display
      return fullMessage;

    case ERROR_TYPES.SILENT:
      // Only log to console
      console.error('Silent error:', error);
      break;

    default:
      console.warn('Unknown error type:', type);
      message.error(fullMessage);
  }

  // Always log to console for debugging
  console.error(`Error [${type}]:`, error);
};

/**
 * Extract user-friendly error message from various error types
 */
const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Handle common Firebase auth errors
    if (error.message.includes('auth/')) {
      return getFirebaseAuthErrorMessage(error.message);
    }

    // Handle HTTP errors
    if (error.message.includes('HTTP')) {
      return getHttpErrorMessage(error.message);
    }

    // Handle network errors
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }

    return error.message;
  }

  if (error?.code) {
    return `Error code: ${error.code}`;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
const getFirebaseAuthErrorMessage = (errorMessage) => {
  if (errorMessage.includes('auth/user-not-found')) {
    return 'User not found. Please check your credentials.';
  }
  if (errorMessage.includes('auth/wrong-password')) {
    return 'Incorrect password. Please try again.';
  }
  if (errorMessage.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please use a different email or try logging in.';
  }
  if (errorMessage.includes('auth/weak-password')) {
    return 'Password is too weak. Please choose a stronger password.';
  }
  if (errorMessage.includes('auth/invalid-email')) {
    return 'Invalid email format. Please check your email address.';
  }
  if (errorMessage.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (errorMessage.includes('auth/network-request-failed')) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Authentication error. Please try again.';
};

/**
 * Convert HTTP error messages to user-friendly messages
 */
const getHttpErrorMessage = (errorMessage) => {
  if (errorMessage.includes('400')) {
    return 'Invalid request. Please check your input and try again.';
  }
  if (errorMessage.includes('401')) {
    return 'Authentication required. Please log in and try again.';
  }
  if (errorMessage.includes('403')) {
    return 'Access denied. You do not have permission to perform this action.';
  }
  if (errorMessage.includes('404')) {
    return 'Resource not found. The requested data may not exist.';
  }
  if (errorMessage.includes('409')) {
    return 'Conflict. The resource already exists or is in use.';
  }
  if (errorMessage.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (errorMessage.includes('500')) {
    return 'Server error. Please try again later.';
  }
  if (errorMessage.includes('503')) {
    return 'Service temporarily unavailable. Please try again later.';
  }

  return 'Server error. Please try again later.';
};

/**
 * Handle validation errors specifically
 */
export const handleValidationError = (errors, options = {}) => {
  const { showAsModal = false } = options;

  if (Array.isArray(errors)) {
    const errorMessage = errors.join(', ');

    if (showAsModal) {
      Modal.error({
        title: 'Validation Error',
        content: (
          <div>
            <p>Please correct the following errors:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ),
      });
    } else {
      message.error(`Validation error: ${errorMessage}`);
    }

    return errors;
  }

  const singleError = typeof errors === 'string' ? errors : 'Validation failed';

  if (showAsModal) {
    Modal.error({
      title: 'Validation Error',
      content: singleError,
    });
  } else {
    message.error(`Validation error: ${singleError}`);
  }

  return [singleError];
};

/**
 * Show loading with error recovery options
 */
export const showRetryModal = (error, onRetry, onCancel) => {
  Modal.confirm({
    title: 'Error Occurred',
    content: `${getErrorMessage(error)} Would you like to try again?`,
    okText: 'Retry',
    cancelText: 'Cancel',
    onOk: onRetry,
    onCancel: onCancel,
  });
};

/**
 * Helper to wrap async operations with error handling
 */
export const withErrorHandling = async (
  operation,
  errorType = ERROR_TYPES.TOAST,
  errorOptions = {}
) => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, errorType, errorOptions);
    throw error; // Re-throw to allow caller to handle if needed
  }
};