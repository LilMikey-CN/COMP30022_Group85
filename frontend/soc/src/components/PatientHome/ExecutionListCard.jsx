import React from 'react';
import { Card, List, Typography, Empty, Button, Tooltip } from 'antd';
import { ArrowRightOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LIST_ITEM_HEIGHT = 56;
const CARD_CONTENT_HEIGHT = LIST_ITEM_HEIGHT * 8;

const ExecutionListCard = ({
  title,
  items = [],
  loading = false,
  emptyDescription,
  onNavigate,
  hasOverflow = false,
  overflowLabel,
}) => {
  return (
    <Card
      title={title}
      style={{
        height: CARD_CONTENT_HEIGHT + 80,
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 16px 16px',
      }}
      headStyle={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {items.length === 0 && !loading ? (
          <div style={{
            height: CARD_CONTENT_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Empty
              description={emptyDescription}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <List
            dataSource={items}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  padding: '12px 0',
                  height: LIST_ITEM_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: 500, color: '#1f2933' }}>
                      {item.title}
                    </Text>
                    {item.notes && (
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {item.notes}
                      </Text>
                    )}
                  </div>
                  <Tooltip title={item.relativeLabel}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: item.isOverdue ? '#ff4d4f' : '#5a7a9a',
                      fontWeight: 500,
                    }}>
                      <ClockCircleOutlined />
                      <span>{item.dateLabel}</span>
                    </div>
                  </Tooltip>
                </div>
              </List.Item>
            )}
            style={{
              maxHeight: CARD_CONTENT_HEIGHT,
              overflowY: 'auto',
            }}
            locale={{
              emptyText: (
                <Empty
                  description={emptyDescription}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </div>

      {hasOverflow && onNavigate && (
        <Button
          type="link"
          onClick={onNavigate}
          icon={<ArrowRightOutlined />}
          style={{
            alignSelf: 'flex-end',
            marginTop: 12,
            padding: 0,
            fontWeight: 500,
          }}
        >
          {overflowLabel}
        </Button>
      )}
    </Card>
  );
};

export default ExecutionListCard;
