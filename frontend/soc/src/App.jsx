import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Layout/Sidebar';
import PatientLayout from './components/Layout/PatientLayout';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientHome from './pages/PatientHome';
import CareItemsListPage from './pages/CareItemsListPage';
import Budget from './pages/Budget';
import ClientProfile from './pages/ClientProfile';
import {
  PatientCalendar,
  PatientSettings
} from './pages/PatientPlaceholders';
import './styles/global.css';

const { Content } = Layout;

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Landing page route */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

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
          <Route path="list" element={<CareItemsListPage />} />
          <Route path="budget" element={<Budget />} />
          <Route path="info" element={<ClientProfile />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
