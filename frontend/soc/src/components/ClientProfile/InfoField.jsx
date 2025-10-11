import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

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

export default InfoField;
