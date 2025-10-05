import React, { useState, useEffect } from 'react';
import { Layout, Card, Form, Input, Button, Typography, Divider, Checkbox, message, Select } from 'antd';
import { HeartFilled, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate /* , useLocation */ } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const { Content } = Layout;
const { Title, Text, Link } = Typography;

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await signup(values.email, values.password, values.role, values.name);
      if (result.success) {
        message.success('Account created successfully!');
        navigate('/');
      } else {
        message.error(result.error || 'Signup failed');
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

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const layoutStyle = {
    minHeight: '100vh',
    display: 'flex'
  };

  const leftPanelStyle = {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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

  // const selectStyle = { // eslint-disable-line no-unused-vars
  //   height: '52px',
  //   transition: 'all 0.2s ease',
  //   borderRadius: '8px'
  // };

  const checkboxStyle = {
    color: '#6b7280',
    marginBottom: '24px'
  };

  const termsLinkStyle = {
    color: '#2563eb',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    padding: '2px 4px'
  };

  const createButtonStyle = {
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

  const signInButtonStyle = {
    width: '100%',
    height: '52px',
    color: '#2563eb',
    borderColor: '#2563eb',
    fontWeight: 500,
    borderRadius: '8px'
  };

  const securityStyle = {
    textAlign: 'center',
    marginTop: '28px'
  };

  const securityTextStyle = {
    color: '#6b7280',
    fontSize: '14px'
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
    top: '15%',
    right: '-10%',
    width: '350px',
    height: '350px',
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

          <h1 style={leftTitleStyle}>Start Caring Better</h1>
          <p style={leftSubtitleStyle}>
            Join thousands of families who trust us<br />
            to organise and coordinate care for their loved ones.
          </p>
        </div>
      </Layout.Sider>

      {/* Right Panel - Form */}
      <Content style={rightPanelStyle}>
        <div style={formContainerStyle}>
          <div style={headerStyle}>
            <Title level={2} style={titleStyle}>
              Create Account
            </Title>
            <Text style={subtitleStyle}>
              Get started with your care coordination journey
            </Text>
          </div>

          <Card style={cardStyle}>
            <Form
              name="signup"
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
                rules={[
                  { required: true, message: 'Please create a password' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Create a secure password"
                  style={inputStyle}
                />
              </Form.Item>

              <Form.Item
                label={<Text style={labelStyle}>Confirm Password</Text>}
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
                  prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Confirm your password"
                  style={inputStyle}
                />
              </Form.Item>

              <Form.Item
                label={<Text style={labelStyle}>Full Name</Text>}
                name="name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input
                  placeholder="Enter your full name"
                  style={inputStyle}
                />
              </Form.Item>

              <Form.Item
                label={<Text style={labelStyle}>Role</Text>}
                name="role"
                rules={[{ required: true, message: 'Please select your role' }]}
              >
                <Select
                  placeholder="Select your role"
                  style={{ ...inputStyle, height: '52px' }}
                  options={[
                    { value: 'family', label: 'Family Member' },
                    { value: 'powerOfAttorney', label: 'Power of Attorney' },
                    { value: 'carer', label: 'Carer' },
                    { value: 'manager', label: 'Manager' },
                  ]}
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
                style={checkboxStyle}
              >
                <Checkbox style={{ color: '#6b7280' }}>
                  I agree to the{' '}
                  <Link style={termsLinkStyle}>Terms of Service</Link> and{' '}
                  <Link style={termsLinkStyle}>Privacy Policy</Link>
                </Checkbox>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={createButtonStyle}
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    button.style.setProperty('background-color', 'rgb(87, 147, 247)', 'important');
                  }}
                  onMouseLeave={(e) => {
                    const button = e.currentTarget;
                    button.style.setProperty('background-color', '#2563eb', 'important');
                  }}
                >
                  Create My Account
                </Button>
              </Form.Item>
            </Form>

            <Divider style={dividerStyle}>
              <Text style={dividerTextStyle}>Already have an account?</Text>
            </Divider>

            <Button
              size="large"
              onClick={handleLoginRedirect}
              style={signInButtonStyle}
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
              Sign In Instead
            </Button>

            <div style={securityStyle}>
              <Text style={securityTextStyle}>
                🔒 Your information is secure and will never be shared
              </Text>
            </div>
          </Card>

          {/* Help Section */}
          <div style={helpStyle}>
            <Text style={helpTextStyle}>
              Questions about getting started?{' '}
              <Link style={helpLinkStyle}>
                We're here to help
              </Link>
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Signup;