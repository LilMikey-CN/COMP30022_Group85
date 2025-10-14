import React from 'react';
import { Card, Button, Dropdown, Typography, Space, Tag } from 'antd';
import { MoreOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/budgetAnalytics';

const { Text } = Typography;

const CategoryBudgetCard = ({
  category,
  loading,
  onEditCategory,
  onAddCareTask,
  onEditCareTask,
  onTransferBudget
}) => {
  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Category',
      icon: <EditOutlined />, 
      onClick: onEditCategory
    },
  ];

  return (
    <Card
      style={{
        marginBottom: 24,
        border: '1px solid #e9ecef',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: category.color || '#d9d9d9'
              }}
            />
            <Text style={{ fontSize: 20, fontWeight: 600, color: '#2c3e50' }}>
              {category.name}
            </Text>
            {category.isOverUtilization && (
              <Tag color={category.utilization >= 100 ? 'red' : 'orange'} style={{ borderRadius: 12 }}>
                {category.utilization >= 100 ? 'Over budget' : 'Over 80% utilised'}
              </Tag>
            )}
          </div>
          <Text style={{ fontSize: 12, color: '#7f8c8d', fontStyle: 'italic' }}>
            {category.description || 'No description'}
          </Text>
        </div>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ width: 36, height: 36 }}
            disabled={loading}
          />
        </Dropdown>
      </div>

      <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
        <SummaryItem label="Annual Budget" value={formatCurrency(category.annualBudget)} />
        <SummaryItem label="Remaining" value={formatCurrency(category.remaining)} valueStyle={{ color: '#2dce89' }} />
        <SummaryItem label="Spent" value={formatCurrency(category.actualSpent)} valueStyle={{ color: '#f5365c' }} />
        <SummaryItem
          label="Utilisation"
          value={`${category.utilization}%`}
          valueStyle={{
            color: category.utilization >= 100
              ? '#ff4d4f'
              : category.utilization >= 80
                ? '#fa8c16'
                : '#52c41a'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#7f8c8d', marginBottom: 20 }}>
        <span>{category.careTasks.length} care task{category.careTasks.length === 1 ? '' : 's'}</span>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {category.careTasks.map((task) => (
          <CareTaskItem
            key={task.id}
            task={task}
            loading={loading}
            onEdit={() => onEditCareTask(task)}
            onTransfer={() => onTransferBudget(task, category)}
          />
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onAddCareTask}
          style={{ width: '100%', color: '#5e72e4', borderColor: '#5e72e4' }}
        >
          Add care task
        </Button>
      </Space>
    </Card>
  );
};

const SummaryItem = ({ label, value, valueStyle = {} }) => (
  <div>
    <div style={{
      fontSize: 12,
      color: '#7f8c8d',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      marginBottom: 4
    }}
    >
      {label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 600, color: '#2c3e50', ...valueStyle }}>
      {value}
    </div>
  </div>
);

const CareTaskItem = ({ task, loading, onEdit, onTransfer }) => {
  const utilizationColor = task.utilization >= 100
    ? '#ff4d4f'
    : task.utilization >= 80
      ? '#ff4d4f'
      : '#2c3e50';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: 12,
      background: '#f8f9fa',
      borderRadius: 8,
      border: '1px solid #e9ecef'
    }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: '#2c3e50' }}>{task.name}</Text>
          {task.description ? (
            <Text style={{ fontSize: 12, color: '#7f8c8d' }}>{task.description}</Text>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Metric label="Budget" value={formatCurrency(task.yearlyBudget)} />
            <Metric label="Remaining" value={formatCurrency(task.remaining)} valueStyle={{ color: '#2dce89' }} />
            <Metric label="Spent" value={formatCurrency(task.actualSpent)} valueStyle={{ color: '#f5365c' }} />
            <Metric
              label="Utilisation"
              value={`${task.utilization}%`}
              valueStyle={{ color: utilizationColor }}
            />
            {task.estimatedUpcomingCost > 0 && (
              <Metric
                label="Upcoming"
                value={formatCurrency(task.estimatedUpcomingCost)}
                valueStyle={{ color: '#722ed1' }}
              />
            )}
          </div>
          <Space size={8}>
            {task.hasSurplus && (
              <Tag color="gold" style={{ borderRadius: 12 }}>Surplus</Tag>
            )}
            <Button
              size="small"
              onClick={onEdit}
              disabled={loading}
              style={{ background: '#e3f2fd', color: '#2196f3', border: 'none', fontSize: 11 }}
            >
              Edit
            </Button>
            <Button
              size="small"
              onClick={onTransfer}
              disabled={loading || !task.canTransfer}
              style={{
                background: task.canTransfer ? '#fff7e6' : '#f0f0f0',
                color: task.canTransfer ? '#fa8c16' : '#8c8c8c',
                border: 'none',
                fontSize: 11
              }}
            >
              Transfer budget
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, valueStyle = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <Text style={{ fontSize: 12, color: '#7f8c8d' }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: 600, color: '#2c3e50', ...valueStyle }}>{value}</Text>
  </div>
);

export default CategoryBudgetCard;
