/**
 * Client Profile Utility Functions
 * Contains business logic for client profile operations
 */

/**
 * Calculate age from date of birth
 * @param {string|Date|Object} dateOfBirth - Date of birth (string, Date object, or Firebase Timestamp)
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  let birthDate;

  // Handle Firebase Timestamp objects
  if (dateOfBirth && typeof dateOfBirth.toDate === 'function') {
    birthDate = dateOfBirth.toDate();
  } else {
    birthDate = new Date(dateOfBirth);
  }

  const today = new Date();

  if (isNaN(birthDate.getTime())) {
    throw new Error('Invalid date of birth');
  }

  const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  return age;
}

/**
 * Format client profile response with proper date handling
 * @param {Object} clientProfile - Raw client profile data
 * @returns {Object} Formatted client profile
 */
function formatClientProfileResponse(clientProfile) {
  if (!clientProfile) return null;

  return {
    ...clientProfile,
    date_of_birth: clientProfile.date_of_birth?.toDate ?
      clientProfile.date_of_birth.toDate() :
      clientProfile.date_of_birth,
    created_at: clientProfile.created_at?.toDate ?
      clientProfile.created_at.toDate() :
      clientProfile.created_at,
    updated_at: clientProfile.updated_at?.toDate ?
      clientProfile.updated_at.toDate() :
      clientProfile.updated_at
  };
}

/**
 * Prepare client profile data for database storage
 * @param {Object} data - Input client profile data
 * @returns {Object} Processed client profile data
 */
function prepareClientProfileData(data) {
  const {
    full_name,
    date_of_birth,
    sex,
    age,
    mobile_number,
    email_address,
    postal_address,
    emergency_contacts,
    notes,
    medical_conditions,
    allergies,
    medications,
    accessibility_needs,
    latest_vitals
  } = data;

  // Calculate age if date_of_birth is provided and age is not
  let calculatedAge = age;
  if (date_of_birth && !age) {
    calculatedAge = calculateAge(date_of_birth);
  }

  const clientProfileData = {
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  // Only include fields that are provided
  if (full_name !== undefined) clientProfileData.full_name = full_name;
  if (date_of_birth !== undefined) clientProfileData.date_of_birth = new Date(date_of_birth);
  if (sex !== undefined) clientProfileData.sex = sex;
  if (calculatedAge !== undefined) clientProfileData.age = calculatedAge;
  if (mobile_number !== undefined) clientProfileData.mobile_number = mobile_number;
  if (email_address !== undefined) clientProfileData.email_address = email_address;
  if (postal_address !== undefined) clientProfileData.postal_address = postal_address;
  if (emergency_contacts !== undefined) clientProfileData.emergency_contacts = emergency_contacts;
  if (notes !== undefined) clientProfileData.notes = notes;
  if (medical_conditions !== undefined) clientProfileData.medical_conditions = medical_conditions;
  if (allergies !== undefined) clientProfileData.allergies = allergies;
  if (medications !== undefined) clientProfileData.medications = medications;
  if (accessibility_needs !== undefined) clientProfileData.accessibility_needs = accessibility_needs;
  if (latest_vitals !== undefined) clientProfileData.latest_vitals = latest_vitals;

  return clientProfileData;
}

/**
 * Update existing client profile with new data
 * @param {Object} existingProfile - Current client profile data
 * @param {Object} updateData - New data to merge
 * @returns {Object} Updated client profile data
 */
function updateClientProfileData(existingProfile, updateData) {
  const {
    full_name,
    date_of_birth,
    sex,
    age,
    mobile_number,
    email_address,
    postal_address,
    emergency_contacts,
    notes,
    medical_conditions,
    allergies,
    medications,
    accessibility_needs,
    latest_vitals
  } = updateData;

  const updatedProfile = { ...existingProfile };
  updatedProfile.updated_at = new Date();

  // Only update provided fields
  if (full_name !== undefined) updatedProfile.full_name = full_name;
  if (date_of_birth !== undefined) {
    updatedProfile.date_of_birth = new Date(date_of_birth);
    // Recalculate age if date_of_birth is updated
    updatedProfile.age = calculateAge(date_of_birth);
  }
  if (sex !== undefined) updatedProfile.sex = sex;
  if (age !== undefined) updatedProfile.age = parseInt(age);
  if (mobile_number !== undefined) updatedProfile.mobile_number = mobile_number;
  if (email_address !== undefined) updatedProfile.email_address = email_address;
  if (postal_address !== undefined) updatedProfile.postal_address = postal_address;
  if (emergency_contacts !== undefined) updatedProfile.emergency_contacts = emergency_contacts;
  if (notes !== undefined) updatedProfile.notes = notes;
  if (medical_conditions !== undefined) updatedProfile.medical_conditions = medical_conditions;
  if (allergies !== undefined) updatedProfile.allergies = allergies;
  if (medications !== undefined) updatedProfile.medications = medications;
  if (accessibility_needs !== undefined) updatedProfile.accessibility_needs = accessibility_needs;
  if (latest_vitals !== undefined) updatedProfile.latest_vitals = latest_vitals;

  return updatedProfile;
}

/**
 * Initialize empty client profile with default values
 * @returns {Object} Initial client profile data
 */
function initializeClientProfile() {
  return {
    full_name: null,
    date_of_birth: null,
    sex: null,
    age: null,
    mobile_number: null,
    email_address: null,
    postal_address: null,
    emergency_contacts: null,
    notes: null,
    medical_conditions: null,
    allergies: null,
    medications: null,
    accessibility_needs: null,
    latest_vitals: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
}

/**
 * Filter users by search criteria
 * @param {Array} users - Array of users with client profiles
 * @param {string} searchTerm - Search term to filter by
 * @returns {Array} Filtered users
 */
function filterUsersBySearch(users, searchTerm) {
  if (!searchTerm) return users;

  const searchLower = searchTerm.toLowerCase();
  return users.filter(user => {
    const profile = user.client_profile;
    if (!profile) return false;

    return (
      (profile.full_name && profile.full_name.toLowerCase().includes(searchLower)) ||
      (profile.email_address && profile.email_address.toLowerCase().includes(searchLower)) ||
      (profile.mobile_number && profile.mobile_number.includes(searchTerm))
    );
  });
}

module.exports = {
  calculateAge,
  formatClientProfileResponse,
  prepareClientProfileData,
  updateClientProfileData,
  initializeClientProfile,
  filterUsersBySearch
};