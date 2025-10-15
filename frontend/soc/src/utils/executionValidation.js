import dayjs from 'dayjs';

export const buildDateNotBeforeTaskStartRule = (taskStartDate, fieldLabel = 'Date') => {
  if (!taskStartDate) {
    return null;
  }

  const start = dayjs(taskStartDate);
  if (!start.isValid()) {
    return null;
  }

  return {
    validator(_, value) {
      if (!value) {
        return Promise.resolve();
      }

      const candidate = dayjs(value);
      if (!candidate.isValid()) {
        return Promise.resolve();
      }

      if (candidate.isBefore(start, 'day')) {
        const formatted = start.format('DD MMM YYYY');
        return Promise.reject(new Error(`${fieldLabel} cannot be before the task start date (${formatted}).`));
      }

      return Promise.resolve();
    }
  };
};

export const appendTaskDateValidation = (rules = [], taskStartDate, fieldLabel) => {
  const rule = buildDateNotBeforeTaskStartRule(taskStartDate, fieldLabel);
  if (!rule) {
    return rules;
  }
  return [...rules, rule];
};
