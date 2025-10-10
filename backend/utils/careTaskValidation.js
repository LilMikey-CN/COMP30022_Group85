/**
 * Validation helpers shared across care task routes.
 */

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const requireDate = (value, fieldName) => {
  const parsed = toDate(value);
  if (!parsed) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

const optionalDate = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = toDate(value);
  if (!parsed) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

const requireNumber = (value, fieldName, { min, max } = {}) => {
  if (value === undefined || value === null || value === '') {
    const error = new Error(`${fieldName} is required`);
    error.status = 400;
    throw error;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    const error = new Error(`${fieldName} must be a valid number`);
    error.status = 400;
    throw error;
  }

  if (min !== undefined && parsed < min) {
    const error = new Error(`${fieldName} must be greater than or equal to ${min}`);
    error.status = 400;
    throw error;
  }

  if (max !== undefined && parsed > max) {
    const error = new Error(`${fieldName} must be less than or equal to ${max}`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

const parseOptionalNumber = (value, fieldName, { min } = {}) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    const error = new Error(`${fieldName} must be a valid number`);
    error.status = 400;
    throw error;
  }

  if (min !== undefined && parsed < min) {
    const error = new Error(`${fieldName} must be greater than or equal to ${min}`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

const parseOptionalInteger = (value, fieldName, { min } = {}) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    const error = new Error(`${fieldName} must be an integer`);
    error.status = 400;
    throw error;
  }

  if (min !== undefined && parsed < min) {
    const error = new Error(`${fieldName} must be greater than or equal to ${min}`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

module.exports = {
  toDate,
  requireDate,
  optionalDate,
  requireNumber,
  parseOptionalNumber,
  parseOptionalInteger
};
