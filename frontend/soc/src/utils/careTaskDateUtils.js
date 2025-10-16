import dayjs from 'dayjs';

export const getCurrentYearBounds = () => {
  const now = dayjs();
  return {
    start: now.startOf('year'),
    end: now.endOf('year')
  };
};

export const clampDateToCurrentYear = (value) => {
  if (!value) {
    return null;
  }
  const date = dayjs(value);
  const { start, end } = getCurrentYearBounds();
  if (date.isBefore(start, 'day')) {
    return start;
  }
  if (date.isAfter(end, 'day')) {
    return end;
  }
  return date;
};

export const startDateValidationError = (value) => {
  if (!value) {
    return null;
  }
  const date = dayjs(value);
  const { start, end } = getCurrentYearBounds();
  if (date.isBefore(start, 'day') || date.isAfter(end, 'day')) {
    return `Start date must fall within ${start.format('DD MMM YYYY')} and ${end.format('DD MMM YYYY')}`;
  }
  return null;
};

export const endDateValidationError = (value, startDate) => {
  if (!value) {
    return null;
  }
  const date = dayjs(value);
  const { start, end } = getCurrentYearBounds();

  if (date.isBefore(start, 'day')) {
    return `End date must be on or after ${start.format('DD MMM YYYY')}`;
  }

  if (date.isAfter(end, 'day')) {
    return `End date cannot be later than ${end.format('DD MMM YYYY')}`;
  }

  if (startDate) {
    const startDay = dayjs(startDate);
    if (date.isBefore(startDay, 'day')) {
      return 'End date cannot be before start date';
    }
  }

  return null;
};

export const startDateDisabled = (current) => {
  if (!current) {
    return false;
  }
  const { start, end } = getCurrentYearBounds();
  const day = dayjs(current);
  return day.isBefore(start, 'day') || day.isAfter(end, 'day');
};

export const endDateDisabled = (current, startDate) => {
  if (!current) {
    return false;
  }
  const { start, end } = getCurrentYearBounds();
  const day = dayjs(current);

  if (day.isBefore(start, 'day') || day.isAfter(end, 'day')) {
    return true;
  }

  if (startDate) {
    const startDay = dayjs(startDate);
    if (day.isBefore(startDay, 'day')) {
      return true;
    }
  }

  return false;
};
