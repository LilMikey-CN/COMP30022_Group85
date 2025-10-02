import React, { useEffect, useMemo } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Divider, Alert } from 'antd';
import dayjs from 'dayjs';
import { RECURRENCE_PRESETS } from './recurrencePresets';

const { Option } = Select;

const CareTaskForm = ({
  form,
  mode = 'create',
  careItems = [],
  careItemsLoading = false,
  initialTask,
}) => {
  const recurrencePresetValue = Form.useWatch('recurrencePreset', form);
  const taskTypeValue = Form.useWatch('task_type', form);

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
  }, [recurrencePresetValue, form]);

  const filteredCareItems = useMemo(() => {
    return careItems
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [careItems]);

  const disableCareItemSelect = taskTypeValue !== 'PURCHASE';

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={{
        task_type: 'GENERAL',
        recurrencePreset: '0',
        recurrence_interval_days: 0,
        start_date: dayjs(),
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
        name="task_type"
        label="Task type"
        rules={[{ required: true, message: 'Please select a task type' }]}
      >
        <Select placeholder="Select type">
          <Option value="GENERAL">General</Option>
          <Option value="PURCHASE">Purchase</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="care_item_id"
        label="Linked care item"
        tooltip="Required for purchase tasks"
        rules={[
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (getFieldValue('task_type') !== 'PURCHASE') {
                return Promise.resolve();
              }
              if (!value) {
                return Promise.reject(new Error('Please select a care item'));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <Select
          placeholder={disableCareItemSelect ? 'Select task type to choose care item' : 'Select care item'}
          loading={careItemsLoading}
          disabled={disableCareItemSelect}
          showSearch
          optionFilterProp="children"
          allowClear
        >
          {filteredCareItems.map((item) => (
            <Option key={item.id} value={item.id}>
              {item.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Divider orientation="left" plain>
        Recurrence
      </Divider>

      <Form.Item
        name="recurrencePreset"
        label="Frequency"
        rules={[{ required: true, message: 'Please choose a recurrence' }]}
      >
        <Select>
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
          <InputNumber style={{ width: '100%' }} min={0} step={1} />
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
        rules={[{ required: true, message: 'Please select a start date' }]}
      >
        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item
        name="end_date"
        label="End date"
        rules={[
          {
            validator: (_, value) => {
              const start = form.getFieldValue('start_date');
              if (value && start && dayjs(value).isBefore(dayjs(start), 'day')) {
                return Promise.reject(new Error('End date cannot be before start date'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" allowClear />
      </Form.Item>

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
