import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Layout, Button, Typography, Avatar, Space } from 'antd';
import {
  SettingOutlined,
  HomeOutlined,
  LogoutOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  DollarOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  SettingFilled
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

/**
 * Patient-specific navigation sidebar
 * **/
const PatientSidebar = ({ patient }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();

  const menuItems = [
    {
      key: 'home',
      path: `/patient/${patientId}`,
      icon: <HomeOutlined />,
      label: 'Home'
    },
    {
      key: 'calendar',
      path: `/patient/${patientId}/calendar`,
      icon: <CalendarOutlined />,
      label: 'Calendar'
    },
    {
      key: 'list',
      path: `/patient/${patientId}/list`,
      icon: <UnorderedListOutlined />,
      label: 'List'
    },
    {
      key: 'budget',
      path: `/patient/${patientId}/budget`,
      icon: <DollarOutlined />,
      label: 'Budget'
    },
    {
      key: 'info',
      path: `/patient/${patientId}/info`,
      icon: <UserOutlined />,
      label: 'Patient Info'
    },
    {
      key: 'settings',
      path: `/patient/${patientId}/settings`,
      icon: <SettingFilled />,
      label: 'Settings'
    }
  ];

  const handleLogout = () => {
    console.log('Logging out...');
    navigate('/');
  };

  const handleBackToPatients = () => {
    navigate('/');
  };

  return (
    <Sider
      width={240}
      style={{
        background: '#f5f7fa',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: '1px solid #e8e8e8'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <SettingOutlined style={{ fontSize: '20px', color: '#595959' }} />
        <Text strong style={{ fontSize: '16px', color: '#595959' }}>
          Scheduling of Care
        </Text>
      </div>

      {/* Patient Info */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#ffffff'
      }}>
        <Space>
          <Avatar
            size={40}
            style={{
              backgroundColor: '#b8b8b8',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {patient?.initials || 'MP'}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: '14px' }}>
              {patient?.name || 'Mary Poppins'}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {patient?.id || 'PT-2025-02'}
            </Text>
          </div>
        </Space>
      </div>

      {/* Back to Patients Button */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          block
          onClick={handleBackToPatients}
          style={{
            justifyContent: 'flex-start',
            padding: '8px 12px',
            height: '36px',
            color: '#595959',
            backgroundColor: '#e8e8e8',
            fontWeight: '500',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#d9d9d9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e8e8e8';
          }}
        >
          Back to Patients
        </Button>
      </div>

      {/* Menu Items */}
      <div style={{ flex: 1, paddingTop: '8px' }}>
        {menuItems.map(item => (
          <div
            key={item.key}
            onClick={() => navigate(item.path)}
            style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: location.pathname === item.path ? '#e6f4ff' : 'transparent',
              borderLeft: location.pathname === item.path ? '3px solid #1890ff' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <span style={{
              fontSize: '18px',
              color: location.pathname === item.path ? '#1890ff' : '#595959'
            }}>
              {item.icon}
            </span>
            <Text style={{
              fontSize: '15px',
              color: location.pathname === item.path ? '#1890ff' : '#595959',
              fontWeight: location.pathname === item.path ? '500' : 'normal'
            }}>
              {item.label}
            </Text>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e8e8e8'
      }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          block
          onClick={handleLogout}
          style={{
            justifyContent: 'flex-start',
            padding: '8px 12px',
            height: '40px',
            backgroundColor: '#6b8cae',
            color: 'white',
            fontWeight: '500',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5a7a9a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b8cae';
          }}
        >
          Logout
        </Button>
      </div>
    </Sider>
  );
};

export default PatientSidebar;
