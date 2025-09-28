/**
 * Client Profile Data Mapping Layer
 * Transforms data between UI format and API format
 */

import dayjs from 'dayjs';

/**
 * Transform API response to UI format
 */
export const mapApiToUi = (apiData) => {
  if (!apiData?.client_profile) {
    return null;
  }

  const profile = apiData.client_profile;

  return {
    personalDetails: {
      fullName: profile.full_name || '',
      dateOfBirth: profile.date_of_birth ? dayjs(profile.date_of_birth).format('DD/MM/YYYY') : '',
      sex: profile.sex || '',
      age: profile.age || 0,
    },
    contactDetails: {
      mobileNumber: profile.mobile_number || '',
      emailAddress: profile.email_address || '',
      postalAddress: profile.postal_address || '',
    },
    emergencyContacts: (profile.emergency_contacts || []).map(contact => ({
      name: contact.name || '',
      relationship: contact.relationship || '',
      mobileNumber: contact.phone || '',
      emailAddress: contact.email || '',
    })),
    notes: profile.notes || '',
    healthCareInformation: {
      medicalConditions: profile.medical_conditions || '',
      allergies: profile.allergies || '',
      medications: profile.medications || '',
      accessibilityNeeds: profile.accessibility_needs || '',
    },
    latestVitals: profile.latest_vitals ? {
      date: profile.latest_vitals.recorded_date ?
        dayjs(profile.latest_vitals.recorded_date).format('DD/MM/YYYY') : '',
      heartRate: profile.latest_vitals.heart_rate || 0,
      bloodPressure: profile.latest_vitals.blood_pressure || '',
      oxygenSaturation: profile.latest_vitals.oxygen_saturation || 0,
      temperature: profile.latest_vitals.temperature || 0,
    } : {
      date: '',
      heartRate: 0,
      bloodPressure: '',
      oxygenSaturation: 0,
      temperature: 0,
    },
    metadata: {
      uid: apiData.uid,
      email: apiData.email,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
  };
};

/**
 * Transform UI format to API format for full update (PUT)
 */
export const mapUiToApiForCreate = (uiData) => {
  const apiData = {
    full_name: uiData.personalDetails?.fullName || '',
    date_of_birth: uiData.personalDetails?.dateOfBirth ?
      dayjs(uiData.personalDetails.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD') : '',
    sex: uiData.personalDetails?.sex || '',
    mobile_number: uiData.contactDetails?.mobileNumber || '',
    email_address: uiData.contactDetails?.emailAddress || '',
  };

  // Add optional fields if they exist
  if (uiData.personalDetails?.age) {
    apiData.age = uiData.personalDetails.age;
  }

  if (uiData.contactDetails?.postalAddress) {
    apiData.postal_address = uiData.contactDetails.postalAddress;
  }

  if (uiData.emergencyContacts?.length > 0) {
    apiData.emergency_contacts = uiData.emergencyContacts.map(contact => ({
      name: contact.name || '',
      relationship: contact.relationship || '',
      phone: contact.mobileNumber || '',
      email: contact.emailAddress || '',
    }));
  }

  if (uiData.notes) {
    apiData.notes = uiData.notes;
  }

  if (uiData.healthCareInformation?.medicalConditions) {
    apiData.medical_conditions = uiData.healthCareInformation.medicalConditions;
  }

  if (uiData.healthCareInformation?.allergies) {
    apiData.allergies = uiData.healthCareInformation.allergies;
  }

  if (uiData.healthCareInformation?.medications) {
    apiData.medications = uiData.healthCareInformation.medications;
  }

  if (uiData.healthCareInformation?.accessibilityNeeds) {
    apiData.accessibility_needs = uiData.healthCareInformation.accessibilityNeeds;
  }

  if (uiData.latestVitals && (
    uiData.latestVitals.heartRate ||
    uiData.latestVitals.bloodPressure ||
    uiData.latestVitals.oxygenSaturation ||
    uiData.latestVitals.temperature
  )) {
    apiData.latest_vitals = {
      recorded_date: uiData.latestVitals.date ?
        dayjs(uiData.latestVitals.date, 'DD/MM/YYYY').toISOString() :
        new Date().toISOString(),
    };

    if (uiData.latestVitals.heartRate) {
      apiData.latest_vitals.heart_rate = uiData.latestVitals.heartRate;
    }
    if (uiData.latestVitals.bloodPressure) {
      apiData.latest_vitals.blood_pressure = uiData.latestVitals.bloodPressure;
    }
    if (uiData.latestVitals.oxygenSaturation) {
      apiData.latest_vitals.oxygen_saturation = uiData.latestVitals.oxygenSaturation;
    }
    if (uiData.latestVitals.temperature) {
      apiData.latest_vitals.temperature = uiData.latestVitals.temperature;
    }
  }

  return apiData;
};

/**
 * Transform partial UI data to API format for updates (PATCH)
 */
export const mapPartialUiToApi = (section, sectionData) => {
  switch (section) {
    case 'personalDetails':
      return {
        full_name: sectionData.fullName,
        date_of_birth: sectionData.dateOfBirth ?
          dayjs(sectionData.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD') : undefined,
        sex: sectionData.sex,
        age: sectionData.age,
      };

    case 'contactDetails':
      return {
        mobile_number: sectionData.mobileNumber,
        email_address: sectionData.emailAddress,
        postal_address: sectionData.postalAddress,
      };

    case 'emergencyContacts':
      return {
        emergency_contacts: sectionData.map(contact => ({
          name: contact.name || '',
          relationship: contact.relationship || '',
          phone: contact.mobileNumber || '',
          email: contact.emailAddress || '',
        })),
      };

    case 'notes':
      return {
        notes: sectionData,
      };

    case 'healthCareInfo':
      return {
        medical_conditions: sectionData.medicalConditions,
        allergies: sectionData.allergies,
        medications: sectionData.medications,
        accessibility_needs: sectionData.accessibilityNeeds,
      };

    case 'vitals':
      return {
        latest_vitals: {
          heart_rate: sectionData.heartRate,
          blood_pressure: sectionData.bloodPressure,
          oxygen_saturation: sectionData.oxygenSaturation,
          temperature: sectionData.temperature,
          recorded_date: sectionData.date ?
            dayjs(sectionData.date, 'DD/MM/YYYY').toISOString() :
            new Date().toISOString(),
        },
      };

    default:
      throw new Error(`Unknown section: ${section}`);
  }
};

/**
 * Get default/empty client profile data in UI format
 */
export const getDefaultClientProfile = () => ({
  personalDetails: {
    fullName: '',
    dateOfBirth: '',
    sex: '',
    age: 0,
  },
  contactDetails: {
    mobileNumber: '',
    emailAddress: '',
    postalAddress: '',
  },
  emergencyContacts: [],
  notes: '',
  healthCareInformation: {
    medicalConditions: '',
    allergies: '',
    medications: '',
    accessibilityNeeds: '',
  },
  latestVitals: {
    date: '',
    heartRate: 0,
    bloodPressure: '',
    oxygenSaturation: 0,
    temperature: 0,
  },
});

/**
 * Validate required fields for API submission
 */
export const validateRequiredFields = (uiData) => {
  const errors = [];

  if (!uiData.personalDetails?.fullName) {
    errors.push('Full name is required');
  }

  if (!uiData.personalDetails?.dateOfBirth) {
    errors.push('Date of birth is required');
  }

  if (!uiData.personalDetails?.sex) {
    errors.push('Sex is required');
  }

  if (!uiData.contactDetails?.mobileNumber) {
    errors.push('Mobile number is required');
  }

  if (!uiData.contactDetails?.emailAddress) {
    errors.push('Email address is required');
  }

  return errors;
};