import React, { useCallback } from 'react';
import { Modal, Form, DatePicker, InputNumber, Select, Input } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const ManualExecutionModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
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
        scheduled_date: values.scheduled_date ? dayjs(values.scheduled_date).format('YYYY-MM-DD') : undefined,
        execution_date: values.execution_date ? dayjs(values.execution_date).format('YYYY-MM-DD') : undefined,
        status: values.status || 'TODO',
        quantity_purchased: values.quantity_purchased ? Number(values.quantity_purchased) : 1,
        quantity_unit: values.quantity_unit?.trim() || undefined,
        actual_cost: values.actual_cost !== undefined && values.actual_cost !== null
          ? Number(values.actual_cost)
          : undefined,
        notes: values.notes?.trim() || undefined,
      };

      await onSubmit(payload);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // handled upstream
      }
    }
  }, [form, onSubmit, resetAndClose]);

  return (
    <Modal
      open={open}
      title="Create manual execution"
      okText="Create"
      onCancel={resetAndClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          scheduled_date: dayjs(),
          status: 'TODO',
          quantity_purchased: 1,
        }}
      >
        <Form.Item
          name="scheduled_date"
          label="Scheduled date"
          rules={[{ required: true, message: 'Please select a scheduled date' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="execution_date"
          label="Execution date"
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" allowClear />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please choose a status' }]}
        >
          <Select>
            <Option value="TODO">To do</Option>
            <Option value="DONE">Done</Option>
            <Option value="CANCELLED">Cancelled</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="quantity_purchased"
          label="Quantity"
          rules={[{ type: 'number', min: 1, message: 'Quantity must be at least 1' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} step={1} />
        </Form.Item>

        <Form.Item
          name="quantity_unit"
          label="Quantity unit"
          rules={[{ max: 50, message: 'Unit cannot exceed 50 characters' }]}
        >
          <Input placeholder="e.g. bottle, pack" />
        </Form.Item>

        <Form.Item
          name="actual_cost"
          label="Actual cost"
          rules={[{ type: 'number', min: 0, message: 'Cost cannot be negative' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} step={0.5} addonBefore="$" />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes"
          rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
        >
          <Input.TextArea rows={3} showCount maxLength={500} placeholder="Add optional notes" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ManualExecutionModal;

