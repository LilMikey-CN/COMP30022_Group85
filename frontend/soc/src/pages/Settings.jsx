import React, { useState } from 'react';
import { Typography, Card, Row, Col, Spin, Alert, Button, Avatar } from 'antd';
import { UserOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { useUserProfile, useUpdateUserProfile } from '../hooks/useUserProfile';
import { handleError, ERROR_TYPES } from '../utils/errorHandler.jsx';
import AccountSettingsModal from '../components/Settings/AccountSettingsModal';
import AvatarUploadModal from '../components/Settings/AvatarUploadModal';

const { Title, Text } = Typography;

const Settings = () => {
  // API hooks
  const { data: userData, isLoading, error, refetch } = useUserProfile();
  const updateUserProfile = useUpdateUserProfile();

  // Modal visibility states
  const [accountSettingsModalVisible, setAccountSettingsModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Profile exists check
  const profileExists = !!userData;

  // Modal handlers
  const openAccountSettingsModal = () => {
    setAccountSettingsModalVisible(true);
  };

  const closeAccountSettingsModal = () => {
    setAccountSettingsModalVisible(false);
  };

  const openAvatarModal = () => {
    setAvatarModalVisible(true);
  };

  const closeAvatarModal = () => {
    setAvatarModalVisible(false);
  };

  // Save handler for account settings
  const handleSaveAccountSettings = async (newData) => {
    try {
      await updateUserProfile.mutateAsync(newData);
      closeAccountSettingsModal();
    } catch (error) {
      handleError(error, ERROR_TYPES.MODAL, {
        title: 'Save Failed',
        context: 'Failed to save account settings',
        showDetails: true,
      });
    }
  };

  // Save handler for avatar upload
  const handleAvatarUploadSuccess = async (avatarUrl) => {
    try {
      await updateUserProfile.mutateAsync({ avatar_url: avatarUrl });
    } catch (error) {
      handleError(error, ERROR_TYPES.MODAL, {
        title: 'Avatar Update Failed',
        context: 'Failed to update avatar',
        showDetails: true,
      });
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const InfoCard = ({ title, children, style = {}, onEdit, isLoading = false }) => (
    <Card
      className="settings-info-card"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: '16px', fontWeight: '600', color: '#5a7a9a' }}>
            {title}
          </Text>
          {onEdit && (
            <EditOutlined
              className="edit-icon"
              style={{
                color: isLoading ? '#d9d9d9' : '#8c8c8c',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onClick={isLoading ? undefined : onEdit}
            />
          )}
        </div>
      }
      style={{
        height: '100%',
        backgroundColor: '#fafbfc',
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        ...style
      }}
      styles={{
        header: {
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid #e1e8ed'
        },
        body: { padding: '20px', backgroundColor: '#fafbfc' }
      }}
    >
      <Spin spinning={isLoading}>
        {children}
      </Spin>
    </Card>
  );

  const InfoField = ({ label, value }) => (
    <div style={{ marginBottom: '16px' }}>
      <Text style={{ color: '#8c8c8c', fontSize: '14px', display: 'block' }}>
        {label}
      </Text>
      <Text style={{ fontSize: '14px', fontWeight: '500' }}>
        {value || 'Not provided'}
      </Text>
    </div>
  );

  // Show loading spinner for initial load
  if (isLoading && !userData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
        <div style={{ marginLeft: 16, fontSize: '16px', color: '#666' }}>Loading settings...</div>
      </div>
    );
  }

  // Show error state only for genuine server errors, not "profile not found" cases
  if (error &&
      !error.message.includes('404') &&
      !error.message.includes('User not authenticated') &&
      !error.message.includes('fetch') &&
      !error.message.includes('Profile not found') &&
      !error.message.includes('not found') &&
      !error.message.toLowerCase().includes('404')) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Failed to Load Settings"
          description={error.message}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Settings
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {!profileExists
            ? 'Manage your account settings - Click edit to get started'
            : 'Manage your account preferences and profile information'
          }
        </Text>
      </div>

      {/* Account Settings Section */}
      <Row gutter={[20, 20]} style={{ marginBottom: '20px' }}>
        {/* Avatar Section */}
        <Col span={6}>
          <InfoCard title="Avatar" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Avatar
                size={120}
                icon={<UserOutlined />}
                src={userData?.avatar_url}
                style={{
                  backgroundColor: userData?.avatar_url ? 'transparent' : '#5a7a9a',
                  fontSize: '48px'
                }}
              />
              <Button
                type="primary"
                onClick={openAvatarModal}
                disabled={updateUserProfile.isPending}
                style={{ width: '140px' }}
              >
                Update Avatar
              </Button>
            </div>
          </InfoCard>
        </Col>

        {/* Account Settings Info */}
        <Col span={18}>
          <InfoCard
            title="Account Settings"
            onEdit={openAccountSettingsModal}
            isLoading={updateUserProfile.isPending}
          >
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <InfoField
                  label="Display Name"
                  value={userData?.displayName}
                />
                <InfoField
                  label="Email"
                  value={userData?.email}
                />
                <InfoField
                  label="Email Verified"
                  value={userData?.emailVerified ? 'Yes' : 'No'}
                />
              </Col>
              <Col span={12}>
                <InfoField
                  label="Mobile Phone"
                  value={userData?.mobile_phone}
                />
                <InfoField
                  label="Contact Address"
                  value={userData?.contact_address}
                />
              </Col>
            </Row>
          </InfoCard>
        </Col>
      </Row>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        visible={accountSettingsModalVisible}
        onCancel={closeAccountSettingsModal}
        onSave={handleSaveAccountSettings}
        initialData={userData}
        loading={updateUserProfile.isPending}
      />

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        visible={avatarModalVisible}
        onCancel={closeAvatarModal}
        currentAvatarUrl={userData?.avatar_url}
        onSuccess={handleAvatarUploadSuccess}
      />
    </div>
  );
};

export default Settings;