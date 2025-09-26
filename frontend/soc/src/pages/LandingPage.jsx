import React from 'react';
import { Button, Card, Row, Col, Typography, Space, Divider } from 'antd';
import {
  HeartOutlined,
  ScheduleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  PieChartOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import heroImage from '../../assets/hero-care-family.jpg';

const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
  const features = [
    {
      icon: <ScheduleOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      title: "Simple Scheduling",
      description: "Create and manage care tasks like changing bedsheets, medication reminders, and daily routines with easy-to-use scheduling tools."
    },
    {
      icon: <DollarOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      title: "Budget Tracking",
      description: "Keep track of care-related expenses by category. See exactly how much you're spending on medical supplies, equipment, and services."
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '48px', color: '#faad14' }} />,
      title: "Task Management",
      description: "Mark tasks as complete, set recurring schedules, and never miss important care activities. Perfect for managing complex care routines."
    },
    {
      icon: <TeamOutlined style={{ fontSize: '48px', color: '#f5222d' }} />,
      title: "Family Coordination",
      description: "Share care responsibilities with family members and caregivers. Everyone stays informed and can contribute to your loved one's care."
    }
  ];

  const benefits = [
    {
      icon: <HeartOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      title: "Peace of Mind",
      description: "Know that nothing important is forgotten and all care needs are being met consistently."
    },
    {
      icon: <CalendarOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      title: "Better Organization",
      description: "Transform overwhelming care routines into manageable, organized schedules that work for your family."
    },
    {
      icon: <PieChartOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
      title: "Financial Clarity",
      description: "Understand your care-related expenses and plan your budget more effectively with detailed spending insights."
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '32px', color: '#f5222d' }} />,
      title: "Consistent Care",
      description: "Ensure your loved one receives consistent, quality care even when different family members are helping."
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Hero Section */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: 'white',
          position: 'relative'
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '60px 40px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Title
              level={1}
              style={{
                color: 'white',
                fontSize: '60px',
                marginBottom: '24px',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                lineHeight: '1.1'
              }}
            >
              Caring Made Simple
            </Title>
            <Title
              level={2}
              style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: '400',
                marginBottom: '40px',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                lineHeight: '1.4'
              }}
            >
              Help your loved ones with special needs by organizing care tasks and tracking expenses—all in one friendly, easy-to-use place.
            </Title>
            <Space size="large" style={{ flexDirection: 'column' }}>
              <Button
                type="primary"
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                  border: 'none',
                  fontSize: '18px',
                  padding: '0 32px',
                  height: '56px',
                  borderRadius: '28px',
                  fontWeight: '600',
                  boxShadow: '0 4px 20px rgba(255, 77, 79, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(255, 77, 79, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 20px rgba(255, 77, 79, 0.4)';
                }}
              >
                Start Organizing Care
              </Button>
            </Space>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 0', background: '#fafafa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <Title level={2} style={{ fontSize: '48px', marginBottom: '16px', color: '#1f1f1f' }}>
              Everything You Need for Better Care
            </Title>
            <Paragraph style={{
              fontSize: '18px',
              color: '#4a4a4a',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Our simple tools help families manage care responsibilities without the stress and confusion.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} key={index}>
                <Card
                  style={{
                    height: '100%',
                    textAlign: 'center',
                    border: '1px solid #e8e8e8',
                    background: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ marginBottom: '24px' }}>
                    {feature.icon}
                  </div>
                  <Title level={3} style={{ fontSize: '20px', marginBottom: '16px', color: '#1f1f1f' }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ color: '#4a4a4a', fontSize: '16px' }}>
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: '80px 0', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <Title level={2} style={{ fontSize: '48px', marginBottom: '16px', color: '#1f1f1f' }}>
              Why Families Choose Scheduling of Care
            </Title>
            <Paragraph style={{
              fontSize: '18px',
              color: '#4a4a4a',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Join hundreds of families who have transformed their care routines with our simple, caring approach.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} style={{ maxWidth: '800px', margin: '0 auto' }}>
            {benefits.map((benefit, index) => (
              <Col xs={24} sm={12} key={index}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '32px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}>
                  <div style={{ marginRight: '20px', flexShrink: 0 }}>
                    {benefit.icon}
                  </div>
                  <div>
                    <Title level={4} style={{ fontSize: '18px', marginBottom: '8px', color: '#1f1f1f' }}>
                      {benefit.title}
                    </Title>
                    <Paragraph style={{ color: '#4a4a4a', marginBottom: 0, fontSize: '16px' }}>
                      {benefit.description}
                    </Paragraph>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={{ padding: '80px 0', background: '#fafafa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Title level={2} style={{ fontSize: '48px', marginBottom: '24px', color: '#1f1f1f' }}>
              Ready to Make Care Easier?
            </Title>
            <Paragraph style={{
              fontSize: '18px',
              color: '#4a4a4a',
              marginBottom: '32px'
            }}>
              Start organizing your loved one's care today. No complicated setup—just simple tools that work for your family.
            </Paragraph>

            <Button
              type="primary"
              size="large"
              style={{
                background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                border: 'none',
                fontSize: '18px',
                padding: '0 32px',
                height: '56px',
                borderRadius: '28px',
                fontWeight: '600',
                boxShadow: '0 4px 20px rgba(255, 77, 79, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(255, 77, 79, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(255, 77, 79, 0.4)';
              }}
            >
              Get Started Free
            </Button>

            <Divider style={{ margin: '48px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: '#8c8c8c' }}>
                Made with ❤️ for families who care
              </Text>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;