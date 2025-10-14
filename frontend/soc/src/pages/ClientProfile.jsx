import React, { useState } from 'react';
import { Typography, Row, Col, Spin, Alert, Button } from 'antd';
import { useParams } from 'react-router-dom';
import { ReloadOutlined } from '@ant-design/icons';
import { useClientProfile, useUpdateClientProfile, useCreateClientProfile } from '../hooks/useClientProfile';
import { getDefaultClientProfile } from '../utils/clientProfileMapper';
import { handleError, ERROR_TYPES } from '../utils/errorHandler.jsx';
import {
  PersonalDetailsModal,
  ContactDetailsModal,
  EmergencyContactsModal,
  NotesModal,
  HealthCareInfoModal,
  VitalsModal
} from '../components/ClientProfile';
import InfoCard from '../components/ClientProfile/InfoCard';
import InfoField from '../components/ClientProfile/InfoField';
import EmergencyContactsTable from '../components/ClientProfile/EmergencyContactsTable';
import VitalsSummary from '../components/ClientProfile/VitalsSummary';

const { Title, Text } = Typography;

const ClientProfile = () => {
  // eslint-disable-next-line no-unused-vars
  const { patientId } = useParams();

  // API hooks
  const { data: clientData, isLoading, error, refetch } = useClientProfile();
  const updateClientProfile = useUpdateClientProfile();
  const createClientProfile = useCreateClientProfile();

  // Use default data if no profile exists
  const profileData = clientData || getDefaultClientProfile();
  const profileExists = !!clientData;

  // Modal visibility states
  const [modals, setModals] = useState({
    personalDetails: false,
    contactDetails: false,
    emergencyContacts: false,
    notes: false,
    healthCareInfo: false,
    vitals: false
  });

  // Modal handlers
  const openModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };


  // Generic save handler for all sections
  const handleSaveSection = async (section, newData) => {
    try {
      if (!profileExists) {
        // If profile doesn't exist in database, always use CREATE API
        // Create with the new section data, leaving other sections empty/null
        const fullProfileData = {
          ...profileData,
          [section]: newData
        };

        // No validation - allow partial creation with just this section
        await createClientProfile.mutateAsync(fullProfileData);
      } else {
        // Profile exists in database, use UPDATE API for partial update
        await updateClientProfile.mutateAsync({ section, sectionData: newData });
      }

      closeModal(section);
    } catch (error) {
      handleError(error, ERROR_TYPES.MODAL, {
        title: 'Save Failed',
        context: 'Failed to save changes',
        showDetails: true,
      });
    }
  };

  const handleSavePersonalDetails = (newData) => handleSaveSection('personalDetails', newData);
  const handleSaveContactDetails = (newData) => handleSaveSection('contactDetails', newData);
  const handleSaveEmergencyContacts = (newData) => handleSaveSection('emergencyContacts', newData);
  const handleSaveNotes = (newData) => handleSaveSection('notes', newData);
  const handleSaveHealthCareInfo = (newData) => handleSaveSection('healthCareInfo', newData);
  const handleSaveVitals = (newData) => handleSaveSection('vitals', newData);

  // Show loading spinner for initial load
  if (isLoading && !clientData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
        <div style={{ marginLeft: 16, fontSize: '16px', color: '#666' }}>Loading client profile...</div>
      </div>
    );
  }

  // Show error state only for genuine server errors, not "profile not found" cases
  if (error &&
    !error.message.includes('404') &&
    !error.message.includes('User not authenticated') &&
    !error.message.includes('fetch') &&
    !error.message.includes('Profile not found') &&
    !error.message.includes('not found') &&
    !error.message.toLowerCase().includes('404')) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Failed to Load Client Profile"
          description={error.message}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Client Profile
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {!profileExists
            ? 'Create and manage your client profile - Click any edit button to get started'
            : 'Keep track of basic details of person with special needs and medical info'
          }
        </Text>
      </div>

      {/* Profile content - show even for new profiles to allow creation */}
      {(profileExists || !error) && (
        <div>
          {/* First Row - Personal Details and Contact Details */}
          <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
            <Col xs={24} md={12}>
              <InfoCard
                className="client-profile-info-card"
                title="Personal Details"
                onEdit={() => openModal('personalDetails')}
                loading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <InfoField label="Full name" value={profileData.personalDetails.fullName || 'Not provided'} />
                <InfoField label="DoB" value={profileData.personalDetails.dateOfBirth || 'Not provided'} />
                <InfoField label="Sex" value={profileData.personalDetails.sex || 'Not provided'} />
                <InfoField label="Age" value={profileData.personalDetails.age || 'Not provided'} />
              </InfoCard>
            </Col>
            <Col xs={24} md={12}>
              <InfoCard
                className="client-profile-info-card"
                title="Contact Details"
                onEdit={() => openModal('contactDetails')}
                loading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <InfoField label="Mobile number" value={profileData.contactDetails.mobileNumber || 'Not provided'} />
                <InfoField label="Email address" value={profileData.contactDetails.emailAddress || 'Not provided'} />
                <InfoField label="Postal Address" value={profileData.contactDetails.postalAddress || 'Not provided'} />
              </InfoCard>
            </Col>
          </Row>

          {/* Second Row - Emergency Contacts */}
          <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
            <Col xs={24}>
              <InfoCard
                className="client-profile-info-card"
                title="Emergency contacts"
                onEdit={() => openModal('emergencyContacts')}
                loading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <EmergencyContactsTable contacts={profileData.emergencyContacts} />
              </InfoCard>
            </Col>
          </Row>

          {/* Third Row - Notes */}
          <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
            <Col xs={24}>
              <InfoCard
                className="client-profile-info-card"
                title="Notes"
                onEdit={() => openModal('notes')}
                loading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {profileData.notes || 'No notes added'}
                </Text>
              </InfoCard>
            </Col>
          </Row>

          {/* Fourth Row - Health & Care Information and Latest Vitals */}
          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <InfoCard
                className="client-profile-info-card"
                title="Health & Care Information"
                onEdit={() => openModal('healthCareInfo')}
                loading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <InfoField label="Medical Conditions" value={profileData.healthCareInformation.medicalConditions || 'Not provided'} />
                <InfoField label="Allergies" value={profileData.healthCareInformation.allergies || 'Not provided'} />
                <InfoField label="Medications" value={profileData.healthCareInformation.medications || 'Not provided'} />
                <InfoField label="Accessibility needs" value={profileData.healthCareInformation.accessibilityNeeds || 'Not provided'} />
              </InfoCard>
            </Col>
            <Col xs={24} md={12}>
              <InfoCard
                className="client-profile-info-card"
                title={`Latest vitals${profileData.latestVitals.date ? ' • ' + profileData.latestVitals.date : ''}`}
                onEdit={() => openModal('vitals')}
                loading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <VitalsSummary vitals={profileData.latestVitals} />
              </InfoCard>
            </Col>
          </Row>
        </div>
      )}

      {/* Modals */}
      <PersonalDetailsModal
        visible={modals.personalDetails}
        onCancel={() => closeModal('personalDetails')}
        onSave={handleSavePersonalDetails}
        initialData={profileData.personalDetails}
        loading={updateClientProfile.isPending || createClientProfile.isPending}
      />

      <ContactDetailsModal
        visible={modals.contactDetails}
        onCancel={() => closeModal('contactDetails')}
        onSave={handleSaveContactDetails}
        initialData={profileData.contactDetails}
        loading={updateClientProfile.isPending || createClientProfile.isPending}
      />

      <EmergencyContactsModal
        visible={modals.emergencyContacts}
        onCancel={() => closeModal('emergencyContacts')}
        onSave={handleSaveEmergencyContacts}
        initialData={profileData.emergencyContacts}
        loading={updateClientProfile.isPending || createClientProfile.isPending}
      />

      <NotesModal
        visible={modals.notes}
        onCancel={() => closeModal('notes')}
        onSave={handleSaveNotes}
        initialData={profileData.notes}
        loading={updateClientProfile.isPending || createClientProfile.isPending}
      />

      <HealthCareInfoModal
        visible={modals.healthCareInfo}
        onCancel={() => closeModal('healthCareInfo')}
        onSave={handleSaveHealthCareInfo}
        initialData={profileData.healthCareInformation}
        loading={updateClientProfile.isPending || createClientProfile.isPending}
      />

      <VitalsModal
        visible={modals.vitals}
        onCancel={() => closeModal('vitals')}
        onSave={handleSaveVitals}
        initialData={profileData.latestVitals}
        loading={updateClientProfile.isPending || createClientProfile.isPending}
      />
    </div>
  );
};

export default ClientProfile;
