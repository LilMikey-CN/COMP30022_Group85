import React, { useState } from 'react';
import { Typography, Card, Row, Col, Table, Spin, Alert, Button, Empty } from 'antd';
import { useParams } from 'react-router-dom';
import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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

  const emergencyContactsColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Relationship',
      dataIndex: 'relationship',
      key: 'relationship',
    },
    {
      title: 'Mobile number',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
    },
    {
      title: 'Email address',
      dataIndex: 'emailAddress',
      key: 'emailAddress',
    },
  ];

  const InfoCard = ({ title, children, style = {}, onEdit, isLoading = false }) => (
    <Card
      className="client-profile-info-card"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: '16px', fontWeight: '600', color: '#5a7a9a' }}>
            {title}
          </Text>
          <EditOutlined
            className="edit-icon"
            style={{
              color: isLoading ? '#d9d9d9' : '#8c8c8c',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onClick={isLoading ? undefined : onEdit}
          />
        </div>
      }
      style={{
        height: '100%',
        backgroundColor: '#fafbfc',
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        ...style
      }}
      styles={{
        header: {
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid #e1e8ed'
        },
        body: { padding: '20px', backgroundColor: '#fafbfc' }
      }}
    >
      <Spin spinning={isLoading}>
        {children}
      </Spin>
    </Card>
  );

  const InfoField = ({ label, value }) => (
    <div style={{ marginBottom: '16px' }}>
      <Text style={{ color: '#8c8c8c', fontSize: '14px', display: 'block' }}>
        {label}
      </Text>
      <Text style={{ fontSize: '14px', fontWeight: '500' }}>
        {value}
      </Text>
    </div>
  );

  const VitalCard = ({ icon, label, value, unit, color }) => (
    <div style={{ textAlign: 'center', padding: '8px' }}>
      <div style={{ fontSize: '24px', color, marginBottom: '8px' }}>
        {icon}
      </div>
      <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block' }}>
        {label}
      </Text>
      <div>
        <Text strong style={{ fontSize: '16px' }}>
          {value}
        </Text>
        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {unit && ` ${unit}`}
        </Text>
      </div>
    </div>
  );

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
                title="Personal Details"
                onEdit={() => openModal('personalDetails')}
                isLoading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <InfoField label="Full name" value={profileData.personalDetails.fullName || 'Not provided'} />
                <InfoField label="DoB" value={profileData.personalDetails.dateOfBirth || 'Not provided'} />
                <InfoField label="Sex" value={profileData.personalDetails.sex || 'Not provided'} />
                <InfoField label="Age" value={profileData.personalDetails.age || 'Not provided'} />
              </InfoCard>
            </Col>
            <Col xs={24} md={12}>
              <InfoCard
                title="Contact Details"
                onEdit={() => openModal('contactDetails')}
                isLoading={updateClientProfile.isPending || createClientProfile.isPending}
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
                title="Emergency contacts"
                onEdit={() => openModal('emergencyContacts')}
                isLoading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <Table
                  columns={emergencyContactsColumns}
                  dataSource={profileData.emergencyContacts.map((contact, index) => ({
                    ...contact,
                    key: index,
                  }))}
                  pagination={false}
                  size="small"
                  style={{ border: 'none' }}
                  locale={{ emptyText: 'No emergency contacts added' }}
                />
              </InfoCard>
            </Col>
          </Row>

          {/* Third Row - Notes */}
          <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
            <Col xs={24}>
              <InfoCard
                title="Notes"
                onEdit={() => openModal('notes')}
                isLoading={updateClientProfile.isPending || createClientProfile.isPending}
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
                title="Health & Care Information"
                onEdit={() => openModal('healthCareInfo')}
                isLoading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <InfoField label="Medical Conditions" value={profileData.healthCareInformation.medicalConditions || 'Not provided'} />
                <InfoField label="Allergies" value={profileData.healthCareInformation.allergies || 'Not provided'} />
                <InfoField label="Medications" value={profileData.healthCareInformation.medications || 'Not provided'} />
                <InfoField label="Accessibility needs" value={profileData.healthCareInformation.accessibilityNeeds || 'Not provided'} />
              </InfoCard>
            </Col>
            <Col xs={24} md={12}>
              <InfoCard
                title={`Latest vitals${profileData.latestVitals.date ? ' • ' + profileData.latestVitals.date : ''}`}
                onEdit={() => openModal('vitals')}
                isLoading={updateClientProfile.isPending || createClientProfile.isPending}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <VitalCard
                      icon="❤️"
                      label="Heart Rate"
                      value={profileData.latestVitals.heartRate || '-'}
                      unit="bpm"
                      color="#ff4d4f"
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <VitalCard
                      icon="📈"
                      label="Blood Pressure"
                      value={profileData.latestVitals.bloodPressure || '-'}
                      unit="mmHg"
                      color="#1890ff"
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <VitalCard
                      icon="🫁"
                      label="Oxygen Sat"
                      value={profileData.latestVitals.oxygenSaturation || '-'}
                      unit="%"
                      color="#52c41a"
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <VitalCard
                      icon="🌡️"
                      label="Temperature"
                      value={profileData.latestVitals.temperature || '-'}
                      unit="°C"
                      color="#fa8c16"
                    />
                  </Col>
                </Row>
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
