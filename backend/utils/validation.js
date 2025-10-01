/**
 * Validation Utility Functions
 * Contains input validation logic for client profiles
 */

/**
 * Valid sex options
 */
const VALID_SEX_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

/**
 * Validate sex field value
 * @param {string} sex - Sex value to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateSex(sex) {
  return VALID_SEX_OPTIONS.includes(sex);
}

/**
 * Validate emergency contacts format
 * @param {*} emergencyContacts - Emergency contacts to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateEmergencyContacts(emergencyContacts) {
  if (emergencyContacts === undefined || emergencyContacts === null) {
    return { isValid: true };
  }

  if (!Array.isArray(emergencyContacts)) {
    return {
      isValid: false,
      error: 'emergency_contacts must be an array of objects'
    };
  }

  return { isValid: true };
}

/**
 * Validate latest vitals format
 * @param {*} latestVitals - Latest vitals to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateLatestVitals(latestVitals) {
  if (latestVitals === undefined || latestVitals === null) {
    return { isValid: true };
  }

  if (typeof latestVitals !== 'object' || Array.isArray(latestVitals)) {
    return {
      isValid: false,
      error: 'latest_vitals must be an object'
    };
  }

  return { isValid: true };
}

/**
 * Validate vitals data for update
 * @param {Object} vitalsData - Vitals data to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateVitalsData(vitalsData) {
  const { heart_rate, blood_pressure, oxygen_saturation, temperature } = vitalsData;

  // Check if at least one vital sign is provided (including zero values)
  const hasVitalSign =
    heart_rate !== undefined && heart_rate !== null ||
    blood_pressure !== undefined && blood_pressure !== null ||
    oxygen_saturation !== undefined && oxygen_saturation !== null ||
    temperature !== undefined && temperature !== null;

  if (!hasVitalSign) {
    return {
      isValid: false,
      error: 'At least one vital sign must be provided'
    };
  }

  return { isValid: true };
}

/**
 * Validate client profile data
 * @param {Object} data - Client profile data to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateClientProfileData(data) {
  const { sex, emergency_contacts, latest_vitals } = data;

  // Validate sex field if provided
  if (sex && !validateSex(sex)) {
    return {
      isValid: false,
      error: 'sex must be one of: Male, Female, Other, Prefer not to say'
    };
  }

  // Validate emergency contacts format if provided
  const emergencyContactsResult = validateEmergencyContacts(emergency_contacts);
  if (!emergencyContactsResult.isValid) {
    return emergencyContactsResult;
  }

  // Validate latest vitals format if provided
  const latestVitalsResult = validateLatestVitals(latest_vitals);
  if (!latestVitalsResult.isValid) {
    return latestVitalsResult;
  }

  return { isValid: true };
}

/**
 * Validate date format
 * @param {string} dateString - Date string to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateDateOfBirth(dateString) {
  if (!dateString) {
    return { isValid: true };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format for date_of_birth'
    };
  }

  // Check if date is in the future
  if (date > new Date()) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future'
    };
  }

  // Check if date is too far in the past (more than 150 years)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (date < minDate) {
    return {
      isValid: false,
      error: 'Date of birth cannot be more than 150 years ago'
    };
  }

  return { isValid: true };
}

/**
 * Validate user profile data
 * @param {Object} data - User profile data to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateUserProfileData(data) {
  const { displayName, avatar_url, mobile_phone, contact_address } = data;

  // Validate displayName if provided
  if (displayName !== undefined && displayName !== null) {
    if (typeof displayName !== 'string' || displayName.trim() === '') {
      return {
        isValid: false,
        error: 'displayName must be a non-empty string'
      };
    }
  }

  // Validate avatar_url if provided
  if (avatar_url !== undefined && avatar_url !== null) {
    if (typeof avatar_url !== 'string' || avatar_url.trim() === '') {
      return {
        isValid: false,
        error: 'avatar_url must be a non-empty string'
      };
    }
  }

  // Validate mobile_phone if provided
  if (mobile_phone !== undefined && mobile_phone !== null) {
    if (typeof mobile_phone !== 'string') {
      return {
        isValid: false,
        error: 'mobile_phone must be a string'
      };
    }
  }

  // Validate contact_address if provided
  if (contact_address !== undefined && contact_address !== null) {
    if (typeof contact_address !== 'string') {
      return {
        isValid: false,
        error: 'contact_address must be a string'
      };
    }
  }

  return { isValid: true };
}

module.exports = {
  VALID_SEX_OPTIONS,
  validateSex,
  validateEmergencyContacts,
  validateLatestVitals,
  validateVitalsData,
  validateClientProfileData,
  validateDateOfBirth,
  validateUserProfileData
};