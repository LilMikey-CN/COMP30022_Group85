import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, message, Row, Col } from 'antd';
import dayjs from 'dayjs';

const VitalsModal = ({ visible, onCancel, onSave, initialData, loading = false }) => {
  const [form] = Form.useForm();

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

      // Format the data for saving
      const formattedData = {
        date: values.date.format('DD/MM/YYYY'),
        heartRate: values.heartRate,
        bloodPressure: `${values.bloodPressureSystolic}/${values.bloodPressureDiastolic}`,
        oxygenSaturation: values.oxygenSaturation,
        temperature: values.temperature,
      };

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
      title="Edit Latest Vitals"
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
                {
                  validator: (_, value) => {
                    if (value === null || value === undefined) {
                      return Promise.reject(new Error('Please enter heart rate'));
                    }
                    if (value < 30 || value > 200) {
                      return Promise.reject(new Error('Heart rate must be between 30-200 bpm'));
                    }
                    return Promise.resolve();
                  }
                }
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
                {
                  validator: (_, value) => {
                    if (value === null || value === undefined) {
                      return Promise.reject(new Error('Please enter temperature'));
                    }
                    if (value < 30 || value > 45) {
                      return Promise.reject(new Error('Temperature must be between 30-45°C'));
                    }
                    return Promise.resolve();
                  }
                }
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
                {
                  validator: (_, value) => {
                    if (value === null || value === undefined) {
                      return Promise.reject(new Error('Required'));
                    }
                    if (value < 70 || value > 250) {
                      return Promise.reject(new Error('Systolic: 70-250'));
                    }
                    return Promise.resolve();
                  }
                }
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
                {
                  validator: (_, value) => {
                    if (value === null || value === undefined) {
                      return Promise.reject(new Error('Required'));
                    }
                    if (value < 40 || value > 150) {
                      return Promise.reject(new Error('Diastolic: 40-150'));
                    }
                    return Promise.resolve();
                  }
                }
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
            {
              validator: (_, value) => {
                if (value === null || value === undefined) {
                  return Promise.reject(new Error('Please enter oxygen saturation'));
                }
                if (value < 70 || value > 100) {
                  return Promise.reject(new Error('Oxygen saturation must be between 70-100%'));
                }
                return Promise.resolve();
              }
            }
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