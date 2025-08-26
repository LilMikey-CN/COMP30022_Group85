import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Layout/Sidebar';
import PatientLayout from './components/Layout/PatientLayout';
import Dashboard from './pages/Dashboard';
import PatientHome from './pages/PatientHome';
import {
  PatientCalendar,
  PatientList,
  PatientBudget,
  PatientInfo,
  PatientSettings
} from './pages/PatientPlaceholders';
import './styles/global.css';

const { Content } = Layout;

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Main dashboard with sidebar */}
        <Route
          path="/"
          element={
            <Layout style={{ minHeight: '100vh' }}>
              <Sidebar />
              <Layout style={{ marginLeft: 240, background: '#ffffff' }}>
                <Content style={{ background: '#ffffff' }}>
                  <Dashboard />
                </Content>
              </Layout>
            </Layout>
          }
        />

        {/* Redirect /patients to root */}
        <Route path="/patients" element={<Navigate to="/" replace />} />

        {/* Patient routes with patient sidebar */}
        <Route path="/patient/:patientId" element={<PatientLayout />}>
          <Route index element={<PatientHome />} />
          <Route path="calendar" element={<PatientCalendar />} />
          <Route path="list" element={<PatientList />} />
          <Route path="budget" element={<PatientBudget />} />
          <Route path="info" element={<PatientInfo />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
