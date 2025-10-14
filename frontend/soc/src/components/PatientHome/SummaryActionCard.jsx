import React from 'react';
import { Card, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const cardStyles = {
  wrapper: {
    height: '100%',
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'all 0.2s ease',
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hintBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: 12,
    backgroundColor: '#f0f5ff',
    color: '#1d39c4',
    fontSize: 12,
    fontWeight: 500,
  },
  arrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: '#1d39c4',
    fontSize: 13,
    fontWeight: 500,
    marginTop: 16,
  },
};

const SummaryActionCard = ({
  title,
  value,
  subtitle,
  valueColor,
  hint,
  onClick,
  loading = false,
  actionLabel = 'Open',
}) => {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        ...cardStyles.wrapper,
        opacity: loading ? 0.6 : 1,
        pointerEvents: loading ? 'none' : 'auto',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={cardStyles.header}>
        <div>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
            {title}
          </Text>
        </div>
        <Tooltip title={hint} placement="topRight">
          <span style={cardStyles.hintBadge}>
            <InfoCircleOutlined />
            Shortcut
          </span>
        </Tooltip>
      </div>

      <Title
        level={1}
        style={{
          margin: 0,
          color: valueColor,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Title>

      {subtitle && (
        <Text type="secondary" style={{ marginTop: 8, display: 'block', fontSize: 14 }}>
          {subtitle}
        </Text>
      )}

      <div style={cardStyles.arrow}>
        <span>{actionLabel}</span>
        <ArrowRightOutlined />
      </div>
    </Card>
  );
};

export default SummaryActionCard;
