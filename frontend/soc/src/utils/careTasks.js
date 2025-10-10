import dayjs from 'dayjs';

export const describeRecurrence = (interval) => {
  const numeric = Number(interval ?? 0);
  if (numeric === 0) {
    return 'One-off';
  }
  if (numeric === 1) {
    return 'Every day';
  }
  if (numeric === 7) {
    return 'Every week';
  }
  if (numeric === 14) {
    return 'Every 2 weeks';
  }
  if (numeric === 30) {
    return 'Every month';
  }
  if (numeric === 90) {
    return 'Every quarter';
  }
  if (numeric === 365) {
    return 'Every year';
  }
  return `Every ${numeric} days`;
};

export const buildCategoryMap = (categories = []) => {
  const map = new Map();
  categories.forEach((category) => {
    if (category?.id) {
      map.set(category.id, {
        name: category.name,
        color: category.color_code || category.color || undefined,
      });
    }
  });
  return map;
};

export const filterCareTasks = (
  tasks = [],
  {
    searchTerm = '',
    statusFilter = 'all',
    typeFilter = 'all',
    startRange = null
  } = {}
) => {
  const lowered = searchTerm.trim().toLowerCase();

  return tasks.filter((task) => {
    if (lowered) {
      const name = task.name?.toLowerCase() || '';
      const description = task.description?.toLowerCase() || '';
      if (!name.includes(lowered) && !description.includes(lowered)) {
        return false;
      }
    }

    if (statusFilter === 'active' && task.is_active === false) {
      return false;
    }
    if (statusFilter === 'inactive' && task.is_active !== false) {
      return false;
    }

    if (typeFilter !== 'all' && task.task_type !== typeFilter) {
      return false;
    }

    if (startRange && startRange.length === 2) {
      const [from, to] = startRange;
      if (from && task.start_date && dayjs(task.start_date).isBefore(dayjs(from), 'day')) {
        return false;
      }
      if (to && task.start_date && dayjs(task.start_date).isAfter(dayjs(to), 'day')) {
        return false;
      }
    }

    return true;
  });
};

export const sortCareTasks = (tasks = [], sortConfig, categoryMap) => {
  if (!sortConfig) {
    return tasks;
  }

  const { field, order } = sortConfig;

  const getValue = (task) => {
    switch (field) {
      case 'name':
        return (task.name || '').toLowerCase();
      case 'task_type':
        return task.task_type || '';
      case 'category': {
        const category = categoryMap.get(task.category_id);
        return category?.name?.toLowerCase?.() || '';
      }
      case 'yearly_budget':
        return Number(task.yearly_budget ?? -Infinity);
      case 'recurrence_interval_days':
        return Number(task.recurrence_interval_days ?? 0);
      case 'start_date':
        return task.start_date ? dayjs(task.start_date).valueOf() : -Infinity;
      case 'end_date':
        return task.end_date ? dayjs(task.end_date).valueOf() : Number.MAX_SAFE_INTEGER;
      case 'status':
        return task.is_active === false ? 0 : 1;
      case 'created_at':
      default:
        return task.created_at ? dayjs(task.created_at).valueOf() : -Infinity;
    }
  };

  return [...tasks].sort((a, b) => {
    const valueA = getValue(a);
    const valueB = getValue(b);

    if (valueA === valueB) {
      return 0;
    }

    if (order === 'ascend') {
      return valueA > valueB ? 1 : -1;
    }
    return valueA > valueB ? -1 : 1;
  });
};
