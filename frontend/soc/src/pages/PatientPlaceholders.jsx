import React from 'react';
import { Typography, Empty } from 'antd';
import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

// Placeholder component for pages under development
const PlaceholderPage = ({ title, description }) => {
  const { patientId } = useParams();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          {title}
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {description}
        </Text>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px dashed #d9d9d9'
      }}>
        <Empty
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                This page is under development
              </Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Patient ID: {patientId}
              </Text>
            </div>
          }
        />
      </div>
    </div>
  );
};

// Calendar Page
export const PatientCalendar = () => (
  <PlaceholderPage
    title="Calendar"
    description="View and manage care schedule in calendar format"
  />
);

// List Page - Care Items List
export const PatientList = () => {
  const { patientId } = useParams();
  
  return null; // This will be replaced by the actual CareItemsListPage
};

// Budget Page
export const PatientBudget = () => (
  <PlaceholderPage
    title="Budget Management"
    description="Track and manage patient care budget"
  />
);

// Patient Info Page
export const PatientInfo = () => (
  <PlaceholderPage
    title="Patient Information"
    description="Detailed patient profile and medical information"
  />
);

// Settings Page
export const PatientSettings = () => (
  <PlaceholderPage
    title="Settings"
    description="Configure patient care preferences and settings"
  />
);
