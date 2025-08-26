import React from 'react';
import { Typography } from 'antd';
import PatientCard from '../components/PatientCard';
import { patientsData } from '../data/mockData';

const { Title, Text } = Typography;

const Dashboard = () => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Dashboard view of all patients
        </Text>
      </div>

      {/* Patient Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {patientsData.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
