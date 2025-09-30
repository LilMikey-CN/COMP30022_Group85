import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';

const AccountSettingsModal = ({ visible, onCancel, onSave, initialData, loading = false }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        displayName: initialData.displayName || '',
        mobile_phone: initialData.mobile_phone || '',
        contact_address: initialData.contact_address || '',
      });
    }
  }, [visible, initialData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
      form.resetFields();
    } catch (error) {
      if (error.errorFields) {
        message.warning({
          content: 'Please check all required fields before saving.',
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

  // Phone number validation
  const validatePhoneNumber = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }

    // Australian mobile number format (with or without country code)
    const phoneRegex = /^(\+?61|0)?[2-9]\d{8}$|^04\d{8}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return Promise.reject(new Error('Please enter a valid phone number'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Edit Account Settings"
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={loading}
      okButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="displayName"
          label="Display Name"
          rules={[
            { required: true, message: 'Please enter display name' },
            {
              min: 2,
              message: 'Display name must be at least 2 characters'
            },
            {
              max: 100,
              message: 'Display name cannot exceed 100 characters'
            }
          ]}
        >
          <Input placeholder="Enter display name" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="mobile_phone"
          label="Mobile Phone"
          rules={[
            { validator: validatePhoneNumber }
          ]}
        >
          <Input
            placeholder="Enter mobile phone (e.g., 0400 000 000)"
            maxLength={15}
          />
        </Form.Item>

        <Form.Item
          name="contact_address"
          label="Contact Address"
          rules={[
            {
              max: 200,
              message: 'Address cannot exceed 200 characters'
            }
          ]}
        >
          <Input.TextArea
            placeholder="Enter contact address"
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AccountSettingsModal;