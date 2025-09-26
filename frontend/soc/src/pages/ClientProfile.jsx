import React, { useState } from 'react';
import { Typography, Card, Row, Col, Table, Divider, Statistic } from 'antd';
import { useParams } from 'react-router-dom';
import { EditOutlined, HeartOutlined } from '@ant-design/icons';
import { clientProfileData } from '../data/mockData';
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

  // In a real app, this would be an API call
  const [clientData, setClientData] = useState(clientProfileData);

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

  const handleSavePersonalDetails = (newData) => {
    setClientData(prev => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, ...newData }
    }));
    closeModal('personalDetails');
  };

  const handleSaveContactDetails = (newData) => {
    setClientData(prev => ({
      ...prev,
      contactDetails: { ...prev.contactDetails, ...newData }
    }));
    closeModal('contactDetails');
  };

  const handleSaveEmergencyContacts = (newData) => {
    setClientData(prev => ({
      ...prev,
      emergencyContacts: newData
    }));
    closeModal('emergencyContacts');
  };

  const handleSaveNotes = (newData) => {
    setClientData(prev => ({
      ...prev,
      notes: newData
    }));
    closeModal('notes');
  };

  const handleSaveHealthCareInfo = (newData) => {
    setClientData(prev => ({
      ...prev,
      healthCareInformation: { ...prev.healthCareInformation, ...newData }
    }));
    closeModal('healthCareInfo');
  };

  const handleSaveVitals = (newData) => {
    setClientData(prev => ({
      ...prev,
      latestVitals: { ...prev.latestVitals, ...newData }
    }));
    closeModal('vitals');
  };

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

  const InfoCard = ({ title, children, style = {}, onEdit }) => (
    <Card
      className="client-profile-info-card"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: '16px', fontWeight: '600', color: '#5a7a9a' }}>
            {title}
          </Text>
          <EditOutlined
            className="client-profile-edit-icon"
            style={{
              color: '#8c8c8c',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onClick={onEdit}
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
      headStyle={{
        backgroundColor: '#fafbfc',
        borderBottom: '1px solid #e1e8ed'
      }}
      bodyStyle={{ padding: '20px', backgroundColor: '#fafbfc' }}
    >
      {children}
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

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Client Profile
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Keep track of basic patient details and medical info
        </Text>
      </div>

      {/* First Row - Personal Details and Contact Details */}
      <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
        <Col xs={24} md={12}>
          <InfoCard
            title="Personal Details"
            onEdit={() => openModal('personalDetails')}
          >
            <InfoField label="Full name" value={clientData.personalDetails.fullName} />
            <InfoField label="DoB" value={clientData.personalDetails.dateOfBirth} />
            <InfoField label="Sex" value={clientData.personalDetails.sex} />
            <InfoField label="Age" value={clientData.personalDetails.age} />
          </InfoCard>
        </Col>
        <Col xs={24} md={12}>
          <InfoCard
            title="Contact Details"
            onEdit={() => openModal('contactDetails')}
          >
            <InfoField label="Mobile number" value={clientData.contactDetails.mobileNumber} />
            <InfoField label="Email address" value={clientData.contactDetails.emailAddress} />
            <InfoField label="Postal Address" value={clientData.contactDetails.postalAddress} />
          </InfoCard>
        </Col>
      </Row>

      {/* Second Row - Emergency Contacts */}
      <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
        <Col xs={24}>
          <InfoCard
            title="Emergency contacts"
            onEdit={() => openModal('emergencyContacts')}
          >
            <Table
              columns={emergencyContactsColumns}
              dataSource={clientData.emergencyContacts.map((contact, index) => ({
                ...contact,
                key: index,
              }))}
              pagination={false}
              size="small"
              style={{ border: 'none' }}
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
          >
            <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {clientData.notes}
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
          >
            <InfoField label="Medical Conditions" value={clientData.healthCareInformation.medicalConditions} />
            <InfoField label="Allergies" value={clientData.healthCareInformation.allergies} />
            <InfoField label="Medications" value={clientData.healthCareInformation.medications} />
            <InfoField label="Accessibility needs" value={clientData.healthCareInformation.accessibilityNeeds} />
          </InfoCard>
        </Col>
        <Col xs={24} md={12}>
          <InfoCard
            title={`Latest vitals • ${clientData.latestVitals.date}`}
            onEdit={() => openModal('vitals')}
          >
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <VitalCard
                  icon="❤️"
                  label="Heart Rate"
                  value={clientData.latestVitals.heartRate}
                  unit="bpm"
                  color="#ff4d4f"
                />
              </Col>
              <Col xs={12} sm={6}>
                <VitalCard
                  icon="📈"
                  label="Blood Pressure"
                  value={clientData.latestVitals.bloodPressure}
                  unit="mmHg"
                  color="#1890ff"
                />
              </Col>
              <Col xs={12} sm={6}>
                <VitalCard
                  icon="🫁"
                  label="Oxygen Sat"
                  value={clientData.latestVitals.oxygenSaturation}
                  unit="%"
                  color="#52c41a"
                />
              </Col>
              <Col xs={12} sm={6}>
                <VitalCard
                  icon="🌡️"
                  label="Temperature"
                  value={clientData.latestVitals.temperature}
                  unit="°C"
                  color="#fa8c16"
                />
              </Col>
            </Row>
          </InfoCard>
        </Col>
      </Row>

      {/* Modals */}
      <PersonalDetailsModal
        visible={modals.personalDetails}
        onCancel={() => closeModal('personalDetails')}
        onSave={handleSavePersonalDetails}
        initialData={clientData.personalDetails}
      />

      <ContactDetailsModal
        visible={modals.contactDetails}
        onCancel={() => closeModal('contactDetails')}
        onSave={handleSaveContactDetails}
        initialData={clientData.contactDetails}
      />

      <EmergencyContactsModal
        visible={modals.emergencyContacts}
        onCancel={() => closeModal('emergencyContacts')}
        onSave={handleSaveEmergencyContacts}
        initialData={clientData.emergencyContacts}
      />

      <NotesModal
        visible={modals.notes}
        onCancel={() => closeModal('notes')}
        onSave={handleSaveNotes}
        initialData={clientData.notes}
      />

      <HealthCareInfoModal
        visible={modals.healthCareInfo}
        onCancel={() => closeModal('healthCareInfo')}
        onSave={handleSaveHealthCareInfo}
        initialData={clientData.healthCareInformation}
      />

      <VitalsModal
        visible={modals.vitals}
        onCancel={() => closeModal('vitals')}
        onSave={handleSaveVitals}
        initialData={clientData.latestVitals}
      />
    </div>
  );
};

export default ClientProfile;