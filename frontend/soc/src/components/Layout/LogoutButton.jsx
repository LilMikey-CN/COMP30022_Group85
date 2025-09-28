import React from 'react';
import { Button, message } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const LogoutButton = ({ style }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        message.success('Logged out successfully');
        navigate('/login');
      } else {
        message.error(result.error || 'Logout failed');
      }
    } catch (error) { // eslint-disable-line no-unused-vars
      message.error('An unexpected error occurred');
    }
  };

  return (
    <Button
      type="text"
      icon={<LogoutOutlined />}
      onClick={handleLogout}
      style={{
        color: '#ff4d4f',
        width: '100%',
        textAlign: 'left',
        ...style
      }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;