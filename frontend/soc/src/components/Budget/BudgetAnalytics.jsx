import React from 'react';
import { Card, Row, Col, Typography, Space, Tag, Progress } from 'antd';
import { LineChartOutlined, CalendarOutlined, ExclamationCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../data/budgetCalculations';

const { Title, Text } = Typography;

const BudgetAnalytics = ({ budgetAnalytics }) => {
  const {
    projectedSpending,
    overBudgetItems,
    upcomingCosts,
    monthlySpending
  } = budgetAnalytics;

  // Get current month spending
  const currentMonth = new Date().getMonth() + 1;
  // eslint-disable-next-line no-unused-vars
  const currentMonthData = monthlySpending.find(m => m.month === currentMonth);
  // eslint-disable-next-line no-unused-vars
  const lastMonthData = monthlySpending.find(m => m.month === currentMonth - 1);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      {/* Projected Spending Card */}
      <Col xs={24} md={8}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LineChartOutlined style={{ color: '#1890ff' }} />
              <span>Year-End Projection</span>
            </div>
          }
          style={{ height: '100%' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '12px', color: '#7f8c8d', display: 'block' }}>
                Projected Total Spending
              </Text>
              <Text style={{
                fontSize: '24px',
                fontWeight: 600,
                color: projectedSpending.projectedTotalSpending > projectedSpending.totalAnnualBudget ? '#ff4d4f' : '#2c3e50'
              }}>
                {formatCurrency(projectedSpending.projectedTotalSpending)}
              </Text>
            </div>

            {projectedSpending.projectedOverage > 0 && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: '6px',
                marginBottom: '12px'
              }}>
                <Text style={{ fontSize: '12px', color: '#ff4d4f', fontWeight: 'bold' }}>
                  Over Budget: {formatCurrency(projectedSpending.projectedOverage)}
                </Text>
              </div>
            )}

            <div style={{ textAlign: 'left', fontSize: '12px', color: '#7f8c8d' }}>
              <div>Days Elapsed: {projectedSpending.daysElapsed}</div>
              <div>Days Remaining: {projectedSpending.daysRemaining}</div>
              <div>Daily Rate: {formatCurrency(projectedSpending.dailySpendingRate)}</div>
            </div>
          </div>
        </Card>
      </Col>

      {/* Over Budget Items Card */}
      <Col xs={24} md={8}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              <span>Budget Alerts</span>
              {overBudgetItems.length > 0 && (
                <Tag color="red" style={{ marginLeft: 'auto' }}>
                  {overBudgetItems.length}
                </Tag>
              )}
            </div>
          }
          style={{ height: '100%' }}
        >
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {overBudgetItems.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {overBudgetItems.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#fff2f0',
                      border: '1px solid #ffccc7',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: '13px', fontWeight: 500 }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: '11px', color: '#ff4d4f', fontWeight: 'bold' }}>
                        +{formatCurrency(item.variance.absolute)}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7f8c8d' }}>
                      <span>Budget: {formatCurrency(item.annualBudget)}</span>
                      <span>Spent: {formatCurrency(item.actualSpent)}</span>
                    </div>
                  </div>
                ))}
                {overBudgetItems.length > 3 && (
                  <Text style={{ fontSize: '12px', color: '#7f8c8d', textAlign: 'center', display: 'block' }}>
                    +{overBudgetItems.length - 3} more items over budget
                  </Text>
                )}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', color: '#52c41a', padding: '20px 0' }}>
                <Text style={{ fontSize: '14px' }}>
                  ✓ All items within budget
                </Text>
              </div>
            )}
          </div>
        </Card>
      </Col>

      {/* Upcoming Costs Card */}
      <Col xs={24} md={8}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarOutlined style={{ color: '#722ed1' }} />
              <span>Upcoming Costs (30 days)</span>
            </div>
          }
          style={{ height: '100%' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Text style={{ fontSize: '12px', color: '#7f8c8d', display: 'block' }}>
              Estimated Upcoming Spending
            </Text>
            <Text style={{ fontSize: '24px', fontWeight: 600, color: '#722ed1' }}>
              {formatCurrency(upcomingCosts.totalEstimatedCost)}
            </Text>
            <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
              {upcomingCosts.taskCount} tasks scheduled
            </Text>
          </div>

          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {upcomingCosts.tasks.slice(0, 3).map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <Text style={{ fontSize: '12px' }}>{task.careItemName}</Text>
                <Text style={{ fontSize: '12px', fontWeight: 500 }}>
                  {formatCurrency(task.estimatedCost)}
                </Text>
              </div>
            ))}
            {upcomingCosts.tasks.length > 3 && (
              <Text style={{ fontSize: '11px', color: '#7f8c8d', textAlign: 'center', display: 'block', marginTop: '8px' }}>
                +{upcomingCosts.tasks.length - 3} more tasks
              </Text>
            )}
          </div>
        </Card>
      </Col>

      {/* Monthly Spending Trend */}
      <Col xs={24}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChartOutlined style={{ color: '#13c2c2' }} />
              <span>Monthly Spending Overview</span>
            </div>
          }
        >
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '8px 0' }}>
            {monthlySpending.slice(0, 6).map(month => {
              const isCurrentMonth = month.month === currentMonth;
              return (
                <div
                  key={month.month}
                  style={{
                    minWidth: '120px',
                    textAlign: 'center',
                    padding: '12px',
                    backgroundColor: isCurrentMonth ? '#f0f7ff' : '#fafafa',
                    borderRadius: '8px',
                    border: isCurrentMonth ? '2px solid #1890ff' : '1px solid #e9ecef'
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#7f8c8d', display: 'block' }}>
                    {month.monthName}
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50', display: 'block' }}>
                    {formatCurrency(month.totalSpent)}
                  </Text>
                  <Text style={{ fontSize: '11px', color: '#7f8c8d' }}>
                    {month.taskCount} tasks
                  </Text>
                </div>
              );
            })}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default BudgetAnalytics;