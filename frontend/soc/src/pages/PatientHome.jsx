import React, { useMemo } from 'react';
import { Typography, Row, Col, Spin, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import SummaryActionCard from '../components/PatientHome/SummaryActionCard';
import ExecutionListCard from '../components/PatientHome/ExecutionListCard';
import { usePatientHomeDashboard } from '../hooks/usePatientHomeDashboard';
import { formatCountValue } from '../utils/patientHome';

const { Title, Text } = Typography;

const KPI_TODAY_COLOR = '#5a7a9a';
const KPI_OVERDUE_COLOR = '#ff4d4f';
const KPI_BUDGET_COLOR = '#52c41a';
const MAX_LIST_ITEMS = 5;

const PatientHome = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    clientName,
    summaryMetrics,
    upcoming,
    overdue,
    navigationTargets,
  } = usePatientHomeDashboard();

  const handleNavigate = (target) => {
    if (!target) {
      return;
    }
    if (target.state) {
      navigate(target.path, { state: target.state });
      return;
    }
    navigate(target.path);
  };

  const upcomingItems = useMemo(
    () => upcoming.items.slice(0, MAX_LIST_ITEMS),
    [upcoming.items],
  );

  const overdueItems = useMemo(
    () => overdue.items.slice(0, MAX_LIST_ITEMS),
    [overdue.items],
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f8fb', minHeight: '100%' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          {`Caring for ${clientName}`}
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Overview of today's schedule, overdue follow-ups, and budget health
        </Text>
      </div>

      {error && (
        <Alert
          type="error"
          message="We couldn't load all of the dashboard data."
          description={error.message || 'Please try again or refresh the page.'}
          style={{ marginBottom: 24 }}
        />
      )}

      <Spin spinning={loading}>
        {/* Summary Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={8}>
            <SummaryActionCard
              title="Today"
              value={formatCountValue(summaryMetrics.todayCount)}
              subtitle="Care executions scheduled for today"
              valueColor={KPI_TODAY_COLOR}
              hint="Opens the calendar on today so you can review and action the day's executions."
              actionLabel="View calendar"
              onClick={() => handleNavigate(navigationTargets.calendarToday)}
              loading={loading}
            />
          </Col>
          <Col xs={24} md={8}>
            <SummaryActionCard
              title="Overdue"
              value={formatCountValue(summaryMetrics.overdueCount)}
              subtitle="Executions that need urgent attention"
              valueColor={KPI_OVERDUE_COLOR}
              hint="Takes you to the calendar focusing on the earliest overdue executions."
              actionLabel="Review overdue"
              onClick={() => handleNavigate(navigationTargets.calendarOverdue)}
              loading={loading}
            />
          </Col>
          <Col xs={24} md={8}>
            <SummaryActionCard
              title="Budget remaining"
              value={summaryMetrics.budget.formatted.remaining}
              subtitle={`${summaryMetrics.budget.formatted.spent} spent of ${summaryMetrics.budget.formatted.total}`}
              valueColor={KPI_BUDGET_COLOR}
              hint="Opens the budget page to review allocations and recent spending."
              actionLabel="View budget"
              onClick={() => handleNavigate(navigationTargets.budget)}
              loading={loading}
            />
          </Col>
        </Row>

        {/* Task Lists */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <ExecutionListCard
              title="Upcoming (next 3 days)"
              items={upcomingItems}
              loading={loading}
              emptyDescription="No executions scheduled in the next 3 days."
              hasOverflow={upcoming.hasOverflow}
              overflowLabel="See all in task scheduling"
              onNavigate={() => handleNavigate(navigationTargets.scheduling)}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ExecutionListCard
              title="Overdue"
              items={overdueItems}
              loading={loading}
              emptyDescription="No overdue executions - great work!"
              hasOverflow={overdue.hasOverflow}
              overflowLabel="Resolve in task scheduling"
              onNavigate={() => handleNavigate(navigationTargets.scheduling)}
            />
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default PatientHome;
