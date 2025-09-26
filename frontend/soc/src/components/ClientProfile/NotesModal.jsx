import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';

const { TextArea } = Input;

const NotesModal = ({ visible, onCancel, onSave, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        notes: initialData,
      });
    }
  }, [visible, initialData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Placeholder for API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate API response - you can replace this with actual API call
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        message.success({
          content: 'Notes updated successfully!',
          duration: 3,
          style: { marginTop: '10vh' }
        });
        onSave(values.notes);
        form.resetFields();
      } else {
        message.error({
          content: 'Failed to update notes. Server error occurred. Please try again.',
          duration: 4,
          style: { marginTop: '10vh' }
        });
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning({
          content: 'Please check the notes field before saving.',
          duration: 3,
          style: { marginTop: '10vh' }
        });
      } else {
        message.error({
          content: 'Failed to update notes. Network connection error.',
          duration: 4,
          style: { marginTop: '10vh' }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Edit Notes"
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="notes"
          label="Care Notes"
          rules={[
            {
              max: 1000,
              message: 'Notes cannot exceed 1000 characters'
            }
          ]}
        >
          <TextArea
            placeholder="Enter care notes, preferences, or important information about the client..."
            rows={8}
            showCount
            maxLength={1000}
            style={{ resize: 'none' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NotesModal;