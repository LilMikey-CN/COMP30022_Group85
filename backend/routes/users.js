const express = require('express');
const { db, auth } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { validateClientProfileData, validateUserProfileData } = require('../utils/validation');
const {
  prepareClientProfileData,
  updateClientProfileData,
  formatClientProfileResponse,
  filterUsersBySearch
} = require('../utils/clientProfile');
const {
  formatUserProfileResponse,
  prepareUserProfileData,
  initializeUserDocument
} = require('../utils/userProfile');

const router = express.Router();

// Debug logging
console.log('Users router created');

// Debug route WITHOUT auth (before middleware)
router.get('/test-no-auth', (req, res) => {
  res.json({ message: 'Users route is working without auth!' });
});

// Apply auth middleware to remaining routes
router.use(verifyToken);

// Debug route WITH auth
router.get('/test', (req, res) => {
  res.json({ message: 'Users route is working with auth!', user: req.user });
});

// USER PROFILE ROUTES

// READ - Get current user's profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User profile not found',
        message: 'No profile has been set up for this user'
      });
    }

    const userData = userDoc.data();
    const response = {
      message: 'User profile retrieved successfully',
      data: formatUserProfileResponse(userData)
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// UPDATE - Update current user's profile
router.patch('/profile', async (req, res) => {
  try {
    const userId = req.user.uid;

    // Validate input data
    const validation = validateUserProfileData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Prepare user profile data for update
    const profileUpdateData = prepareUserProfileData(req.body);

    // Get Firebase Auth user data (if available)
    let userRecord = null;
    try {
      userRecord = await auth.getUser(userId);
    } catch (error) {
      console.log('Could not fetch user record from Firebase Auth, using token data');
    }

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      // Update existing user document
      await userDocRef.update(profileUpdateData);
    } else {
      // Create new user document with profile data
      const userDocData = {
        ...initializeUserDocument(userId, userRecord, req.user),
        ...profileUpdateData
      };
      await userDocRef.set(userDocData);
    }

    // Fetch the updated document to return
    const updatedUserDoc = await userDocRef.get();
    const updatedUserData = updatedUserDoc.data();

    res.json({
      message: 'User profile updated successfully',
      data: formatUserProfileResponse(updatedUserData)
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// CLIENT PROFILE ROUTES

// CREATE/UPDATE - Set client profile for current user's client
router.put('/client-profile', async (req, res) => {
  try {
    const userId = req.user.uid;

    // Validate input data
    const validation = validateClientProfileData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Prepare client profile data
    const clientProfileData = prepareClientProfileData(req.body);

    // Get Firebase Auth user data (if available)
    let userRecord = null;
    try {
      userRecord = await auth.getUser(userId);
    } catch (error) {
      console.log('Could not fetch user record from Firebase Auth, using token data');
    }

    // Prepare user document data
    const userDocData = {
      ...initializeUserDocument(userId, userRecord, req.user),
      client_profile: clientProfileData
    };

    // Check if user document exists
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      // Update existing user document with new client profile
      await userDocRef.update({
        client_profile: clientProfileData,
        updated_at: new Date()
      });
    } else {
      // Create new user document with client profile
      await userDocRef.set(userDocData);
    }

    res.status(200).json({
      message: 'Client profile updated successfully',
      data: {
        user_id: userId,
        client_profile: {
          ...clientProfileData,
          date_of_birth: clientProfileData.date_of_birth.toISOString(),
          created_at: clientProfileData.created_at.toISOString(),
          updated_at: clientProfileData.updated_at.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ error: 'Failed to update client profile' });
  }
});

// READ - Get current user's client profile
router.get('/client-profile', async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists || !userDoc.data().client_profile) {
      return res.status(404).json({
        error: 'Client profile not found',
        message: 'No client profile has been set up for this user'
      });
    }

    const userData = userDoc.data();
    const clientProfile = userData.client_profile;

    const response = {
      user_id: userId,
      client_profile: formatClientProfileResponse(clientProfile)
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching client profile:', error);
    res.status(500).json({ error: 'Failed to fetch client profile' });
  }
});

// UPDATE - Update specific fields in client profile
router.patch('/client-profile', async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();
    if (!userData.client_profile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Validate input data
    const validation = validateClientProfileData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Update client profile data
    const updatedClientProfile = updateClientProfileData(userData.client_profile, req.body);

    await userDocRef.update({
      client_profile: updatedClientProfile,
      updated_at: new Date()
    });

    res.json({
      message: 'Client profile updated successfully',
      data: {
        user_id: userId,
        client_profile: formatClientProfileResponse(updatedClientProfile)
      }
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ error: 'Failed to update client profile' });
  }
});


// SOFT DELETE - Deactivate client profile
router.delete('/client-profile', async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();
    if (!userData.client_profile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const updatedClientProfile = { ...userData.client_profile };
    updatedClientProfile.is_active = false;
    updatedClientProfile.updated_at = new Date();

    await userDocRef.update({
      client_profile: updatedClientProfile,
      updated_at: new Date()
    });

    res.json({
      message: 'Client profile deactivated successfully',
      user_id: userId
    });
  } catch (error) {
    console.error('Error deactivating client profile:', error);
    res.status(500).json({ error: 'Failed to deactivate client profile' });
  }
});

// REACTIVATE - Reactivate a soft-deleted client profile
router.patch('/client-profile/reactivate', async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();
    if (!userData.client_profile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const updatedClientProfile = { ...userData.client_profile };
    updatedClientProfile.is_active = true;
    updatedClientProfile.updated_at = new Date();

    await userDocRef.update({
      client_profile: updatedClientProfile,
      updated_at: new Date()
    });

    res.json({
      message: 'Client profile reactivated successfully',
      user_id: userId
    });
  } catch (error) {
    console.error('Error reactivating client profile:', error);
    res.status(500).json({ error: 'Failed to reactivate client profile' });
  }
});

// ADMIN ROUTES - For accessing all users with client profiles (if needed)

// ADMIN ROUTES - Get all users with client profiles (admin only - you may want to add role-based auth)
router.get('/all-client-profiles', async (req, res) => {
  try {
    const { is_active = 'true', search, limit = 50, offset = 0 } = req.query;

    let query = db.collection('users').where('client_profile', '!=', null);

    // Apply pagination
    query = query.orderBy('client_profile.created_at', 'desc')
                 .limit(parseInt(limit))
                 .offset(parseInt(offset));

    const snapshot = await query.get();
    let users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.client_profile) {
        // Filter by active status
        if (is_active !== 'all' && userData.client_profile.is_active !== (is_active === 'true')) {
          return;
        }

        users.push({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          client_profile: formatClientProfileResponse(userData.client_profile)
        });
      }
    });

    // Client-side search filtering
    if (search) {
      users = filterUsersBySearch(users, search);
    }

    res.json({
      users_with_client_profiles: users,
      count: users.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching users with client profiles:', error);
    res.status(500).json({ error: 'Failed to fetch users with client profiles' });
  }
});

// SEARCH - Advanced search for users with client profiles
router.post('/search-client-profiles', async (req, res) => {
  try {
    const {
      full_name,
      email_address,
      mobile_number,
      age_min,
      age_max,
      sex,
      has_medical_conditions,
      is_active = true,
      limit = 50
    } = req.body;

    let query = db.collection('users').where('client_profile', '!=', null);
    query = query.limit(parseInt(limit));

    const snapshot = await query.get();
    let users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.client_profile) {
        const profile = userData.client_profile;

        // Apply filters
        if (profile.is_active !== is_active) return;
        if (sex && profile.sex !== sex) return;
        if (age_min && profile.age < parseInt(age_min)) return;
        if (age_max && profile.age > parseInt(age_max)) return;

        // Text-based filters
        if (full_name && !profile.full_name.toLowerCase().includes(full_name.toLowerCase())) return;
        if (email_address && !profile.email_address.toLowerCase().includes(email_address.toLowerCase())) return;
        if (mobile_number && !profile.mobile_number.includes(mobile_number)) return;

        if (has_medical_conditions !== undefined) {
          const hasMedical = profile.medical_conditions && profile.medical_conditions.trim() !== '';
          if (has_medical_conditions !== hasMedical) return;
        }

        users.push({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          client_profile: formatClientProfileResponse(profile)
        });
      }
    });

    res.json({
      users_with_client_profiles: users,
      count: users.length,
      search_criteria: req.body
    });
  } catch (error) {
    console.error('Error searching users with client profiles:', error);
    res.status(500).json({ error: 'Failed to search users with client profiles' });
  }
});

module.exports = router;