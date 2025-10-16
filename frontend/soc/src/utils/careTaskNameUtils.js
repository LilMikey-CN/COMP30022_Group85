export const normaliseTaskName = (value = '') =>
  value.trim().toLowerCase();

export const buildCareTaskNameSet = (tasks = [], referenceDate = new Date()) => {
  const set = new Set();
  const currentYear = new Date(referenceDate).getFullYear();
  tasks.forEach((task) => {
    const startDate = task?.start_date ? new Date(task.start_date) : null;
    if (!startDate || Number.isNaN(startDate.getTime()) || startDate.getFullYear() !== currentYear) {
      return;
    }
    const normalised = normaliseTaskName(task?.name || '');
    if (normalised) {
      set.add(normalised);
    }
  });
  return set;
};

export const createUniqueNameRule = (existingNames, currentName = '') => {
  const currentNormalised = normaliseTaskName(currentName);

  return (_, value) => {
    const normalised = normaliseTaskName(value || '');
    if (!normalised) {
      return Promise.resolve();
    }

    if (normalised === currentNormalised) {
      return Promise.resolve();
    }

    if (existingNames?.has(normalised)) {
      return Promise.reject(new Error('A care task with this name already exists'));
    }

    return Promise.resolve();
  };
};
