import React from 'react';
import { Card, Tag, Typography, Progress, Tooltip } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatCurrency, calculateAnnualBudget, calculateActualSpending, calculateVariance } from '../../data/budgetCalculations';
import { getPriorityColor, getRelativeDateDescription } from '../../data/dataHelpers';

const { Text } = Typography;

const CareItemCard = ({ careItem, tasks = [] }) => {
  const annualBudget = calculateAnnualBudget(careItem);
  const actualSpent = calculateActualSpending(careItem.id, tasks);
  const variance = calculateVariance(careItem, tasks);
  const remaining = Math.max(0, annualBudget - actualSpent);
  const utilization = annualBudget > 0 ? Math.round((actualSpent / annualBudget) * 100) : 0;

  const getStatusIcon = () => {
    if (variance.isOverBudget) {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    if (actualSpent > 0) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
  };

  const getVarianceColor = () => {
    if (variance.isOverBudget) return '#ff4d4f';
    if (variance.absolute < 0) return '#52c41a';
    return '#fa8c16';
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: '12px',
        border: `1px solid ${variance.isOverBudget ? '#ffccc7' : '#d9d9d9'}`,
        backgroundColor: variance.isOverBudget ? '#fff2f0' : '#ffffff'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Care Item Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {getStatusIcon()}
            <Text strong style={{ fontSize: '14px', color: '#2c3e50' }}>
              {careItem.name}
            </Text>
            <Tag
              color={getPriorityColor(careItem.priority)}
              style={{ fontSize: '10px', margin: 0 }}
            >
              {careItem.priority.toUpperCase()}
            </Tag>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
            <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
              <strong>Frequency:</strong> {careItem.frequencyDescription}
            </Text>
            <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
              <strong>Est. Cost:</strong> {formatCurrency(careItem.estimatedCostPerItem)}
            </Text>
            <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
              <strong>Next Due:</strong> {getRelativeDateDescription(careItem.nextDueDate)}
            </Text>
          </div>

          {/* Budget Progress */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <Text style={{ fontSize: '11px', color: '#7f8c8d' }}>
                Annual Budget: {formatCurrency(annualBudget)}
              </Text>
              <Text style={{ fontSize: '11px', color: '#7f8c8d' }}>
                {utilization}% used
              </Text>
            </div>
            <Progress
              percent={Math.min(utilization, 100)}
              strokeColor={utilization > 100 ? '#ff4d4f' : utilization > 80 ? '#fa8c16' : '#52c41a'}
              trailColor="#f0f0f0"
              showInfo={false}
              size="small"
            />
          </div>
        </div>

        {/* Budget Summary */}
        <div style={{ textAlign: 'right', minWidth: '120px' }}>
          <div style={{ marginBottom: '4px' }}>
            <Text style={{ fontSize: '12px', color: '#7f8c8d', display: 'block' }}>
              Spent
            </Text>
            <Text style={{ fontSize: '16px', fontWeight: 600, color: '#f5365c' }}>
              {formatCurrency(actualSpent)}
            </Text>
          </div>

          <div style={{ marginBottom: '4px' }}>
            <Text style={{ fontSize: '12px', color: '#7f8c8d', display: 'block' }}>
              Remaining
            </Text>
            <Text style={{ fontSize: '14px', fontWeight: 500, color: '#2dce89' }}>
              {formatCurrency(remaining)}
            </Text>
          </div>

          {/* Variance Indicator */}
          {variance.absolute !== 0 && (
            <Tooltip title={`Average ${variance.isOverBudget ? 'over' : 'under'} budget by ${formatCurrency(Math.abs(variance.absolute))}`}>
              <div style={{
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: getVarianceColor() + '20',
                border: `1px solid ${getVarianceColor()}`,
                marginTop: '4px'
              }}>
                <Text style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: getVarianceColor()
                }}>
                  {variance.isOverBudget ? '+' : ''}{variance.percentage}%
                </Text>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Care Item Notes */}
      {careItem.notes && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
          <Text style={{ fontSize: '11px', color: '#8c8c8c', fontStyle: 'italic' }}>
            {careItem.notes}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default CareItemCard;