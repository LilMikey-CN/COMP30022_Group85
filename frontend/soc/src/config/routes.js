import Dashboard from '../pages/Dashboard';
import PatientLayout from '../components/Layout/PatientLayout';
import PatientHome from '../pages/PatientHome';
import CareTasksPage from '../pages/CareTasksPage';
import TaskSchedulingPage from '../pages/TaskSchedulingPage';
import Budget from '../pages/Budget';
import ClientProfile from '../pages/ClientProfile';
import Settings from '../pages/Settings';
import CalendarPage from '../pages/CalendarPage';

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
        element: CalendarPage,
        name: 'Patient Calendar'
      },
      {
        path: 'care-tasks',
        element: CareTasksPage,
        name: 'Care Tasks'
      },
      {
        path: 'task-scheduling',
        element: TaskSchedulingPage,
        name: 'Task Scheduling'
      },
      {
        path: 'budget',
        element: Budget,
        name: 'Patient Budget'
      },
      {
        path: 'info',
        element: ClientProfile,
        name: 'Client Profile'
      },
      {
        path: 'settings',
        element: Settings,
        name: 'Settings'
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
