import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, message, Row, Col } from 'antd';
import dayjs from 'dayjs';

const VitalsModal = ({ visible, onCancel, onSave, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        date: initialData.date ? dayjs(initialData.date, 'DD/MM/YYYY') : dayjs(),
        heartRate: initialData.heartRate,
        bloodPressureSystolic: initialData.bloodPressure ? parseInt(initialData.bloodPressure.split('/')[0]) : null,
        bloodPressureDiastolic: initialData.bloodPressure ? parseInt(initialData.bloodPressure.split('/')[1]) : null,
        oxygenSaturation: initialData.oxygenSaturation,
        temperature: initialData.temperature,
      });
    }
  }, [visible, initialData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Format the data for saving
      const formattedData = {
        date: values.date.format('DD/MM/YYYY'),
        heartRate: values.heartRate,
        bloodPressure: `${values.bloodPressureSystolic}/${values.bloodPressureDiastolic}`,
        oxygenSaturation: values.oxygenSaturation,
        temperature: values.temperature,
      };

      // Placeholder for API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate API response - you can replace this with actual API call
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        message.success({
          content: 'Vital signs updated successfully!',
          duration: 3,
          style: { marginTop: '10vh' }
        });
        onSave(formattedData);
        form.resetFields();
      } else {
        message.error({
          content: 'Failed to update vital signs. Server error occurred. Please try again.',
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
          content: 'Failed to update vital signs. Network connection error.',
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
      title="Edit Latest Vitals"
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
          name="date"
          label="Date & Time"
          rules={[
            { required: true, message: 'Please select date and time' }
          ]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            placeholder="Select date and time"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current > dayjs()}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="heartRate"
              label="Heart Rate (bpm)"
              rules={[
                { required: true, message: 'Please enter heart rate' },
                { type: 'number', min: 30, max: 200, message: 'Heart rate must be between 30-200 bpm' }
              ]}
            >
              <InputNumber
                placeholder="Enter heart rate"
                style={{ width: '100%' }}
                min={30}
                max={200}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="temperature"
              label="Temperature (°C)"
              rules={[
                { required: true, message: 'Please enter temperature' },
                { type: 'number', min: 30, max: 45, message: 'Temperature must be between 30-45°C' }
              ]}
            >
              <InputNumber
                placeholder="Enter temperature"
                style={{ width: '100%' }}
                step={0.1}
                precision={1}
                min={30}
                max={45}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Blood Pressure (mmHg)">
          <Input.Group compact>
            <Form.Item
              name="bloodPressureSystolic"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 70, max: 250, message: 'Systolic: 70-250' }
              ]}
              style={{ display: 'inline-block', width: '45%' }}
            >
              <InputNumber
                placeholder="Systolic"
                style={{ width: '100%' }}
                min={70}
                max={250}
              />
            </Form.Item>
            <Input
              style={{
                width: '10%',
                textAlign: 'center',
                pointerEvents: 'none',
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none'
              }}
              placeholder="/"
              disabled
            />
            <Form.Item
              name="bloodPressureDiastolic"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 40, max: 150, message: 'Diastolic: 40-150' }
              ]}
              style={{ display: 'inline-block', width: '45%' }}
            >
              <InputNumber
                placeholder="Diastolic"
                style={{ width: '100%' }}
                min={40}
                max={150}
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>

        <Form.Item
          name="oxygenSaturation"
          label="Oxygen Saturation (%)"
          rules={[
            { required: true, message: 'Please enter oxygen saturation' },
            { type: 'number', min: 70, max: 100, message: 'Oxygen saturation must be between 70-100%' }
          ]}
        >
          <InputNumber
            placeholder="Enter oxygen saturation"
            style={{ width: '100%' }}
            min={70}
            max={100}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VitalsModal;