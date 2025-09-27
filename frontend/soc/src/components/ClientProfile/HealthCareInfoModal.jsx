import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';

const { TextArea } = Input;

const HealthCareInfoModal = ({ visible, onCancel, onSave, initialData, loading = false }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        medicalConditions: initialData.medicalConditions,
        allergies: initialData.allergies,
        medications: initialData.medications,
        accessibilityNeeds: initialData.accessibilityNeeds,
      });
    }
  }, [visible, initialData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Clean up values - convert empty strings to 'N/A' for consistency
      const cleanedValues = Object.keys(values).reduce((acc, key) => {
        acc[key] = values[key]?.trim() || 'N/A';
        return acc;
      }, {});

      onSave(cleanedValues);
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
      title="Edit Health & Care Information"
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
          name="medicalConditions"
          label="Medical Conditions"
          rules={[
            {
              max: 500,
              message: 'Medical conditions cannot exceed 500 characters'
            }
          ]}
        >
          <TextArea
            placeholder="Enter medical conditions or 'N/A' if none"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="allergies"
          label="Allergies"
          rules={[
            {
              max: 300,
              message: 'Allergies cannot exceed 300 characters'
            }
          ]}
        >
          <TextArea
            placeholder="Enter known allergies or 'N/A' if none"
            rows={2}
            showCount
            maxLength={300}
          />
        </Form.Item>

        <Form.Item
          name="medications"
          label="Medications"
          rules={[
            {
              max: 500,
              message: 'Medications cannot exceed 500 characters'
            }
          ]}
        >
          <TextArea
            placeholder="Enter current medications or 'N/A' if none"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="accessibilityNeeds"
          label="Accessibility Needs"
          rules={[
            {
              max: 300,
              message: 'Accessibility needs cannot exceed 300 characters'
            }
          ]}
        >
          <TextArea
            placeholder="Enter accessibility requirements or 'N/A' if none"
            rows={2}
            showCount
            maxLength={300}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default HealthCareInfoModal;