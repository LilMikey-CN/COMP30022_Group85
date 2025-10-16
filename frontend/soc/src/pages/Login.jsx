import React, { useState, useEffect } from 'react';
import { Layout, Card, Form, Input, Button, Typography, Divider, Checkbox, message } from 'antd';
import { HeartFilled, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const { Content } = Layout;
const { Title, Text, Link: TypographyLink } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.state]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password, values.remember);
      if (result.success) {
        message.success('Login successful!');
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        message.error(result.error || 'Login failed');
      }
    } catch (error) { // eslint-disable-line no-unused-vars
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/landing');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignUpRedirect = () => {
    navigate('/signup');
  };

  const layoutStyle = {
    minHeight: '100vh',
    display: 'flex'
  };

  const leftPanelStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '100vh'
  };

  const rightPanelStyle = {
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 60px',
    position: 'relative',
    minHeight: '100vh'
  };

  const formContainerStyle = {
    width: '100%',
    maxWidth: '450px'
  };

  const backButtonStyle = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    color: 'white',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    borderRadius: '8px',
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.1)'
  };

  const cardStyle = {
    border: 'none',
    background: 'transparent',
    boxShadow: 'none',
    padding: 0
  };

  const logoContainerStyle = {
    width: '100px',
    height: '100px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 30px auto',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px'
  };

  const titleStyle = {
    color: '#1f2937',
    marginBottom: '12px',
    fontSize: '28px'
  };

  const subtitleStyle = {
    color: '#6b7280',
    fontSize: '18px'
  };

  const labelStyle = {
    color: '#374151',
    fontWeight: 500,
    fontSize: '16px'
  };

  const inputStyle = {
    height: '52px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    borderRadius: '8px'
  };

  const rememberRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  };

  const checkboxStyle = {
    color: '#6b7280'
  };

  const forgotLinkStyle = {
    color: '#2563eb',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    padding: '2px 4px'
  };

  const signInButtonStyle = {
    width: '100%',
    height: '52px',
    backgroundColor: '#2563eb',
    fontSize: '18px',
    fontWeight: 500,
    marginBottom: '16px',
    borderRadius: '8px'
  };

  const dividerStyle = {
    margin: '24px 0'
  };

  const dividerTextStyle = {
    color: '#6b7280'
  };

  const signUpButtonStyle = {
    width: '100%',
    height: '52px',
    color: '#2563eb',
    borderColor: '#2563eb',
    fontWeight: 500,
    borderRadius: '8px'
  };

  const termsStyle = {
    textAlign: 'center',
    marginTop: '28px'
  };

  const termsTextStyle = {
    color: '#6b7280',
    fontSize: '14px'
  };

  const termsLinkStyle = {
    color: '#2563eb',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    padding: '2px 4px'
  };

  const helpStyle = {
    textAlign: 'center',
    marginTop: '40px'
  };

  const helpTextStyle = {
    color: '#6b7280'
  };

  const helpLinkStyle = {
    color: '#2563eb',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    padding: '2px 4px'
  };

  const leftContentStyle = {
    textAlign: 'center',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100%'
  };

  const leftTitleStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: 'white'
  };

  const leftSubtitleStyle = {
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '40px',
    lineHeight: 1.6
  };

  const decorativeElementStyle = {
    position: 'absolute',
    top: '20%',
    left: '-10%',
    width: '300px',
    height: '300px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    zIndex: 1
  };

  return (
    <Layout style={layoutStyle}>
      <Layout.Sider width="60%" style={leftPanelStyle}>
        {/* Back to Home Button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBackToHome}
          style={backButtonStyle}
        >
          Back to Home
        </Button>

        {/* Decorative Elements */}
        <div style={decorativeElementStyle}></div>

        {/* Left Panel Content */}
        <div style={leftContentStyle}>
          <div style={logoContainerStyle}>
            <HeartFilled style={{ fontSize: '50px', color: 'white' }} />
          </div>

          <h1 style={leftTitleStyle}>Welcome Back</h1>
          <p style={leftSubtitleStyle}>
            Sign in to continue managing care for your loved ones.<br />
            Your care coordination journey continues here.
          </p>
        </div>
      </Layout.Sider>

      {/* Right Panel - Form */}
      <Content style={rightPanelStyle}>
        <div style={formContainerStyle}>
          <div style={headerStyle}>
            <Title level={2} style={titleStyle}>
              Sign In
            </Title>
            <Text style={subtitleStyle}>
              Enter your credentials to access your account
            </Text>
          </div>

          <Card style={cardStyle}>
            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                label={<Text style={labelStyle}>Email Address</Text>}
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email address' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Enter your email address"
                  style={inputStyle}
                />
              </Form.Item>

              <Form.Item
                label={<Text style={labelStyle}>Password</Text>}
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Enter your password"
                  style={inputStyle}
                />
              </Form.Item>

              <div style={rememberRowStyle}>
                <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox style={checkboxStyle}>Remember me</Checkbox>
                </Form.Item>
                <TypographyLink
                  onClick={handleForgotPassword}
                  style={forgotLinkStyle}
                >
                  Forgot password?
                </TypographyLink>
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={signInButtonStyle}
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    button.style.setProperty('background-color', 'rgb(87, 147, 247)', 'important');
                  }}
                  onMouseLeave={(e) => {
                    const button = e.currentTarget;
                    button.style.setProperty('background-color', '#2563eb', 'important');
                  }}
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <Divider style={dividerStyle}>
              <Text style={dividerTextStyle}>New to Scheduling of Care?</Text>
            </Divider>

            <Button
              size="large"
              onClick={handleSignUpRedirect}
              style={signUpButtonStyle}
              onMouseEnter={(e) => {
                const button = e.currentTarget;
                button.style.backgroundColor = '#eff6ff';
                button.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget;
                button.style.backgroundColor = 'transparent';
                button.style.borderColor = '#2563eb';
              }}
            >
              Create Your Account
            </Button>

            <div style={termsStyle}>
              <Text style={termsTextStyle}>
                By signing in, you agree to our{' '}
                <RouterLink to="/terms-of-service" style={termsLinkStyle}>
                  Terms of Service
                </RouterLink>{' '}
                and{' '}
                <RouterLink to="/privacy-policy" style={termsLinkStyle}>
                  Privacy Policy
                </RouterLink>
              </Text>
            </div>
          </Card>

          {/* Help Section */}
          <div style={helpStyle}>
            <Text style={helpTextStyle}>
              Need help getting started?{' '}
              <TypographyLink style={helpLinkStyle}>
                Contact our support team
              </TypographyLink>
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Login;
