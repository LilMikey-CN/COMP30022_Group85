import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Typography, Divider, Space, Checkbox } from 'antd';
import { Heart, Mail, Lock, ArrowLeft } from 'lucide-react';

const { Content } = Layout;
const { Title, Text, Link } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    setLoading(true);
    console.log('Login values:', values);
    // TODO: Implement login logic
    setTimeout(() => setLoading(false), 1000);
  };

  const handleBackToHome = () => {
    // TODO: Navigate back to home page
    console.log('Navigate to home');
  };

  const handleForgotPassword = () => {
    // TODO: Handle forgot password
    console.log('Forgot password clicked');
  };

  const handleSignUpRedirect = () => {
    // TODO: Navigate to signup page
    console.log('Navigate to signup');
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
                Welcome Back
              </Title>
              <Text className="text-gray-600 text-base">
                Sign in to continue caring for your loved ones
              </Text>
            </div>

            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
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
                label={<Text className="text-gray-700 font-medium">Password</Text>}
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password
                  prefix={<Lock className="w-4 h-4 text-gray-400" />}
                  placeholder="Enter your password"
                  className="h-12"
                />
              </Form.Item>

              <div className="flex justify-between items-center mb-6">
                <Form.Item name="remember" valuePropName="checked" className="!mb-0">
                  <Checkbox className="text-gray-600">Remember me</Checkbox>
                </Form.Item>
                <Link
                  onClick={handleForgotPassword}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <Form.Item className="!mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <Divider className="!my-6">
              <Text className="text-gray-500">New to Scheduling of Care?</Text>
            </Divider>

            <Button
              size="large"
              onClick={handleSignUpRedirect}
              className="w-full h-12 text-blue-600 border-blue-600 hover:bg-blue-50 hover:border-blue-700 font-medium"
            >
              Create Your Account
            </Button>

            <div className="text-center mt-6">
              <Text className="text-gray-500 text-sm">
                By signing in, you agree to our{' '}
                <Link className="text-blue-600">Terms of Service</Link> and{' '}
                <Link className="text-blue-600">Privacy Policy</Link>
              </Text>
            </div>
          </Card>

          {/* Help Section */}
          <div className="text-center mt-8">
            <Text className="text-gray-600">
              Need help getting started?{' '}
              <Link className="text-blue-600 hover:text-blue-700">
                Contact our support team
              </Link>
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;
