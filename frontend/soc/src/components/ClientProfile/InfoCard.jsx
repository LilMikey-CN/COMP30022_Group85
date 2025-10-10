import React from 'react';
import { Card, Spin, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

const InfoCard = ({
  title,
  onEdit,
  loading = false,
  children,
  style = {},
  className,
}) => (
  <Card
    className={className}
    title={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: '16px', fontWeight: '600', color: '#5a7a9a' }}>
          {title}
        </Text>
        <EditOutlined
          className="edit-icon"
          style={{
            color: loading ? '#d9d9d9' : '#8c8c8c',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onClick={loading ? undefined : onEdit}
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
    <Spin spinning={loading}>
      {children}
    </Spin>
  </Card>
);

export default InfoCard;
