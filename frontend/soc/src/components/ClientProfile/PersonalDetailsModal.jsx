import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, message } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const PersonalDetailsModal = ({ visible, onCancel, onSave, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        fullName: initialData.fullName,
        dateOfBirth: initialData.dateOfBirth ? dayjs(initialData.dateOfBirth, 'DD/MM/YYYY') : null,
        sex: initialData.sex,
        age: initialData.age,
      });
    }
  }, [visible, initialData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Format date back to DD/MM/YYYY
      const formattedData = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('DD/MM/YYYY') : null,
      };

      // Calculate age from date of birth if provided
      if (values.dateOfBirth) {
        const age = dayjs().diff(values.dateOfBirth, 'year');
        formattedData.age = age;
      }

      // Placeholder for API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate API response - you can replace this with actual API call
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        message.success({
          content: 'Personal details updated successfully!',
          duration: 3,
          style: { marginTop: '10vh' }
        });
        onSave(formattedData);
        form.resetFields();
      } else {
        message.error({
          content: 'Failed to update personal details. Server error occurred. Please try again.',
          duration: 4,
          style: { marginTop: '10vh' }
        });
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning({
          content: 'Please check all required fields before saving.',
          duration: 3,
          style: { marginTop: '10vh' }
        });
      } else {
        message.error({
          content: 'Failed to update personal details. Network connection error.',
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
      title="Edit Personal Details"
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[
            { required: true, message: 'Please enter full name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            { max: 100, message: 'Name cannot exceed 100 characters' }
          ]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Form.Item
          name="dateOfBirth"
          label="Date of Birth"
          rules={[
            { required: true, message: 'Please select date of birth' }
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="Select date of birth"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current > dayjs()}
          />
        </Form.Item>

        <Form.Item
          name="sex"
          label="Sex"
          rules={[
            { required: true, message: 'Please select sex' }
          ]}
        >
          <Select placeholder="Select sex">
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
            <Option value="Other">Other</Option>
            <Option value="Prefer not to say">Prefer not to say</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="age"
          label="Age"
          rules={[
            { required: true, message: 'Please enter age' },
            { type: 'number', min: 0, max: 150, message: 'Age must be between 0 and 150' }
          ]}
        >
          <Input
            type="number"
            placeholder="Enter age"
            disabled={form.getFieldValue('dateOfBirth')}
            style={{
              backgroundColor: form.getFieldValue('dateOfBirth') ? '#f5f5f5' : 'white'
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PersonalDetailsModal;