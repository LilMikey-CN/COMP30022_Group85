const { initializeClientProfile } = require('./clientProfile');
const { ensureCategoryOptionsDoc } = require('./categories');

const serializeTimestamp = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return value;
};

const formatUserProfileResponse = (userData) => {
  if (!userData) {
    return null;
  }

  return {
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName,
    emailVerified: userData.emailVerified,
    avatar_url: userData.avatar_url || null,
    mobile_phone: userData.mobile_phone || null,
    contact_address: userData.contact_address || null,
    created_at: serializeTimestamp(userData.created_at),
    updated_at: serializeTimestamp(userData.updated_at),
    client_profile: userData.client_profile || null
  };
};

const prepareUserProfileData = (data) => {
  const { displayName, avatar_url, mobile_phone, contact_address } = data;

  const profileData = {
    updated_at: new Date()
  };

  if (displayName !== undefined) profileData.displayName = displayName;
  if (avatar_url !== undefined) profileData.avatar_url = avatar_url;
  if (mobile_phone !== undefined) profileData.mobile_phone = mobile_phone;
  if (contact_address !== undefined) profileData.contact_address = contact_address;

  return profileData;
};

const initializeUserDocument = (userId, userRecord = null, tokenUser = null) => {
  const now = new Date();

  return {
    uid: userId,
    email: userRecord?.email || tokenUser?.email || null,
    displayName: userRecord?.displayName || tokenUser?.name || 'Test Guardian User',
    emailVerified: userRecord?.emailVerified || false,
    avatar_url: null,
    mobile_phone: null,
    contact_address: null,
    client_profile: initializeClientProfile(),
    created_at: userRecord?.metadata ? new Date(userRecord.metadata.creationTime) : now,
    updated_at: now
  };
};

// Ensure the Firestore user document exists (and includes category defaults) before use.
const ensureUserDocumentInitialized = async (db, auth, uid, tokenUser = null) => {
  const userRef = db.collection('users').doc(uid);
  const snapshot = await userRef.get();

  let userData = snapshot.exists ? snapshot.data() : null;

  if (!userData) {
    let userRecord = null;
    if (auth && typeof auth.getUser === 'function') {
      try {
        userRecord = await auth.getUser(uid);
      } catch (error) {
        // Unable to fetch user record; fall back to token data
      }
    }

    userData = initializeUserDocument(uid, userRecord, tokenUser);
    await userRef.set(userData);
  } else if (!userData.client_profile) {
    await userRef.set(
      {
        client_profile: initializeClientProfile(),
        updated_at: new Date()
      },
      { merge: true }
    );
    const refreshed = await userRef.get();
    userData = refreshed.data();
  }

  await ensureCategoryOptionsDoc(db, uid);

  return { userRef, userData };
};

module.exports = {
  formatUserProfileResponse,
  prepareUserProfileData,
  initializeUserDocument,
  ensureUserDocumentInitialized
};
