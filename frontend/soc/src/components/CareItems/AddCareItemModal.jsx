import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const AddCareItemModal = ({
  open,
  onClose,
  onSubmit,
  categories = [],
  categoriesLoading = false,
  submitting = false,
}) => {
  const [form] = Form.useForm();
  const startDateValue = Form.useWatch('startDate', form);
  const categorySelection = Form.useWatch('categorySelection', form);

  useEffect(() => {
    if (categorySelection !== '__NEW__') {
      form.setFieldValue('newCategoryName', undefined);
    }
  }, [categorySelection, form]);

  const resetAndClose = () => {
    form.resetFields();
    onClose();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {};

      if (values.name) {
        payload.name = values.name.trim();
      }

      if (values.estimatedUnitCost !== undefined && values.estimatedUnitCost !== null) {
        payload.estimated_unit_cost = Number(values.estimatedUnitCost);
      }

      if (values.quantityPerPurchase !== undefined && values.quantityPerPurchase !== null) {
        payload.quantity_per_purchase = Number(values.quantityPerPurchase);
      }

      if (values.quantityUnit) {
        payload.quantity_unit = values.quantityUnit.trim();
      }

      if (values.startDate) {
        payload.start_date = values.startDate.format('YYYY-MM-DD');
      }

      if (values.endDate) {
        payload.end_date = values.endDate.format('YYYY-MM-DD');
      }

      const submission = {
        careItemPayload: payload,
        category: { type: 'none' },
      };

      if (values.categorySelection === '__NEW__') {
        const trimmedNewCategory = values.newCategoryName?.trim() || '';
        submission.category = {
          type: 'new',
          name: trimmedNewCategory,
        };
      } else if (values.categorySelection) {
        submission.category = {
          type: 'existing',
          id: values.categorySelection,
        };
      }

      await onSubmit(submission);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // Submission errors are surfaced by the mutation handler.
      }
    }
  };

  const handleCancel = () => {
    resetAndClose();
  };

  return (
    <Modal
      title="Add Care Item"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={submitting}
      okText="Create"
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startDate: dayjs(),
          quantityPerPurchase: 1,
        }}
      >
        <Form.Item
          name="name"
          label="Item Name"
          rules={[
            { required: true, message: 'Please enter an item name' },
            { min: 2, message: 'Name must be at least 2 characters' },
          ]}
        >
          <Input placeholder="e.g. Winter jacket" autoFocus />
        </Form.Item>

        <Form.Item
          name="categorySelection"
          label="Category"
        >
          <Select
            placeholder="Select category"
            loading={categoriesLoading}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
            <Option value="__NEW__">+ Create new category</Option>
          </Select>
        </Form.Item>

        {categorySelection === '__NEW__' && (
          <Form.Item
            name="newCategoryName"
            label="New Category Name"
            rules={[
              { required: true, message: 'Please enter a category name' },
              { max: 100, message: 'Category name cannot exceed 100 characters' },
            ]}
          >
            <Input placeholder="e.g. Household essentials" />
          </Form.Item>
        )}

        <Form.Item
          name="estimatedUnitCost"
          label="Estimated Unit Cost"
          rules={[
            { type: 'number', min: 0, message: 'Cost cannot be negative' },
          ]}
        >
          <InputNumber
            placeholder="Enter cost"
            style={{ width: '100%' }}
            min={0}
            step={0.5}
            addonBefore="$"
          />
        </Form.Item>

        <Form.Item
          name="quantityPerPurchase"
          label="Quantity per Purchase"
          rules={[
            { type: 'number', min: 1, message: 'Quantity must be at least 1' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            step={1}
          />
        </Form.Item>

        <Form.Item
          name="quantityUnit"
          label="Quantity Unit"
          rules={[{ max: 50, message: 'Unit cannot exceed 50 characters' }]}
        >
          <Input placeholder="e.g. piece, pack" />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Start Date"
          rules={[{ required: true, message: 'Please select a start date' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="End Date"
          dependencies={['startDate']}
          rules={[
            {
              validator: (_, value) => {
                if (!value || !startDateValue) {
                  return Promise.resolve();
                }
                if (value.isBefore(startDateValue, 'day')) {
                  return Promise.reject(new Error('End date cannot be before start date'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            disabledDate={(current) => {
              if (!startDateValue) {
                return false;
              }
              return current && current.isBefore(startDateValue, 'day');
            }}
            allowClear
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCareItemModal;
