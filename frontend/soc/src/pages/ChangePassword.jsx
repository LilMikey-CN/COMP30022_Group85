import React, { useState } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { LAYOUT } from '../utils/constants';
import { auth } from '../firebase/config';

const { Title, Text } = Typography;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    const { currentPassword, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      message.error('New password entries do not match. Please retype them.');
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) {
      message.error('We could not verify your account. Please sign in again.');
      return;
    }

    setSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      message.success('Password updated successfully.');
      form.resetFields();
      navigate('/settings');
    } catch (error) {
      message.error(error?.message || 'Unable to update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f8fb', minHeight: '100%' }}>
      <Card
        style={{
          width: '40%',
          margin: '0 auto',
          borderRadius: 12,
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
        bodyStyle={{ padding: 32, backgroundColor: '#ffffff' }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/settings')}
          style={{
            marginBottom: 8,
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#5a7a9a',
          }}
        >
          Back
        </Button>

        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
            Change password
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Create a new password that is at least 8 characters long.
          </Text>
        </div>

        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          style={{ maxWidth: LAYOUT.formCardMinWidth - 40 }}
        >
          <Form.Item
            label="Type your current password"
            name="currentPassword"
            rules={[
              { required: true, message: 'Please enter your current password.' },
            ]}
          >
            <Input.Password placeholder="Current password" />
          </Form.Item>

          <Form.Item
            label="Type your new password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password.' },
              { min: 8, message: 'Password must be at least 8 characters.' },
            ]}
          >
            <Input.Password placeholder="New password" />
          </Form.Item>

          <Form.Item
            label="Retype your new password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password.' },
              { min: 8, message: 'Password must be at least 8 characters.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('New passwords do not match.'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: 200, marginTop: 8 }}
              loading={submitting}
            >
              Save password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;
