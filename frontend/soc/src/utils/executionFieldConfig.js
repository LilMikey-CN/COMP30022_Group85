import dayjs from 'dayjs';

const FIELD_KEYS = {
  SCHEDULED_DATE: 'scheduled_date',
  EXECUTION_DATE: 'execution_date',
  STATUS: 'status',
  QUANTITY_PURCHASED: 'quantity_purchased',
  QUANTITY_UNIT: 'quantity_unit',
  ACTUAL_COST: 'actual_cost',
  NOTES: 'notes',
  REFUND_AMOUNT: 'refund_amount',
  REFUND_DATE: 'refund_date',
  REFUND_REASON: 'refund_reason',
  REFUND_EVIDENCE_URL: 'refund_evidence_url'
};

const REFUND_STATUSES = new Set(['REFUNDED', 'PARTIALLY_REFUNDED']);

const baseFields = {
  [FIELD_KEYS.SCHEDULED_DATE]: {
    label: 'Scheduled date',
    type: 'date',
    rules: [{ required: true, message: 'Please select a scheduled date' }],
    disabled: false,
    show: true,
  },
  [FIELD_KEYS.EXECUTION_DATE]: {
    label: 'Execution date',
    type: 'date',
    allowClear: true,
    disabled: false,
    show: true,
  },
  [FIELD_KEYS.STATUS]: {
    label: 'Status',
    type: 'select',
    rules: [{ required: true, message: 'Please choose a status' }],
    disabled: false,
    show: true,
    options: [
      { label: 'To do', value: 'TODO' },
      { label: 'Done', value: 'DONE' },
      { label: 'Cancelled', value: 'CANCELLED' },
      { label: 'Refunded', value: 'REFUNDED' },
      { label: 'Partially refunded', value: 'PARTIALLY_REFUNDED' }
    ]
  },
  [FIELD_KEYS.QUANTITY_PURCHASED]: {
    label: 'Quantity',
    type: 'number',
    rules: [{ type: 'number', min: 1, message: 'Quantity must be at least 1' }],
    minimum: 1,
    step: 1,
    disabled: false,
    show: true,
  },
  [FIELD_KEYS.QUANTITY_UNIT]: {
    label: 'Quantity unit',
    type: 'text',
    rules: [{ max: 50, message: 'Unit cannot exceed 50 characters' }],
    disabled: false,
    show: true,
  },
  [FIELD_KEYS.ACTUAL_COST]: {
    label: 'Actual cost',
    type: 'currency',
    rules: [{ type: 'number', min: 0, message: 'Cost cannot be negative' }],
    disabled: false,
    show: true,
  },
  [FIELD_KEYS.NOTES]: {
    label: 'Notes',
    type: 'textarea',
    rules: [{ max: 500, message: 'Notes cannot exceed 500 characters' }],
    show: true,
  },
  [FIELD_KEYS.REFUND_AMOUNT]: {
    label: 'Refund amount',
    type: 'currency',
    rules: [{ type: 'number', min: 0, message: 'Refund amount cannot be negative' }],
    disabled: true,
    show: false,
  },
  [FIELD_KEYS.REFUND_DATE]: {
    label: 'Refund date',
    type: 'date',
    disabled: true,
    show: false,
  },
  [FIELD_KEYS.REFUND_REASON]: {
    label: 'Refund reason',
    type: 'text',
    disabled: true,
    show: false,
  },
  [FIELD_KEYS.REFUND_EVIDENCE_URL]: {
    label: 'Refund evidence URL',
    type: 'text',
    disabled: true,
    show: false,
  }
};

const cloneBaseConfig = () => {
  const result = {};
  Object.entries(baseFields).forEach(([key, value]) => {
    result[key] = { ...value };
  });
  return result;
};

export const resolveExecutionFieldConfig = ({ mode, status }) => {
  const fields = cloneBaseConfig();
  const isEdit = mode === 'edit';

  fields[FIELD_KEYS.EXECUTION_DATE].disabled = true;
  fields[FIELD_KEYS.EXECUTION_DATE].helperText = 'Set automatically when marked as done';

  const hideQuantityFields = () => {
    fields[FIELD_KEYS.QUANTITY_PURCHASED].show = false;
    fields[FIELD_KEYS.QUANTITY_UNIT].show = false;
  };

  if (status === 'TODO') {
    hideQuantityFields();
  }

  if (!isEdit) {
    return fields;
  }

  fields[FIELD_KEYS.STATUS].disabled = true;

  if (status === 'DONE') {
    Object.keys(fields).forEach((key) => {
      fields[key].disabled = true;
    });
    fields[FIELD_KEYS.QUANTITY_PURCHASED].show = true;
    fields[FIELD_KEYS.QUANTITY_UNIT].show = true;
  } else if (REFUND_STATUSES.has(status)) {
    Object.keys(fields).forEach((key) => {
      if (key !== FIELD_KEYS.REFUND_AMOUNT) {
        fields[key].disabled = true;
      }
    });
    fields[FIELD_KEYS.REFUND_AMOUNT].show = true;
    fields[FIELD_KEYS.REFUND_DATE].show = true;
    fields[FIELD_KEYS.REFUND_REASON].show = true;
    fields[FIELD_KEYS.REFUND_EVIDENCE_URL].show = true;
    fields[FIELD_KEYS.REFUND_AMOUNT].disabled = false;
    fields[FIELD_KEYS.NOTES].disabled = true;
    hideQuantityFields();
  } else if (status === 'CANCELLED' || status === 'COVERED') {
    Object.keys(fields).forEach((key) => {
      fields[key].disabled = true;
    });
    hideQuantityFields();
  }

  return fields;
};

const formatDate = (value) => (value ? dayjs(value).format('YYYY-MM-DD') : undefined);

export const buildExecutionPayload = ({ mode, status, values }) => {
  const isEdit = mode === 'edit';

  if (isEdit) {
    if (status === 'DONE') {
      const payload = {};
      if (values.notes !== undefined) {
        const trimmed = values.notes?.trim();
        payload.notes = trimmed || undefined;
      }
      if (values.actual_cost !== undefined && values.actual_cost !== null && values.actual_cost !== '') {
        payload.actual_cost = Number(values.actual_cost);
      }
      return payload;
    }

    if (REFUND_STATUSES.has(status)) {
      const payload = {};
      if (values.refund_amount !== undefined && values.refund_amount !== null && values.refund_amount !== '') {
        payload.refund = {
          refund_amount: Number(values.refund_amount)
        };
      }
      return payload;
    }
  }

  const payload = {
    scheduled_date: formatDate(values.scheduled_date),
    status: values.status || 'TODO',
    quantity_purchased: values.quantity_purchased ? Number(values.quantity_purchased) : 1,
    quantity_unit: values.quantity_unit?.trim() || undefined,
    actual_cost: values.actual_cost !== undefined && values.actual_cost !== null && values.actual_cost !== ''
      ? Number(values.actual_cost)
      : undefined,
    notes: values.notes?.trim() || undefined,
  };

  if (values.refund_amount !== undefined && values.refund_amount !== null && values.refund_amount !== '') {
    payload.refund = {
      refund_amount: Number(values.refund_amount)
    };
  }

  if (payload.status === 'DONE') {
    payload.execution_date = formatDate(values.execution_date ?? dayjs());
  }

  return payload;
};

export const mapFieldInitialValue = (fieldKey, value) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (baseFields[fieldKey]?.type === 'date') {
    return value ? dayjs(value) : null;
  }

  return value;
};

export const FIELD_TYPES = {
  DATE: 'date',
  SELECT: 'select',
  NUMBER: 'number',
  TEXT: 'text',
  CURRENCY: 'currency',
  TEXTAREA: 'textarea'
};


export { FIELD_KEYS };
