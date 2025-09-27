import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import PatientSidebar from './PatientSidebar';

const { Content } = Layout;

/**
 * Layout wrapper for main application pages
 * **/
const PatientLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <PatientSidebar />
      <Layout style={{ marginLeft: 240, background: '#ffffff' }}>
        <Content style={{ background: '#ffffff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default PatientLayout;
