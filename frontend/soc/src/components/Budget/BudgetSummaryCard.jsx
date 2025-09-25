import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../data/budgetCalculations';

const { Title, Text } = Typography;

const BudgetSummaryCard = ({ budgetAnalytics }) => {
  const {
    totalAnnualBudget,
    totalSpentToDate,
    totalRemainingBudget,
    budgetUtilization,
    alertStatus
  } = budgetAnalytics;

  return (
    <Card
      style={{ marginBottom: '24px' }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50' }}>
            Total Budget Summary
          </span>
          <EditOutlined style={{ fontSize: '16px', color: '#5a7a9a', cursor: 'pointer' }} />
        </div>
      }
    >
      {/* Budget Summary Numbers */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: '12px',
            color: '#7f8c8d',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            Annual Budget
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: '#5e72e4' }}>
            {formatCurrency(totalAnnualBudget)}
          </div>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
            Calculated from care items
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: '12px',
            color: '#7f8c8d',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            Remaining
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: '#2dce89' }}>
            {formatCurrency(totalRemainingBudget)}
          </div>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
            {((totalRemainingBudget / totalAnnualBudget) * 100).toFixed(1)}% of budget left
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: '12px',
            color: '#7f8c8d',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            Spent to Date
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: '#f5365c' }}>
            {formatCurrency(totalSpentToDate)}
          </div>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
            From completed tasks
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <Text style={{ fontSize: '14px', color: '#2c3e50' }}>
            Budget Utilization
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alertStatus.level !== 'good' && (
              <div style={{
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: alertStatus.color + '20',
                color: alertStatus.color,
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {alertStatus.message}
              </div>
            )}
            <Text style={{ fontSize: '14px', color: '#7f8c8d' }}>
              {budgetUtilization}%
            </Text>
          </div>
        </div>

        <Progress
          percent={budgetUtilization}
          strokeColor={alertStatus.color}
          trailColor="#e9ecef"
          showInfo={false}
          strokeWidth={8}
        />
      </div>
    </Card>
  );
};

export default BudgetSummaryCard;