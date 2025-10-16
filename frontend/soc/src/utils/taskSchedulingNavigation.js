export const TASK_SCHEDULING_ROUTE = '/task-scheduling';

const TASK_SCHEDULING_STATE_KEY = 'taskSchedulingPrefill';

export const TASK_SCHEDULING_DEFAULT_SORT = {
  field: 'scheduled_date',
  order: 'ascend',
};

export const createTaskSchedulingNavigationState = (taskName = '') => ({
  [TASK_SCHEDULING_STATE_KEY]: {
    searchTerm: taskName?.trim() || '',
    sortConfig: { ...TASK_SCHEDULING_DEFAULT_SORT },
  },
});

export const extractTaskSchedulingPrefill = (state) =>
  state && state[TASK_SCHEDULING_STATE_KEY] ? state[TASK_SCHEDULING_STATE_KEY] : null;
