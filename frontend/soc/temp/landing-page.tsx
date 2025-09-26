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
import heroImage from '../assets/hero-care-family.jpg';

const { Title, Paragraph, Text } = Typography;

const Index = () => {
  const features = [
    {
      icon: <ScheduleOutlined className="text-4xl text-care-primary" />,
      title: "Simple Scheduling",
      description: "Create and manage care tasks like changing bedsheets, medication reminders, and daily routines with easy-to-use scheduling tools."
    },
    {
      icon: <DollarOutlined className="text-4xl text-care-secondary" />,
      title: "Budget Tracking",
      description: "Keep track of care-related expenses by category. See exactly how much you're spending on medical supplies, equipment, and services."
    },
    {
      icon: <CheckCircleOutlined className="text-4xl text-care-accent" />,
      title: "Task Management",
      description: "Mark tasks as complete, set recurring schedules, and never miss important care activities. Perfect for managing complex care routines."
    },
    {
      icon: <TeamOutlined className="text-4xl text-care-warm" />,
      title: "Family Coordination",
      description: "Share care responsibilities with family members and caregivers. Everyone stays informed and can contribute to your loved one's care."
    }
  ];

  const benefits = [
    {
      icon: <HeartOutlined className="text-2xl text-care-primary" />,
      title: "Peace of Mind",
      description: "Know that nothing important is forgotten and all care needs are being met consistently."
    },
    {
      icon: <CalendarOutlined className="text-2xl text-care-secondary" />,
      title: "Better Organization",
      description: "Transform overwhelming care routines into manageable, organized schedules that work for your family."
    },
    {
      icon: <PieChartOutlined className="text-2xl text-care-accent" />,
      title: "Financial Clarity",
      description: "Understand your care-related expenses and plan your budget more effectively with detailed spending insights."
    },
    {
      icon: <SafetyOutlined className="text-2xl text-care-warm" />,
      title: "Consistent Care",
      description: "Ensure your loved one receives consistent, quality care even when different family members are helping."
    }
  ];

  return (
    <div className="min-h-screen bg-care-background">
      {/* Hero Section */}
      <section className="hero-gradient relative min-h-screen flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(46, 163, 242, 0.8), rgba(34, 197, 94, 0.8)), url(${heroImage})`,
          }}
        />
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <Title level={1} className="hero-text text-5xl md:text-6xl mb-6 leading-tight">
              Caring Made Simple
            </Title>
            <Title level={2} className="hero-text text-xl md:text-2xl font-normal mb-8 opacity-90">
              Help your loved ones with special needs by organizing care tasks and tracking expenses—all in one friendly, easy-to-use place.
            </Title>
            <Space size="large" className="flex flex-col sm:flex-row justify-center">
              <Button
                type="primary"
                size="large"
                className="btn-care-warm text-lg px-8 py-6 h-auto"
              >
                Start Organizing Care
              </Button>
              <Button
                size="large"
                className="text-white border-white hover:bg-white hover:text-care-primary text-lg px-8 py-6 h-auto"
              >
                Learn More
              </Button>
            </Space>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-care-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Title level={2} className="text-4xl mb-4 text-care-neutral">
              Everything You Need for Better Care
            </Title>
            <Paragraph className="text-lg text-care-neutral opacity-70 max-w-2xl mx-auto">
              Our simple tools help families manage care responsibilities without the stress and confusion.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} className="max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Col xs={24} md={12} key={index}>
                <Card className="feature-card h-full text-center border-0">
                  <div className="feature-icon mx-auto">
                    {feature.icon}
                  </div>
                  <Title level={3} className="text-xl mb-4 text-care-neutral">
                    {feature.title}
                  </Title>
                  <Paragraph className="text-care-neutral opacity-70">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-care-surface">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Title level={2} className="text-4xl mb-4 text-care-neutral">
              Why Families Choose Scheduling of Care
            </Title>
            <Paragraph className="text-lg text-care-neutral opacity-70 max-w-2xl mx-auto">
              Join hundreds of families who have transformed their care routines with our simple, caring approach.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} className="max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <Col xs={24} sm={12} key={index}>
                <div className="flex items-start space-x-4 p-6">
                  <div className="flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <Title level={4} className="text-lg mb-2 text-care-neutral">
                      {benefit.title}
                    </Title>
                    <Paragraph className="text-care-neutral opacity-70 mb-0">
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
      <section className="py-20 bg-care-background">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <Title level={2} className="text-4xl mb-6 text-care-neutral">
              Ready to Make Care Easier?
            </Title>
            <Paragraph className="text-lg text-care-neutral opacity-70 mb-8">
              Start organizing your loved one's care today. No complicated setup—just simple tools that work for your family.
            </Paragraph>

            <Space size="large" className="flex flex-col sm:flex-row justify-center">
              <Button
                type="primary"
                size="large"
                className="btn-care-primary text-lg px-8 py-6 h-auto"
              >
                Get Started Free
              </Button>
              <Button
                size="large"
                className="border-care-primary text-care-primary hover:bg-care-primary hover:text-white text-lg px-8 py-6 h-auto"
              >
                Schedule a Demo
              </Button>
            </Space>

            <Divider className="my-12" />

            <div className="text-center">
              <Text className="text-care-neutral opacity-50">
                Made with ❤️ for families who care
              </Text>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
