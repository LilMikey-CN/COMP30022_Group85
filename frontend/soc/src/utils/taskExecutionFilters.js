export const TASK_EXECUTION_DEFAULT_FILTERS = Object.freeze({
  searchTerm: '',
  statusFilter: 'all',
  startDateRange: null,
  yearFilter: 'current',
});

export const TASK_EXECUTION_DEFAULT_SORT = Object.freeze({
  field: 'scheduled_date',
  order: 'ascend',
});

export const TASK_EXECUTION_DEFAULT_PAGINATION = Object.freeze({
  current: 1,
  pageSize: 10,
});

export const buildTaskExecutionDefaultSort = () => ({ ...TASK_EXECUTION_DEFAULT_SORT });

export const buildTaskExecutionDefaultPagination = () => ({ ...TASK_EXECUTION_DEFAULT_PAGINATION });

export const isTaskExecutionFilterStateDefault = ({
  searchTerm,
  statusFilter,
  startDateRange,
  yearFilter,
  sortConfig,
}) => {
  const sortMatches =
    sortConfig?.field === TASK_EXECUTION_DEFAULT_SORT.field &&
    sortConfig?.order === TASK_EXECUTION_DEFAULT_SORT.order;

  return (
    searchTerm === TASK_EXECUTION_DEFAULT_FILTERS.searchTerm &&
    statusFilter === TASK_EXECUTION_DEFAULT_FILTERS.statusFilter &&
    startDateRange === TASK_EXECUTION_DEFAULT_FILTERS.startDateRange &&
    yearFilter === TASK_EXECUTION_DEFAULT_FILTERS.yearFilter &&
    sortMatches
  );
};
