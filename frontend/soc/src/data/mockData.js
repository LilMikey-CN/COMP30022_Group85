// Mock patient data for the dashboard
export const patientsData = [
  {
    id: 'PT-2025-02-001',
    name: 'Mary Poppins',
    initials: 'MP',
    age: 40,
    email: 'spoonful.of.sugar@gmail.com',
    mobile: '04 8888 8888',
    notes: 'Prefers morning treatments'
  },
  {
    id: 'PT-2025-02-002',
    name: 'John Smith',
    initials: 'JS',
    age: 65,
    email: 'john.smith@gmail.com',
    mobile: '04 7777 7777',
    notes: 'Requires wheelchair access'
  },
  {
    id: 'PT-2025-02-003',
    name: 'Sarah Johnson',
    initials: 'SJ',
    age: 72,
    email: 'sarah.j@gmail.com',
    mobile: '04 6666 6666',
    notes: 'Afternoon appointments only'
  },
  {
    id: 'PT-2025-02-004',
    name: 'Robert Brown',
    initials: 'RB',
    age: 55,
    email: 'r.brown@gmail.com',
    mobile: '04 5555 5555',
    notes: 'Diabetic - monitor sugar levels'
  },
  {
    id: 'PT-2025-02-005',
    name: 'Emma Wilson',
    initials: 'EW',
    age: 78,
    email: 'emma.wilson@gmail.com',
    mobile: '04 4444 4444',
    notes: 'Hard of hearing'
  },
  {
    id: 'PT-2025-02-006',
    name: 'Michael Davis',
    initials: 'MD',
    age: 62,
    email: 'm.davis@gmail.com',
    mobile: '04 3333 3333',
    notes: 'Allergic to latex'
  },
  {
    id: 'PT-2025-02-007',
    name: 'Lisa Martinez',
    initials: 'LM',
    age: 45,
    email: 'lisa.m@gmail.com',
    mobile: '04 2222 2222',
    notes: 'Spanish speaking preferred'
  },
  {
    id: 'PT-2025-02-008',
    name: 'James Taylor',
    initials: 'JT',
    age: 68,
    email: 'j.taylor@gmail.com',
    mobile: '04 1111 1111',
    notes: 'Weekly physiotherapy'
  },
  {
    id: 'PT-2025-02-009',
    name: 'Patricia Anderson',
    initials: 'PA',
    age: 80,
    email: 'p.anderson@gmail.com',
    mobile: '04 9999 9999',
    notes: 'Lives alone - check welfare'
  }
];

// Care items mock data
export const careItemsData = [
  {
    id: 'CI-001',
    action: 'Review',
    item: 'Replace toothbrush',
    status: 'Active',
    dueDate: '2025-08-28',
    category: 'Hygiene',
    cycle: '6 months',
    cost: '$30',
    priority: 'Medium'
  },
  {
    id: 'CI-002',
    action: 'Review',
    item: 'Replace bedsheets',
    status: 'Overdue',
    dueDate: '2025-08-05',
    category: 'Hygiene',
    cycle: '6 months',
    cost: '$20',
    priority: 'Low'
  },
  {
    id: 'CI-003',
    action: 'Review',
    item: 'New socks',
    status: 'Active',
    dueDate: '2025-09-03',
    category: 'Clothing',
    cycle: '1 year',
    cost: '$20',
    priority: 'Low'
  },
  {
    id: 'CI-004',
    action: 'Review',
    item: 'Dental visit',
    status: 'Active',
    dueDate: '2025-09-24',
    category: 'Medical',
    cycle: '6 months',
    cost: '$100',
    priority: 'High'
  },
  {
    id: 'CI-005',
    action: 'Review',
    item: 'Physical exam',
    status: 'Completed',
    dueDate: '2025-07-03',
    category: 'Medical',
    cycle: '3 months',
    cost: '$30',
    priority: 'High'
  },
  {
    id: 'CI-006',
    action: 'Review',
    item: 'Medication refill',
    status: 'Active',
    dueDate: '2025-09-15',
    category: 'Medical',
    cycle: '1 month',
    cost: '$45',
    priority: 'High'
  },
  {
    id: 'CI-007',
    action: 'Review',
    item: 'Blood pressure check',
    status: 'Active',
    dueDate: '2025-09-10',
    category: 'Medical',
    cycle: '2 weeks',
    cost: '$25',
    priority: 'Medium'
  },
  {
    id: 'CI-008',
    action: 'Review',
    item: 'Replace air filter',
    status: 'Overdue',
    dueDate: '2025-08-01',
    category: 'Hygiene',
    cycle: '3 months',
    cost: '$15',
    priority: 'Low'
  }
];

// add more mock data here as needed
export const userInfo = {
  name: 'Admin User',
  role: 'Administrator',
  email: 'admin@healthcare.com'
};
