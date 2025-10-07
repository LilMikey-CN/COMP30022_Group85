import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Layout/Sidebar';
import PatientLayout from './components/Layout/PatientLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientHome from './pages/PatientHome';
import CareTasksPage from './pages/CareTasksPage';
import TaskSchedulingPage from './pages/TaskSchedulingPage';
import Budget from './pages/Budget';
import ClientProfile from './pages/ClientProfile';
import Settings from './pages/Settings';
import CalendarPage from './pages/CalendarPage';
import useAuthStore from './store/authStore';
import './styles/global.css';

const { Content } = Layout;

// Component to redirect authenticated users to their home
const HomeRedirect = () => {
  const { user } = useAuthStore();

  if (user?.uid) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/login" replace />;
};

const App = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        {/* Landing page route */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Root route - redirect to user's patient home */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />

        {/* Development-only dashboard route (not accessible through UI) */}
        <Route
          path="/dev/dashboard"
          element={
            <ProtectedRoute>
              <Layout style={{ minHeight: '100vh' }}>
                <Sidebar />
                <Layout style={{ marginLeft: 240, background: '#ffffff' }}>
                  <Content style={{ background: '#ffffff' }}>
                    <Dashboard />
                  </Content>
                </Layout>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirect legacy routes */}
        <Route path="/patients" element={<Navigate to="/" replace />} />

        {/* Main application routes with sidebar */}
        <Route path="/home" element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PatientHome />} />
        </Route>
        <Route path="/calendar" element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CalendarPage />} />
        </Route>
        <Route path="/care-tasks" element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CareTasksPage />} />
        </Route>
        <Route path="/task-scheduling" element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TaskSchedulingPage />} />
        </Route>
        <Route path="/budget" element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Budget />} />
        </Route>
        <Route path="/profile" element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ClientProfile />} />
        </Route>
        <Route path="/settings" element={
          <ProtectedRoute>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
