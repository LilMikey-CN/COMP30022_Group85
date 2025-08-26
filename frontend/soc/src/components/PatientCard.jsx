import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Avatar, Typography, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PatientCard = ({ patient }) => {
  const navigate = useNavigate();

  const handleViewSchedule = () => {
    navigate(`/patient/${patient.id}`);
  };

  return (
    <Card
      className="patient-card"
      style={{
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Patient Header */}
        <Space align="center" size="middle">
          <Avatar
            size={48}
            style={{
              backgroundColor: '#b8b8b8',
              fontSize: '18px',
              fontWeight: '500'
            }}
          >
            {patient.initials}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: '16px', display: 'block' }}>
              {patient.name}
            </Text>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {patient.id}
            </Text>
          </div>
        </Space>

        {/* Patient Details */}
        <div style={{ marginTop: '12px' }}>
          <PatientDetail label="Age" value={patient.age} />
          <PatientDetail label="Email" value={patient.email} />
          <PatientDetail label="Mobile" value={patient.mobile} />
          <PatientDetail label="Notes" value={patient.notes} />
        </div>

        {/* Action Button */}
        <Button
          type="primary"
          icon={<VideoCameraOutlined />}
          block
          onClick={handleViewSchedule}
          style={{
            backgroundColor: '#6b8cae',
            borderColor: '#6b8cae',
            height: '36px',
            borderRadius: '4px',
            fontWeight: '500',
            marginTop: '8px'
          }}
        >
          View Care Schedule
        </Button>
      </Space>
    </Card>
  );
};

// Sub-component for patient details
const PatientDetail = ({ label, value }) => (
  <div style={{ marginBottom: '4px' }}>
    <Text type="secondary">{label}: </Text>
    <Text style={{ fontSize: label === 'Email' || label === 'Notes' ? '13px' : '14px' }}>
      {value}
    </Text>
  </div>
);

export default PatientCard;
