import React from 'react';
import { Layout, Card, Typography } from 'antd';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const containerStyle = {
  minHeight: '100vh',
  background: '#f5f8fb',
  padding: '48px 24px',
  display: 'flex',
  justifyContent: 'center'
};

const cardStyle = {
  width: '100%',
  maxWidth: 820,
  borderRadius: 16,
  boxShadow: '0 18px 30px rgba(31, 41, 55, 0.12)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backgroundColor: '#ffffff'
};

const TermsOfService = () => {
  return (
    <Layout style={containerStyle}>
      <Content style={{ width: '100%', maxWidth: 860 }}>
        <Card style={cardStyle} bodyStyle={{ padding: 36 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#1f2937' }}>
            Terms of Service
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Placeholder notice - updated policy coming soon
          </Text>

          <div style={{
            marginTop: 24,
            borderRadius: 12,
            border: '1px dashed #94a3b8',
            backgroundColor: '#f8fafc',
            padding: 24
          }}>
            <Title level={4} style={{ color: '#334155' }}>
              What to expect here
            </Title>
            <Paragraph style={{ fontSize: 15, color: '#475569' }}>
              This page will soon include the full Terms of Service for the Scheduling of Care platform. Legal review
              is underway to ensure the content covers account eligibility, user responsibilities, service descriptions,
              limitation of liability, dispute resolution, and change-management processes.
            </Paragraph>
            <Paragraph style={{ fontSize: 15, color: '#475569' }}>
              Once published, the Terms of Service will outline how to:
            </Paragraph>
            <ul style={{ marginLeft: 20, color: '#475569', fontSize: 15 }}>
              <li>Understand permitted uses of the Scheduling of Care platform</li>
              <li>Review service availability, account suspension, and termination policies</li>
              <li>See how disputes are handled and which region’s law applies</li>
              <li>Know how policy updates are communicated before they take effect</li>
            </ul>
          </div>

          <Paragraph style={{ marginTop: 28, fontSize: 15, color: '#475569' }}>
            If you have immediate questions about your obligations or use of the platform, please contact the Scheduling
            of Care support team at <Text strong>support@schedulingofcare.com</Text> or speak with your programme administrator.
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  );
};

export default TermsOfService;
