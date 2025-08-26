// Color scheme
export const COLORS = {
  primary: '#1890ff',
  secondary: '#6b8cae',
  secondaryHover: '#5a7a9a',
  background: '#ffffff',
  sidebarBg: '#f5f7fa',
  textPrimary: '#595959',
  textSecondary: '#8c8c8c',
  border: '#e8e8e8',
  avatarBg: '#b8b8b8',
  headerText: '#5a7a9a'
};

// Layout dimensions
export const LAYOUT = {
  sidebarWidth: 240,
  contentPadding: 24,
  cardMinWidth: 350,
  maxContentWidth: 1200
};

// API endpoints (for future use)
export const API_ENDPOINTS = {
  patients: '/api/patients',
  schedule: '/api/schedule',
  auth: '/api/auth'
};

// Application metadata
export const APP_INFO = {
  name: 'Scheduling of Care',
  version: '1.0.0',
  company: 'Healthcare Solutions'
};

// Date formats
export const DATE_FORMATS = {
  display: 'DD/MM/YYYY',
  api: 'YYYY-MM-DD',
  time: 'HH:mm',
  datetime: 'DD/MM/YYYY HH:mm'
};

// Status types (for future use)
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// User roles (for future use)
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient'
};
