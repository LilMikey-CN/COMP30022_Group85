/**
 * User Profile Utility Functions
 * Contains business logic for user profile operations
 */

/**
 * Format user profile response
 * @param {Object} userData - Raw user data from Firestore
 * @returns {Object} Formatted user profile
 */
function formatUserProfileResponse(userData) {
  if (!userData) return null;

  return {
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName,
    emailVerified: userData.emailVerified,
    avatar_url: userData.avatar_url || null,
    mobile_phone: userData.mobile_phone || null,
    contact_address: userData.contact_address || null,
    created_at: userData.created_at?.toDate ? userData.created_at.toDate() : userData.created_at,
    updated_at: userData.updated_at?.toDate ? userData.updated_at.toDate() : userData.updated_at
  };
}

/**
 * Prepare user profile data for update
 * @param {Object} data - Input user profile data
 * @returns {Object} Processed user profile data
 */
function prepareUserProfileData(data) {
  const { displayName, avatar_url, mobile_phone, contact_address } = data;

  const profileData = {
    updated_at: new Date()
  };

  // Only include fields that are provided
  if (displayName !== undefined) profileData.displayName = displayName;
  if (avatar_url !== undefined) profileData.avatar_url = avatar_url;
  if (mobile_phone !== undefined) profileData.mobile_phone = mobile_phone;
  if (contact_address !== undefined) profileData.contact_address = contact_address;

  return profileData;
}

/**
 * Initialize user document with data from Firebase Auth
 * @param {string} userId - User ID
 * @param {Object} userRecord - Firebase Auth user record (optional)
 * @param {Object} tokenUser - User data from JWT token (optional)
 * @returns {Object} Initial user document data
 */
function initializeUserDocument(userId, userRecord = null, tokenUser = null) {
  return {
    uid: userId,
    email: userRecord?.email || tokenUser?.email || null,
    displayName: userRecord?.displayName || tokenUser?.name || 'Test Guardian User',
    emailVerified: userRecord?.emailVerified || false,
    created_at: userRecord?.metadata ? new Date(userRecord.metadata.creationTime) : new Date(),
    updated_at: new Date()
  };
}

module.exports = {
  formatUserProfileResponse,
  prepareUserProfileData,
  initializeUserDocument
};