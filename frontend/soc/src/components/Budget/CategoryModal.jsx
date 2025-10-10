import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, ColorPicker, message } from 'antd';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';

const CategoryModal = ({
  open,
  onCancel,
  mode, // 'create' or 'edit'
  category = null
}) => {
  const [form] = Form.useForm();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        form.setFieldsValue({
          name: category.name,
          description: category.description,
          color: category.color || '#1890ff'
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          color: '#1890ff'
        });
      }
    }
  }, [open, mode, category, form]);

  const handleSubmit = async (values) => {
    try {
      if (mode === 'create') {
        const result = await createCategoryMutation.mutateAsync({
          name: values.name,
          description: values.description,
          color_code: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff'
        });
        message.success(result.message);
      } else if (mode === 'edit' && category) {
        const result = await updateCategoryMutation.mutateAsync({
          id: category.id,
          payload: {
            name: values.name,
            description: values.description,
            color_code: typeof values.color === 'string'
              ? values.color
              : values.color?.toHexString?.() || category.color || '#1890ff'
          }
        });
        message.success(result.message);
      }

      form.resetFields();
      onCancel();
    } catch (error) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={mode === 'create' ? 'Create New Category' : 'Edit Category'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: '24px' }}
      >
        <Form.Item
          name="name"
          label="Category Name"
          rules={[
            { required: true, message: 'Please enter a category name' },
            { min: 2, message: 'Category name must be at least 2 characters' },
            { max: 50, message: 'Category name cannot exceed 50 characters' }
          ]}
        >
          <Input
            placeholder="e.g., Healthcare, Transportation, Clothing"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { required: true, message: 'Please enter a description' },
            { min: 5, message: 'Description must be at least 5 characters' },
            { max: 200, message: 'Description cannot exceed 200 characters' }
          ]}
        >
          <Input.TextArea
            placeholder="Describe what this category covers..."
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="color"
          label="Category Color"
          rules={[{ required: true, message: 'Please select a color' }]}
        >
          <ColorPicker
            presets={[
              {
                label: 'Recommended',
                colors: [
                  '#1890ff', // Blue
                  '#52c41a', // Green
                  '#fa8c16', // Orange
                  '#722ed1', // Purple
                  '#eb2f96', // Pink
                  '#13c2c2', // Cyan
                  '#f5222d', // Red
                  '#faad14', // Gold
                ]
              }
            ]}
            showText
            format="hex"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            style={{ backgroundColor: '#5e72e4', borderColor: '#5e72e4' }}
          >
            {mode === 'create' ? 'Create Category' : 'Save Changes'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
