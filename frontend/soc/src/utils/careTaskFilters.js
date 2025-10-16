export const CARE_TASK_DEFAULT_FILTERS = Object.freeze({
  searchTerm: '',
  statusFilter: 'all',
  typeFilter: 'all',
  startRange: null,
  yearFilter: 'current',
});

export const CARE_TASK_DEFAULT_SORT = Object.freeze({
  field: 'created_at',
  order: 'descend',
});

export const CARE_TASK_DEFAULT_PAGINATION = Object.freeze({
  current: 1,
  pageSize: 10,
});

export const buildCareTaskDefaultSort = () => ({ ...CARE_TASK_DEFAULT_SORT });

export const buildCareTaskDefaultPagination = () => ({ ...CARE_TASK_DEFAULT_PAGINATION });

export const isCareTaskFilterStateDefault = ({
  searchTerm,
  statusFilter,
  typeFilter,
  startRange,
  yearFilter,
  sortConfig,
}) => {
  const sortMatches =
    sortConfig?.field === CARE_TASK_DEFAULT_SORT.field &&
    sortConfig?.order === CARE_TASK_DEFAULT_SORT.order;

  return (
    searchTerm === CARE_TASK_DEFAULT_FILTERS.searchTerm &&
    statusFilter === CARE_TASK_DEFAULT_FILTERS.statusFilter &&
    typeFilter === CARE_TASK_DEFAULT_FILTERS.typeFilter &&
    startRange === CARE_TASK_DEFAULT_FILTERS.startRange &&
    yearFilter === CARE_TASK_DEFAULT_FILTERS.yearFilter &&
    sortMatches
  );
};
