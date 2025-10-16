import React, { useEffect, useCallback } from 'react';
import { Modal, Form, DatePicker, InputNumber, Select, Input } from 'antd';
import dayjs from 'dayjs';
import {
  resolveExecutionFieldConfig,
  buildExecutionPayload,
  FIELD_TYPES,
  FIELD_KEYS,
  mapFieldInitialValue
} from '../../utils/executionFieldConfig';
import { appendTaskDateValidation } from '../../utils/executionValidation';

const ManualExecutionModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  mode = 'create',
  initialValues = null,
  title,
  okText,
  taskStartDate = null,
}) => {
  const [form] = Form.useForm();
  const watchedStatus = Form.useWatch(FIELD_KEYS.STATUS, form);
  const status = watchedStatus || initialValues?.status || 'TODO';
  const fieldConfig = resolveExecutionFieldConfig({ mode, status });

  const resetAndClose = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaults = {
      [FIELD_KEYS.SCHEDULED_DATE]: dayjs(),
      [FIELD_KEYS.STATUS]: 'TODO',
      [FIELD_KEYS.QUANTITY_PURCHASED]: 1
    };

    const values = { ...defaults };

    if (initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => {
        values[key] = value;
      });
    }

    Object.entries(values).forEach(([key, value]) => {
      values[key] = mapFieldInitialValue(key, value);
    });

    form.setFieldsValue(values);
  }, [open, initialValues, form]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload = buildExecutionPayload({ mode, status, values });

      await onSubmit(payload);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // handled upstream
      }
    }
  }, [form, mode, status, onSubmit, resetAndClose]);

  const modalTitle = title || (mode === 'edit' ? 'Edit execution' : 'Create manual execution');
  const modalOkText = okText || (mode === 'edit' ? 'Save changes' : 'Create');

  return (
    <Modal
      open={open}
      title={modalTitle}
      okText={modalOkText}
      onCancel={resetAndClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <Form layout="vertical" form={form}>
        {Object.entries(fieldConfig).map(([key, config]) => {
          if (!config.show) {
            return null;
          }

          const rules = (() => {
            const baseRules = config.rules || [];
            if (key === FIELD_KEYS.SCHEDULED_DATE || key === FIELD_KEYS.EXECUTION_DATE) {
              return appendTaskDateValidation(baseRules, taskStartDate, config.label);
            }
            return baseRules;
          })();

          const helperText = config.helperText;
          const commonProps = {
            name: key,
            label: config.label,
            rules,
          };

          switch (config.type) {
            case FIELD_TYPES.DATE:
              return (
                <Form.Item key={key} {...commonProps} extra={helperText}>
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    allowClear={config.allowClear}
                    disabled={config.disabled}
                  />
                </Form.Item>
              );
            case FIELD_TYPES.SELECT:
              return (
                <Form.Item key={key} {...commonProps}>
                  <Select disabled={config.disabled}>
                    {(config.options || []).map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            case FIELD_TYPES.NUMBER:
              return (
                <Form.Item key={key} {...commonProps}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={config.minimum}
                    step={config.step}
                    disabled={config.disabled}
                  />
                </Form.Item>
              );
            case FIELD_TYPES.CURRENCY:
              return (
                <Form.Item key={key} {...commonProps}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={config.minimum ?? 0}
                    step={config.step ?? 0.5}
                    addonBefore="$"
                    disabled={config.disabled}
                  />
                </Form.Item>
              );
            case FIELD_TYPES.TEXTAREA:
              return (
                <Form.Item key={key} {...commonProps}>
                  <Input.TextArea
                    rows={3}
                    showCount
                    maxLength={config.rules?.find((rule) => rule.max)?.max ?? 500}
                    placeholder={config.placeholder}
                    disabled={config.disabled}
                  />
                </Form.Item>
              );
            case FIELD_TYPES.TEXT:
            default:
              return (
                <Form.Item key={key} {...commonProps}>
                  <Input placeholder={config.placeholder} disabled={config.disabled} />
                </Form.Item>
              );
          }
        })}
      </Form>
    </Modal>
  );
};

export default ManualExecutionModal;
