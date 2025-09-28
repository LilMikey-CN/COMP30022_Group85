import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';

const ContactDetailsModal = ({ visible, onCancel, onSave, initialData, loading = false }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        mobileNumber: initialData.mobileNumber,
        emailAddress: initialData.emailAddress,
        postalAddress: initialData.postalAddress,
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
      title="Edit Contact Details"
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={loading}
      okButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      width={500}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="mobileNumber"
          label="Mobile Number"
          rules={[
            { required: true, message: 'Please enter mobile number' },
            { validator: validatePhoneNumber }
          ]}
        >
          <Input
            placeholder="Enter mobile number (e.g., 0400 000 000)"
            maxLength={15}
          />
        </Form.Item>

        <Form.Item
          name="emailAddress"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter email address' },
            {
              type: 'email',
              message: 'Please enter a valid email address'
            },
            {
              max: 100,
              message: 'Email address cannot exceed 100 characters'
            }
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          name="postalAddress"
          label="Postal Address"
          rules={[
            { required: true, message: 'Please enter postal address' },
            {
              min: 5,
              message: 'Address must be at least 5 characters'
            },
            {
              max: 200,
              message: 'Address cannot exceed 200 characters'
            }
          ]}
        >
          <Input.TextArea
            placeholder="Enter postal address"
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContactDetailsModal;