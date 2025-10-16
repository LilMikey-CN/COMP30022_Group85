import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Divider, Alert, AutoComplete } from 'antd';
import dayjs from 'dayjs';
import { RECURRENCE_PRESETS } from './recurrencePresets';
import {
  clampDateToCurrentYear,
  endDateDisabled,
  endDateValidationError,
  getCurrentYearBounds,
  startDateDisabled,
  startDateValidationError,
} from '../../utils/careTaskDateUtils';

const { Option } = Select;

const CareTaskForm = ({
  form,
  mode = 'create',
  initialTask,
  categories = [],
  categoriesLoading = false,
  isTaskTypeEditable = true,
  isFrequencyEditable = true,
  isStartDateEditable = true,
  defaultTaskType = 'GENERAL',
}) => {
  const [categorySearch, setCategorySearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const categoryInputValue = Form.useWatch('category_input', form);
  const taskTypeValue = Form.useWatch('task_type', form);
  const recurrencePresetValue = Form.useWatch('recurrencePreset', form);
  const startDateValue = Form.useWatch('start_date', form);
  const endDateValue = Form.useWatch('end_date', form);

  useEffect(() => {
    setCategorySearch(categoryInputValue || '');
  }, [categoryInputValue]);

  useEffect(() => {
    if (!recurrencePresetValue) {
      return;
    }

    if (recurrencePresetValue !== 'custom') {
      const preset = RECURRENCE_PRESETS.find((presetOption) => presetOption.value === recurrencePresetValue);
      if (preset) {
        form.setFieldsValue({ recurrence_interval_days: preset.interval });
      }
    }

    if (recurrencePresetValue === '0') {
      form.setFieldsValue({ end_date: null });
    } else {
      const currentEnd = form.getFieldValue('end_date');
      if (!currentEnd) {
        const start = form.getFieldValue('start_date');
        const { end } = getCurrentYearBounds();
        const base = start ? dayjs(start) : dayjs();
        const candidate = base.isAfter(end, 'day') ? end : base;
        form.setFieldsValue({ end_date: candidate });
      }
    }
  }, [recurrencePresetValue, form]);

  useEffect(() => {
    if (!startDateValue || recurrencePresetValue === '0') {
      return;
    }

    const startDay = dayjs(startDateValue);
    const currentEnd = endDateValue ? dayjs(endDateValue) : null;
    const { end } = getCurrentYearBounds();

    if (currentEnd && currentEnd.isBefore(startDay, 'day')) {
      form.setFieldsValue({ end_date: startDay });
      return;
    }

    if (currentEnd && currentEnd.isAfter(end, 'day')) {
      form.setFieldsValue({ end_date: end });
      return;
    }

    if (!currentEnd) {
      form.setFieldsValue({ end_date: startDay.isAfter(end, 'day') ? end : startDay });
    }
  }, [endDateValue, form, recurrencePresetValue, startDateValue]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.name,
        label: category.name,
        categoryId: category.id
      })),
    [categories]
  );

  const autoCompleteOptions = useMemo(() => {
    const trimmedSearch = categorySearch.trim();
    if (!trimmedSearch) {
      return categoryOptions;
    }

    const exists = categories.some(
      (category) => category.name.trim().toLowerCase() === trimmedSearch.toLowerCase()
    );

    if (exists) {
      return categoryOptions;
    }

    return [
      ...categoryOptions,
      {
        value: trimmedSearch,
        label: `Create "${trimmedSearch}"`,
        categoryId: null,
        isNew: true
      }
    ];
  }, [categoryOptions, categorySearch, categories]);

  const handleTaskTypeChange = useCallback((value) => {
    if (value !== 'PURCHASE') {
      form.setFieldsValue({ yearly_budget: null });
    }
  }, [form]);

  const handleCategoryInputChange = useCallback(
    (value) => {
      setCategorySearch(value);
      const trimmed = (value || '').trim();
      const match = categories.find(
        (category) => category.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      form.setFieldsValue({
        category_id: match ? match.id : null
      });
    },
    [categories, form]
  );

  const handleCategorySelect = useCallback(
    (value, option) => {
      if (option?.categoryId) {
        form.setFieldsValue({
          category_id: option.categoryId
        });
      } else {
        handleCategoryInputChange(value);
      }
      setDropdownOpen(false);
    },
    [form, handleCategoryInputChange]
  );

  useEffect(() => {
    if (!initialTask) {
      return;
    }
    const match = categories.find((category) => category.id === initialTask.category_id);
    const categoryName = match?.name || initialTask.category_name || initialTask.category_id || '';
    if (categoryName) {
      form.setFieldsValue({
        category_input: categoryName,
        category_id: initialTask.category_id || null
      });
      setCategorySearch(categoryName);
    }
  }, [categories, form, initialTask]);

  useEffect(() => {
    if (initialTask) {
      return;
    }
    const currentType = form.getFieldValue('task_type');
    if (!currentType) {
      form.setFieldsValue({ task_type: defaultTaskType });
    }
  }, [defaultTaskType, form, initialTask]);

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={{
        task_type: initialTask?.task_type || defaultTaskType,
        recurrencePreset: '0',
        recurrence_interval_days: 0,
        start_date: clampDateToCurrentYear(initialTask?.start_date ? dayjs(initialTask.start_date) : dayjs()),
        category_id: initialTask?.category_id || null,
        category_input: initialTask?.category_name || initialTask?.category_id || '',
        yearly_budget: initialTask?.yearly_budget ?? null,
        end_date: clampDateToCurrentYear(initialTask?.end_date ? dayjs(initialTask.end_date) : null)
      }}
    >
      <Form.Item
        name="name"
        label="Task name"
        rules={[{ required: true, message: 'Please enter a task name' }]}
      >
        <Input placeholder="e.g. Monthly wheelchair maintenance" autoFocus={mode === 'create'} />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ max: 500, message: 'Description cannot exceed 500 characters' }]}
      >
        <Input.TextArea rows={3} placeholder="Add context or special instructions" showCount maxLength={500} />
      </Form.Item>

      <Form.Item
        name="category_input"
        label="Category"
        rules={[{ required: true, message: 'Please select or enter a category' }]}
      >
        <AutoComplete
          options={autoCompleteOptions}
          placeholder="Select or type a category"
          onSelect={handleCategorySelect}
          onChange={handleCategoryInputChange}
          onSearch={setCategorySearch}
          filterOption={(inputValue, option) =>
            (option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
          }
          allowClear
          loading={categoriesLoading}
          notFoundContent={categoriesLoading ? 'Loading categories…' : null}
          open={dropdownOpen}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setDropdownOpen(false)}
        />
      </Form.Item>

      <Form.Item name="category_id" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        name="task_type"
        label="Task type"
        rules={[{ required: true, message: 'Please select a task type' }]}
      >
        <Select
          placeholder="Select type"
          onChange={handleTaskTypeChange}
          disabled={!isTaskTypeEditable}
        >
          <Option value="GENERAL">General</Option>
          <Option value="PURCHASE">Purchase</Option>
        </Select>
      </Form.Item>

      {taskTypeValue === 'PURCHASE' && (
        <Form.Item
          name="yearly_budget"
          label="Yearly budget"
          rules={[
            {
              validator: (_, value) => {
                if (value === null || value === undefined || value === '') {
                  return Promise.resolve();
                }
                const numeric = Number(value);
                if (Number.isNaN(numeric) || numeric < 0) {
                  return Promise.reject(new Error('Yearly budget must be a number greater than or equal to 0'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            addonBefore="$"
          />
        </Form.Item>
      )}

      <Divider orientation="left" plain>
        Recurrence
      </Divider>

      <Form.Item
        name="recurrencePreset"
        label="Frequency"
        rules={[{ required: true, message: 'Please choose a recurrence' }]}
      >
        <Select disabled={!isFrequencyEditable}>
          {RECURRENCE_PRESETS.map((preset) => (
            <Option key={preset.value} value={preset.value}>
              {preset.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {recurrencePresetValue === 'custom' && (
        <Form.Item
          name="recurrence_interval_days"
          label="Custom interval (days)"
          rules={[
            { required: true, message: 'Enter recurrence interval' },
            { type: 'number', min: 0, message: 'Recurrence must be 0 or greater' },
            {
              validator: (_, value) => {
                if (!Number.isInteger(value)) {
                  return Promise.reject(new Error('Recurrence must be a whole number'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0} step={1} disabled={!isFrequencyEditable} />
        </Form.Item>
      )}

      {recurrencePresetValue !== 'custom' && (
        <Form.Item name="recurrence_interval_days" hidden>
          <InputNumber />
        </Form.Item>
      )}

      <Divider orientation="left" plain>
        Scheduling
      </Divider>

      <Form.Item
        name="start_date"
        label="Start date"
        rules={[
          { required: true, message: 'Please select a start date' },
          {
            validator: (_, value) => {
              const error = startDateValidationError(value);
              return error ? Promise.reject(new Error(error)) : Promise.resolve();
            },
          },
        ]}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          disabled={!isStartDateEditable}
          disabledDate={startDateDisabled}
        />
      </Form.Item>

      {recurrencePresetValue !== '0' && (
        <Form.Item
          name="end_date"
          label="End date"
          rules={[
            { required: true, message: 'Please select an end date' },
            {
              validator: (_, value) => {
                const start = form.getFieldValue('start_date');
                const error = endDateValidationError(value, start);
                return error ? Promise.reject(new Error(error)) : Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            allowClear={false}
            disabledDate={(current) => endDateDisabled(current, startDateValue)}
          />
        </Form.Item>
      )}

      {initialTask?.is_active === false && (
        <Alert
          type="warning"
          showIcon
          message="This task is currently inactive"
          style={{ marginTop: 12 }}
        />
      )}
    </Form>
  );
};

export default CareTaskForm;
