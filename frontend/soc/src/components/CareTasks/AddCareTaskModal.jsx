import React, { useCallback } from 'react';
import { Modal, Form } from 'antd';
import dayjs from 'dayjs';
import CareTaskForm from './CareTaskForm';

const AddCareTaskModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  careItems = [],
  careItemsLoading = false,
}) => {
  const [form] = Form.useForm();

  const resetAndClose = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        task_type: values.task_type,
        recurrence_interval_days: Number(values.recurrence_interval_days ?? 0),
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
      };

      if (values.task_type === 'PURCHASE') {
        payload.care_item_id = values.care_item_id;
      }

      await onSubmit(payload);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // error message handled by mutation hook
      }
    }
  }, [form, onSubmit, resetAndClose]);

  return (
    <Modal
      open={open}
      title="Create care task"
      okText="Create"
      onCancel={resetAndClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <CareTaskForm
        form={form}
        mode="create"
        careItems={careItems}
        careItemsLoading={careItemsLoading}
      />
    </Modal>
  );
};

export default AddCareTaskModal;

