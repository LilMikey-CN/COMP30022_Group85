import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

const SummaryCard = ({
  title,
  value,
  subtitle,
  valueColor = '#5a7a9a',
  highlight = false,
  isFinancial = false
}) => {
  return (
    <Card
      style={{
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        backgroundColor: highlight ? '#fff7f7' : '#ffffff',
        border: highlight ? '1px solid #ffccc7' : '1px solid #f0f0f0'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Text
          type="secondary"
          style={{
            fontSize: '14px',
            fontWeight: '500',
            display: 'block',
            marginBottom: '8px',
            color: '#8c8c8c'
          }}
        >
          {title}
        </Text>
        <Title
          level={1}
          style={{
            margin: '8px 0',
            color: valueColor,
            fontSize: isFinancial ? '32px' : '48px',
            fontWeight: isFinancial ? '600' : '700'
          }}
        >
          {value}
        </Title>
        <Text
          type="secondary"
          style={{
            fontSize: '13px',
            display: 'block',
            marginTop: '4px'
          }}
        >
          {subtitle}
        </Text>
      </div>
    </Card>
  );
};

export default SummaryCard;
