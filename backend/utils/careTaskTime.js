/**
 * Date/time helpers shared across care task routes.
 */

const startOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const startOfYear = (year) => new Date(year, 0, 1, 0, 0, 0, 0);

const endOfYear = (year) => new Date(year, 11, 31, 23, 59, 59, 999);

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

module.exports = {
  startOfDay,
  startOfYear,
  endOfYear,
  addDays
};
