import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Layout/Sidebar';
import { routes } from './config/routes';
import './styles/global.css';

const { Content } = Layout;

const App = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout style={{ marginLeft: 240, background: '#ffffff' }}>
          <Content style={{ background: '#ffffff' }}>
            <Routes>
              {routes.map((route) => {
                if (route.redirect) {
                  return (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={<Navigate to={route.redirect} replace />}
                    />
                  );
                }
                const Component = route.element;
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<Component />}
                  />
                );
              })}
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;

