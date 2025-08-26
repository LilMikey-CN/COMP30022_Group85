import Dashboard from '../pages/Dashboard';
// Import other pages as you create them
// import PatientDetails from '../pages/PatientDetails';
// import Schedule from '../pages/Schedule';
// import Settings from '../pages/Settings';

// Route configuration
export const routes = [
  {
    path: '/',
    element: Dashboard,
    name: 'Dashboard',
    exact: true
  },
  {
    path: '/patients',
    redirect: '/',
    name: 'Patients'
  },
  // Add more routes as needed
  // {
  //   path: '/patients/:id',
  //   element: PatientDetails,
  //   name: 'Patient Details'
  // },
  // {
  //   path: '/schedule',
  //   element: Schedule,
  //   name: 'Schedule'
  // },
  // {
  //   path: '/settings',
  //   element: Settings,
  //   name: 'Settings'
  // }
];

// Navigation menu configuration
export const navigationItems = [
  {
    key: 'patients',
    path: '/',
    label: 'Patients',
    icon: 'HomeOutlined'
  },
  // Add more navigation items as needed
  // {
  //   key: 'schedule',
  //   path: '/schedule',
  //   label: 'Schedule',
  //   icon: 'CalendarOutlined'
  // },
  // {
  //   key: 'settings',
  //   path: '/settings',
  //   label: 'Settings',
  //   icon: 'SettingOutlined'
  // }
];
