import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Typography } from 'antd';
import {
  SettingOutlined,
  HomeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { navigationItems } from '../../config/routes';
import LogoutButton from './LogoutButton';

const { Sider } = Layout;
const { Text } = Typography;

// Icon mapping
const iconComponents = {
  HomeOutlined: <HomeOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  SettingOutlined: <SettingOutlined />
};

const Sidebar = () => {
  const location = useLocation();

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

      {/* Menu Items */}
      <div style={{ flex: 1, paddingTop: '8px' }}>
        {navigationItems.map(item => (
          <Link key={item.key} to={item.path} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: location.pathname === item.path ? '#e6f4ff' : 'transparent',
              borderLeft: location.pathname === item.path ? '3px solid #1890ff' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              <span style={{
                fontSize: '18px',
                color: location.pathname === item.path ? '#1890ff' : '#595959'
              }}>
                {iconComponents[item.icon]}
              </span>
              <Text style={{
                fontSize: '15px',
                color: location.pathname === item.path ? '#1890ff' : '#595959',
                fontWeight: location.pathname === item.path ? '500' : 'normal'
              }}>
                {item.label}
              </Text>
            </div>
          </Link>
        ))}
      </div>

      {/* Logout Button */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e8e8e8'
      }}>
        <LogoutButton
          style={{
            justifyContent: 'flex-start',
            padding: '8px 12px',
            height: '40px',
            backgroundColor: '#6b8cae',
            color: 'white',
            fontWeight: '500',
            borderRadius: '4px'
          }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
