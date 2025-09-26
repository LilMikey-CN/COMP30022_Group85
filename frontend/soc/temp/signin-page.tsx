import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Typography, Divider, Space, Checkbox, Select } from 'antd';
import { Heart, Mail, Lock, User, ArrowLeft, Users } from 'lucide-react';

const { Content } = Layout;
const { Title, Text, Link } = Typography;
const { Option } = Select;

const SignupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    setLoading(true);
    console.log('Signup values:', values);
    // TODO: Implement signup logic
    setTimeout(() => setLoading(false), 1000);
  };

  const handleBackToHome = () => {
    // TODO: Navigate back to home page
    console.log('Navigate to home');
  };

  const handleLoginRedirect = () => {
    // TODO: Navigate to login page
    console.log('Navigate to login');
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Content className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back to Home Button */}
          <Button
            type="text"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleBackToHome}
            className="mb-6 text-gray-600 hover:text-blue-600"
          >
            Back to Home
          </Button>

          <Card className="shadow-xl border-0">
            <div className="text-center mb-8">
              {/* Logo */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>

              <Title level={2} className="!text-gray-800 !mb-2">
                Start Caring Better
              </Title>
              <Text className="text-gray-600 text-base">
                Create your account to begin organizing care for your loved ones
              </Text>
            </div>

            <Form
              name="signup"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                label={<Text className="text-gray-700 font-medium">Full Name</Text>}
                name="fullName"
                rules={[
                  { required: true, message: 'Please enter your full name' },
                  { min: 2, message: 'Name must be at least 2 characters' }
                ]}
              >
                <Input
                  prefix={<User className="w-4 h-4 text-gray-400" />}
                  placeholder="Enter your full name"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                label={<Text className="text-gray-700 font-medium">Email Address</Text>}
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email address' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input
                  prefix={<Mail className="w-4 h-4 text-gray-400" />}
                  placeholder="Enter your email address"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                label={<Text className="text-gray-700 font-medium">I am a...</Text>}
                name="userType"
                rules={[{ required: true, message: 'Please select your role' }]}
              >
                <Select
                  placeholder="Select your role"
                  className="h-12"
                  suffixIcon={<Users className="w-4 h-4 text-gray-400" />}
                >
                  <Option value="parent">Parent</Option>
                  <Option value="guardian">Guardian</Option>
                  <Option value="family_member">Family Member</Option>
                  <Option value="caregiver">Professional Caregiver</Option>
                  <Option value="self_advocate">Person with Special Needs</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={<Text className="text-gray-700 font-medium">Password</Text>}
                name="password"
                rules={[
                  { required: true, message: 'Please create a password' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password
                  prefix={<Lock className="w-4 h-4 text-gray-400" />}
                  placeholder="Create a secure password"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                label={<Text className="text-gray-700 font-medium">Confirm Password</Text>}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<Lock className="w-4 h-4 text-gray-400" />}
                  placeholder="Confirm your password"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms'))
                  }
                ]}
                className="!mb-6"
              >
                <Checkbox className="text-gray-600">
                  I agree to the{' '}
                  <Link className="text-blue-600">Terms of Service</Link> and{' '}
                  <Link className="text-blue-600">Privacy Policy</Link>
                </Checkbox>
              </Form.Item>

              <Form.Item className="!mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
                >
                  Create My Account
                </Button>
              </Form.Item>
            </Form>

            <Divider className="!my-6">
              <Text className="text-gray-500">Already have an account?</Text>
            </Divider>

            <Button
              size="large"
              onClick={handleLoginRedirect}
              className="w-full h-12 text-blue-600 border-blue-600 hover:bg-blue-50 hover:border-blue-700 font-medium"
            >
              Sign In Instead
            </Button>

            <div className="text-center mt-6">
              <Text className="text-gray-500 text-sm">
                🔒 Your information is secure and will never be shared
              </Text>
            </div>
          </Card>

          {/* Help Section */}
          <div className="text-center mt-8">
            <Text className="text-gray-600">
              Questions about getting started?{' '}
              <Link className="text-blue-600 hover:text-blue-700">
                We're here to help
              </Link>
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default SignupPage;
