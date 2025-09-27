import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';

const { TextArea } = Input;

const NotesModal = ({ visible, onCancel, onSave, initialData, loading = false }) => {
  const [form] = Form.useForm();

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
      onSave(values.notes);
      form.resetFields();
    } catch (error) {
      if (error.errorFields) {
        message.warning({
          content: 'Please check the notes field before saving.',
          duration: 3,
          style: { marginTop: '10vh' }
        });
      }
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
      okButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      width={600}
      destroyOnHidden
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