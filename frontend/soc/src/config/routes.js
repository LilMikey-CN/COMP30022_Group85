import Dashboard from '../pages/Dashboard';
import PatientLayout from '../components/Layout/PatientLayout';
import PatientHome from '../pages/PatientHome';
import {
  PatientCalendar,
  PatientList,
  PatientBudget,
  PatientInfo,
  PatientSettings
} from '../pages/PatientPlaceholders';

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
  {
    path: '/patient/:patientId',
    element: PatientLayout,
    name: 'Patient',
    children: [
      {
        path: '',
        element: PatientHome,
        name: 'Patient Home'
      },
      {
        path: 'calendar',
        element: PatientCalendar,
        name: 'Patient Calendar'
      },
      {
        path: 'list',
        element: PatientList,
        name: 'Patient List'
      },
      {
        path: 'budget',
        element: PatientBudget,
        name: 'Patient Budget'
      },
      {
        path: 'info',
        element: PatientInfo,
        name: 'Patient Info'
      },
      {
        path: 'settings',
        element: PatientSettings,
        name: 'Patient Settings'
      }
    ]
  }
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
