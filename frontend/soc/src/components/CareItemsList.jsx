import React from 'react';
import { List, Typography, Empty } from 'antd';

const { Text } = Typography;

const CareItemsList = ({ items, type = 'upcoming' }) => {
  if (!items || items.length === 0) {
    return (
      <Empty
        description={`No ${type} items`}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          style={{
            padding: '12px 16px',
            marginBottom: '8px',
            backgroundColor: type === 'overdue' ? '#fff2f0' : '#e6f7ff',
            borderRadius: '6px',
            border: type === 'overdue' ? '1px solid #ffccc7' : '1px solid #91d5ff'
          }}
        >
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: '15px',
              color: '#262626',
              fontWeight: '500'
            }}>
              {item.title}
            </Text>
            <Text style={{
              fontSize: '14px',
              color: type === 'overdue' ? '#ff4d4f' : '#8c8c8c',
              fontWeight: type === 'overdue' ? '600' : 'normal'
            }}>
              {item.date}
            </Text>
          </div>
        </List.Item>
      )}
    />
  );
};

export default CareItemsList;
