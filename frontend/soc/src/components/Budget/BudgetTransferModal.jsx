import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Typography,
  Divider,
  Select,
  Space
} from 'antd';
import { formatCurrency } from '../../utils/budgetAnalytics';

const { Text } = Typography;

const BudgetTransferModal = ({
  open,
  onCancel,
  onSubmit,
  isSubmitting,
  sourceTask,
  categories = [],
  tasks = []
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const remainingBudget = sourceTask?.remaining ?? 0;

  const categoryOptions = categories
    .filter((category) => tasks.some((task) => task.category_id === category.id && task.id !== sourceTask?.id))
    .map((category) => ({
      label: category.name,
      value: category.id
    }));

  const handleFinish = (values) => {
    onSubmit({
      amount: Number(values.amount),
      toTaskId: values.toTaskId
    });
  };

  const renderRemainingBudget = () => (
    <Space direction="vertical" size={2}>
      <Text type="secondary" style={{ fontSize: 13 }}>Remaining budget</Text>
      <Text strong style={{ fontSize: 20 }}>
        {formatCurrency(remainingBudget)}
      </Text>
    </Space>
  );

  return (
    <Modal
      title={`Transfer budget from ${sourceTask?.name || ''}`}
      open={open}
      onCancel={onCancel}
      okText="Submit transfer"
      okButtonProps={{ loading: isSubmitting }}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{
          amount: undefined,
          categoryId: undefined,
          toTaskId: undefined
        }}
      >
        <Form.Item>
          {renderRemainingBudget()}
        </Form.Item>

        <Form.Item
          label="Transfer amount"
          name="amount"
          rules={[
            { required: true, message: 'Enter an amount to transfer' },
            {
              type: 'number',
              min: 0.01,
              message: 'Amount must be greater than zero'
            },
            () => ({
              validator(_, value) {
                if (value === undefined || value === null) {
                  return Promise.resolve();
                }
                if (Number(value) <= remainingBudget) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Amount exceeds available balance'));
              }
            })
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={2}
            placeholder="Enter amount"
          />
        </Form.Item>

        <Divider plain>Transfer budget to</Divider>

        <Form.Item
          label="Task category"
          name="categoryId"
          rules={[{ required: true, message: 'Select a category' }]}
        >
          <Select
            options={categoryOptions}
            placeholder="Select task category"
            onChange={() => {
              form.setFieldsValue({ toTaskId: undefined });
            }}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          shouldUpdate={(prev, current) => prev.categoryId !== current.categoryId}
          noStyle
        >
          {({ getFieldValue }) => {
            const selectedCategory = getFieldValue('categoryId');
            const taskOptions = tasks
              .filter((task) => task.category_id === selectedCategory && task.id !== sourceTask?.id)
              .map((task) => ({
                label: task.name,
                value: task.id
              }));

            return (
              <Form.Item
                label="Care task"
                name="toTaskId"
                rules={[{ required: true, message: 'Select a destination task' }]}
              >
                <Select
                  disabled={!selectedCategory}
                  options={taskOptions}
                  placeholder="Select care task"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BudgetTransferModal;
