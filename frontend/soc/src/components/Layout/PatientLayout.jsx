import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Layout } from 'antd';
import PatientSidebar from './PatientSidebar';
import { patientsData } from '../../data/mockData';

const { Content } = Layout;

/**
 * Layout wrapper for patient pages
 * **/
const PatientLayout = () => {
  const { patientId } = useParams();

  // Get patient data (in real app, this would be an API call)
  const patient = patientsData.find(p => p.id === patientId) || patientsData[0];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <PatientSidebar />
      <Layout style={{ marginLeft: 240, background: '#ffffff' }}>
        <Content style={{ background: '#ffffff' }}>
          <Outlet context={{ patient }} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default PatientLayout;
