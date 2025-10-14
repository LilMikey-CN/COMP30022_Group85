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

const PrivacyPolicy = () => {
  return (
    <Layout style={containerStyle}>
      <Content style={{ width: '100%', maxWidth: 860 }}>
        <Card style={cardStyle} bodyStyle={{ padding: 36 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#1f2937' }}>
            Privacy Policy
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
              Work in progress
            </Title>
            <Paragraph style={{ fontSize: 15, color: '#475569' }}>
              The Scheduling of Care privacy policy is currently being drafted. The final policy will explain what data
              we collect, why we collect it, how long we retain it, and the safeguards in place to protect your
              information. It will also outline your data access rights, how to request corrections or deletion, and how
              to lodge complaints.
            </Paragraph>
            <Paragraph style={{ fontSize: 15, color: '#475569' }}>
              Topics that will be covered include:
            </Paragraph>
            <ul style={{ marginLeft: 20, color: '#475569', fontSize: 15 }}>
              <li>Personal information collected during account creation and daily use</li>
              <li>Legal bases for processing data under applicable privacy regulations</li>
              <li>How information is shared with carers, healthcare providers, and trusted vendors</li>
              <li>Retention timelines, security controls, and breach response procedures</li>
              <li>Contact details for privacy enquiries and designated data protection leads</li>
            </ul>
          </div>

          <Paragraph style={{ marginTop: 28, fontSize: 15, color: '#475569' }}>
            If you need details on how your data is handled before the full policy is published, reach out to
            <Text strong> privacy@schedulingofcare.com</Text> and our privacy team will assist.
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  );
};

export default PrivacyPolicy;
