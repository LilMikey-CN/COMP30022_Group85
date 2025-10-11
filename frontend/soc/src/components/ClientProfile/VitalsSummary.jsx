import React from 'react';
import { Row, Col, Typography } from 'antd';

const { Text } = Typography;

const METRICS = [
  { key: 'heartRate', label: 'Heart Rate', icon: '❤️', unit: 'bpm', color: '#ff4d4f' },
  { key: 'bloodPressure', label: 'Blood Pressure', icon: '📈', unit: 'mmHg', color: '#1890ff' },
  { key: 'oxygenSaturation', label: 'Oxygen Sat', icon: '🫁', unit: '%', color: '#52c41a' },
  { key: 'temperature', label: 'Temperature', icon: '🌡️', unit: '°C', color: '#fa8c16' },
];

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
        {unit ? ` ${unit}` : ''}
      </Text>
    </div>
  </div>
);

const VitalsSummary = ({ vitals = {} }) => (
  <Row gutter={[16, 16]}>
    {METRICS.map(({ key, ...metric }) => (
      <Col xs={12} sm={6} key={key}>
        <VitalCard
          {...metric}
          value={vitals[key] || '-'}
        />
      </Col>
    ))}
  </Row>
);

export default VitalsSummary;
