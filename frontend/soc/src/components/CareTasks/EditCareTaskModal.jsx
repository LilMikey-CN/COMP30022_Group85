import React, { useCallback, useEffect } from 'react';
import { Modal, Form } from 'antd';
import dayjs from 'dayjs';
import CareTaskForm from './CareTaskForm';
import { RECURRENCE_PRESETS } from './recurrencePresets';

const resolveRecurrencePreset = (interval) => {
  const preset = RECURRENCE_PRESETS.find((item) => Number(item.interval) === Number(interval));
  if (preset && preset.value !== 'custom') {
    return preset.value;
  }
  return 'custom';
};

const EditCareTaskModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  task,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (task && open) {
      const recurrencePreset = resolveRecurrencePreset(task.recurrence_interval_days);
      form.setFieldsValue({
        name: task.name,
        description: task.description || '',
        task_type: task.task_type,
        recurrencePreset,
        recurrence_interval_days: Number(task.recurrence_interval_days ?? 0),
        start_date: task.start_date ? dayjs(task.start_date) : undefined,
        end_date: task.end_date ? dayjs(task.end_date) : null,
      });
    } else {
      form.resetFields();
    }
  }, [form, task, open]);

  const resetAndClose = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() ?? '',
        task_type: values.task_type,
        recurrence_interval_days: Number(values.recurrence_interval_days ?? 0),
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
      };

      await onSubmit(task.id, payload);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // handled by mutation hook
      }
    }
  }, [form, onSubmit, resetAndClose, task?.id]);

  return (
    <Modal
      open={open}
      title="Edit care task"
      okText="Save changes"
      onCancel={resetAndClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <CareTaskForm
        form={form}
        mode="edit"
        initialTask={task}
      />
    </Modal>
  );
};

export default EditCareTaskModal;
