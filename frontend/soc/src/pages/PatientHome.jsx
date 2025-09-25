import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { useParams } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import CareItemsList from '../components/CareItemsList';
//import { patientsData } from '../data/mockData';
import { careScheduleData } from '../data/careScheduleData';

const { Title, Text } = Typography;

const PatientHome = () => {
  const { patientId } = useParams();

  // Get patient data (in real app, this would be an API call)

  //const patient = patientsData.find(p => p.id === patientId) || patientsData[0];
  const scheduleData = careScheduleData[patientId] || careScheduleData.default;

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Home
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Overview of care requirements
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
        <Col xs={24} md={8}>
          <SummaryCard
            title="Today"
            value={scheduleData.todayCount}
            subtitle="Care items due"
            valueColor="#5a7a9a"
          />
        </Col>
        <Col xs={24} md={8}>
          <SummaryCard
            title="Overdue"
            value={scheduleData.overdueCount}
            subtitle="Require attention"
            valueColor="#ff4d4f"
            highlight={scheduleData.overdueCount > 0}
          />
        </Col>
        <Col xs={24} md={8}>
          <SummaryCard
            title="Budget remaining"
            value={`$${scheduleData.budgetRemaining.toLocaleString()}`}
            subtitle={`$${scheduleData.budgetSpent} spent out of $${scheduleData.budgetTotal.toLocaleString()}`}
            valueColor="#52c41a"
            isFinancial={true}
          />
        </Col>
      </Row>

      {/* Care Items Lists */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Upcoming</span>
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                  • 10 days
                </Text>
              </div>
            }
            style={{ height: '100%' }}
          >
            <CareItemsList
              items={scheduleData.upcomingItems}
              type="upcoming"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Overdue"
            style={{ height: '100%' }}
          >
            <CareItemsList
              items={scheduleData.overdueItems}
              type="overdue"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientHome;
