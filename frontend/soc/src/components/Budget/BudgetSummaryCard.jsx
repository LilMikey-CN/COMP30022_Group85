import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { formatCurrency } from '../../utils/budgetAnalytics';

const { Title, Text } = Typography;

const BudgetSummaryCard = ({ budgetAnalytics }) => {
  const {
    totalAnnualBudget,
    totalSpentToDate,
    totalRemainingBudget,
    budgetUtilization,
    alertStatus
  } = budgetAnalytics;
  const remainingPercentage = totalAnnualBudget > 0
    ? ((totalRemainingBudget / totalAnnualBudget) * 100).toFixed(1)
    : '0.0';

  return (
    <Card
      className="budget-page-card"
      style={{
        marginBottom: '24px',
        backgroundColor: '#fafbfc',
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
      headStyle={{
        backgroundColor: '#fafbfc',
        borderBottom: '1px solid #e1e8ed'
      }}
      bodyStyle={{ backgroundColor: '#fafbfc' }}
      title={
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50' }}>
          Total Budget Summary
        </span>
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
            Annual allocation across categories
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
            {remainingPercentage}% of budget left
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
            Budget Utilisation
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alertStatus.message && (
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
