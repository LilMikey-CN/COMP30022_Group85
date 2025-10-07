// Mock task schedule data for patients
export const taskScheduleData = {
  default: {
    todayCount: 0,
    overdueCount: 1,
    budgetRemaining: 4800.00,
    budgetSpent: 200,
    budgetTotal: 5000,
    upcomingTasks: [
      {
        id: '1',
        title: 'Replace toothbrush',
        date: 'Aug 28 2025',
        daysUntil: 2
      },
      {
        id: '2',
        title: 'New socks',
        date: 'Sep 3 2025',
        daysUntil: 8
      },
      {
        id: '3',
        title: 'Dental visit',
        date: 'Sep 24 2025',
        daysUntil: 29
      }
    ],
    overdueTasks: [
      {
        id: '4',
        title: 'Replace bed sheets',
        date: 'Aug 5 2025',
        daysOverdue: 21
      }
    ]
  },
  'PT-2025-02-001': {
    todayCount: 0,
    overdueCount: 1,
    budgetRemaining: 4800.00,
    budgetSpent: 200,
    budgetTotal: 5000,
    upcomingTasks: [
      {
        id: '1',
        title: 'Replace toothbrush',
        date: 'Aug 28 2025',
        daysUntil: 2
      },
      {
        id: '2',
        title: 'New socks',
        date: 'Sep 3 2025',
        daysUntil: 8
      },
      {
        id: '3',
        title: 'Dental visit',
        date: 'Sep 24 2025',
        daysUntil: 29
      }
    ],
    overdueTasks: [
      {
        id: '4',
        title: 'Replace bed sheets',
        date: 'Aug 5 2025',
        daysOverdue: 21
      }
    ]
  },
  'PT-2025-02-002': {
    todayCount: 2,
    overdueCount: 0,
    budgetRemaining: 3200.00,
    budgetSpent: 800,
    budgetTotal: 4000,
    upcomingTasks: [
      {
        id: '1',
        title: 'Physical therapy session',
        date: 'Aug 26 2025',
        daysUntil: 0
      },
      {
        id: '2',
        title: 'Medication refill',
        date: 'Aug 26 2025',
        daysUntil: 0
      },
      {
        id: '3',
        title: 'Blood pressure check',
        date: 'Sep 1 2025',
        daysUntil: 6
      }
    ],
    overdueTasks: []
  },
  'PT-2025-02-003': {
    todayCount: 1,
    overdueCount: 2,
    budgetRemaining: 6500.00,
    budgetSpent: 1500,
    budgetTotal: 8000,
    upcomingTasks: [
      {
        id: '1',
        title: 'Weekly nurse visit',
        date: 'Aug 27 2025',
        daysUntil: 1
      },
      {
        id: '2',
        title: 'Prescription renewal',
        date: 'Sep 5 2025',
        daysUntil: 10
      }
    ],
    overdueTasks: [
      {
        id: '3',
        title: 'Eye examination',
        date: 'Aug 10 2025',
        daysOverdue: 16
      },
      {
        id: '4',
        title: 'Hearing aid check',
        date: 'Aug 15 2025',
        daysOverdue: 11
      }
    ]
  }
};

// Calendar events for the calendar view (future implementation)
export const calendarEvents = [
  {
    id: '1',
    title: 'Replace toothbrush',
    start: '2025-08-28',
    end: '2025-08-28',
    type: 'task',
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'New socks',
    start: '2025-09-03',
    end: '2025-09-03',
    type: 'task',
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'Dental visit',
    start: '2025-09-24',
    end: '2025-09-24',
    type: 'appointment',
    status: 'upcoming'
  },
  {
    id: '4',
    title: 'Replace bed sheets',
    start: '2025-08-05',
    end: '2025-08-05',
    type: 'task',
    status: 'overdue'
  }
];
