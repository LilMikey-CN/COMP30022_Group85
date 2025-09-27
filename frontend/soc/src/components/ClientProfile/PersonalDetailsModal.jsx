import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const PersonalDetailsModal = ({ visible, onCancel, onSave, initialData, loading = false }) => {
  const [form] = Form.useForm();

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

  // Handle date of birth change to auto-calculate age
  const handleDateOfBirthChange = (date) => {
    if (date) {
      const age = dayjs().diff(date, 'year');
      form.setFieldValue('age', age);
    } else {
      form.setFieldValue('age', null);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

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

      onSave(formattedData);
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

  return (
    <Modal
      title="Edit Personal Details"
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
            onChange={handleDateOfBirthChange}
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
        >
          <InputNumber
            placeholder="Calculated from date of birth"
            style={{ width: '100%' }}
            disabled={true}
            readOnly={true}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PersonalDetailsModal;