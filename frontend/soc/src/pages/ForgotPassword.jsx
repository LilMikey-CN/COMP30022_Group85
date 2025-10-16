import React, { useState } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Typography,
  message
} from 'antd';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';

const { Content } = Layout;
const { Title, Text } = Typography;

const layoutStyle = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#f5f7fb',
  padding: '40px 20px',
};

const cardStyle = {
  width: '100%',
  maxWidth: 420,
  borderRadius: 16,
  boxShadow: '0 18px 30px rgba(31, 41, 55, 0.12)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
};

const cardBodyStyle = {
  padding: '32px 36px',
};

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async ({ email }) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      message.success('Password reset email sent. Check your inbox for further instructions.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error?.message || 'Unable to send reset email. Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/login');
  };

  return (
    <Layout style={layoutStyle}>
      <Content style={{ width: '100%', maxWidth: 520 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={goBack}
          style={{
            marginBottom: 16,
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#2563eb',
            fontSize: 15,
          }}
        >
          Back to login
        </Button>

        <Card style={cardStyle} bodyStyle={cardBodyStyle}>
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
              Reset your password
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 15 }}>
              Enter the email associated with your account and we will send you a link to reset your password.
            </Text>
          </div>

          <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
            <Form.Item
              label="Email address"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email address.' },
                { type: 'email', message: 'Please enter a valid email address.' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                placeholder="name@example.com"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ backgroundColor: '#2563eb', borderRadius: 8 }}
              >
                Send reset link
              </Button>
            </Form.Item>
          </Form>

          <Text type="secondary" style={{ fontSize: 13 }}>
            If you don&apos;t receive the email within a few minutes, please check your spam folder.
          </Text>
        </Card>
      </Content>
    </Layout>
  );
};

export default ForgotPassword;
