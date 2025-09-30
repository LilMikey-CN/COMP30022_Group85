import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Typography, Avatar, Space, message } from 'antd';
import useAuthStore from '../../store/authStore';
import { useUserProfile } from '../../hooks/useUserProfile';
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
 * Main application navigation sidebar
 * **/
const PatientSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { data: userData } = useUserProfile();

  // Get user display information
  const getUserDisplayName = () => {
    // First priority: user profile displayName
    if (userData?.displayName) {
      return userData.displayName;
    }
    // Second priority: auth user displayName
    if (user?.displayName) {
      return user.displayName;
    }
    // Third priority: email prefix
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    const words = displayName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const menuItems = [
    {
      key: 'home',
      path: '/home',
      icon: <HomeOutlined />,
      label: 'Home'
    },
    {
      key: 'calendar',
      path: '/calendar',
      icon: <CalendarOutlined />,
      label: 'Calendar'
    },
    {
      key: 'list',
      path: '/list',
      icon: <UnorderedListOutlined />,
      label: 'List'
    },
    {
      key: 'budget',
      path: '/budget',
      icon: <DollarOutlined />,
      label: 'Budget'
    },
    {
      key: 'profile',
      path: '/profile',
      icon: <UserOutlined />,
      label: 'Client Profile'
    },
    {
      key: 'settings',
      path: '/settings',
      icon: <SettingFilled />,
      label: 'Settings'
    }
  ];

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        message.success('Logged out successfully');
        navigate('/login');
      } else {
        message.error(result.error || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      message.error('An unexpected error occurred during logout');
    }
  };

  // Commented out since back button is commented out - may need later
  // const handleBackToPatients = () => {
  //   navigate('/');
  // };

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

      {/* User Info */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#ffffff'
      }}>
        <Space>
          <Avatar
            size={40}
            icon={!userData?.avatar_url ? <UserOutlined /> : undefined}
            src={userData?.avatar_url}
            style={{
              backgroundColor: userData?.avatar_url ? 'transparent' : '#b8b8b8',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {!userData?.avatar_url && getUserInitials()}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: '14px' }}>
              {getUserDisplayName()}
            </Text>
          </div>
        </Space>
      </div>

      {/* Back to Patients Button - Commented out for now, may need later */}
      {/*
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
      */}

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
