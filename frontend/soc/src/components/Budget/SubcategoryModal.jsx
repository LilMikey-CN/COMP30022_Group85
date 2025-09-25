import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Select, message } from 'antd';
import { useCreateSubcategory, useUpdateSubcategory, useCategories } from '../../hooks/useBudgetQuery';

const { Option } = Select;

const SubcategoryModal = ({
  open,
  onCancel,
  mode, // 'create' or 'edit'
  category = null,
  subcategory = null,
  patientId
}) => {
  const [form] = Form.useForm();
  const { data: categories = [] } = useCategories(patientId);
  const createSubcategoryMutation = useCreateSubcategory(patientId);
  const updateSubcategoryMutation = useUpdateSubcategory(patientId);

  const isLoading = createSubcategoryMutation.isPending || updateSubcategoryMutation.isPending;

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && subcategory && category) {
        form.setFieldsValue({
          name: subcategory.name,
          parentCategory: category.id
        });
      } else if (mode === 'create' && category) {
        form.resetFields();
        form.setFieldsValue({
          parentCategory: category.id
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, category, subcategory, form]);

  const handleSubmit = async (values) => {
    try {
      if (mode === 'create') {
        const result = await createSubcategoryMutation.mutateAsync({
          categoryId: values.parentCategory,
          subcategoryData: {
            name: values.name
          }
        });
        message.success(result.message);
      } else if (mode === 'edit' && subcategory && category) {
        const result = await updateSubcategoryMutation.mutateAsync({
          categoryId: category.id,
          subcategoryId: subcategory.id,
          updateData: {
            name: values.name
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

  const selectedCategory = categories.find(cat => cat.id === form.getFieldValue('parentCategory'));

  return (
    <Modal
      title={mode === 'create' ? 'Create New Subcategory' : 'Edit Subcategory'}
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
          name="parentCategory"
          label="Parent Category"
          rules={[{ required: true, message: 'Please select a parent category' }]}
        >
          <Select
            placeholder="Select parent category"
            disabled={mode === 'edit'} // Can't change parent in edit mode
          >
            {categories.map(cat => (
              <Option key={cat.id} value={cat.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: cat.color
                    }}
                  />
                  {cat.name}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="name"
          label="Subcategory Name"
          rules={[
            { required: true, message: 'Please enter a subcategory name' },
            { min: 2, message: 'Subcategory name must be at least 2 characters' },
            { max: 50, message: 'Subcategory name cannot exceed 50 characters' }
          ]}
        >
          <Input
            placeholder="e.g., Toothbrush, Bedsheets, Medications"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          name={"amount"}
          label="Initial Amount"

        >
          <Input
            placeholder="e.g., 50.00"
            type="number"
            step="0.01"
            min="0"
          />
        </Form.Item>

        {/*Input the interval */}
        <Form.Item
          name={"interval"}
          label="Interval"
          rules={[{ required: true, message: 'Please select an interval' }]}
        >
          <Select placeholder="Select interval">
            <Option value="one-time">One-Time</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
            <Option value="yearly">Yearly</Option>
            <Option value="other">Other</Option> {/*Specific days of interval*/}
          </Select>
        </Form.Item>



        {/* Information about parent category */}
        {selectedCategory && (
          <div style={{
            background: '#f0f7ff',
            border: '1px solid #d0e5ff',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#1976d2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: selectedCategory.color
                }}
              />
              <span style={{ fontWeight: 500 }}>
                Parent Category: {selectedCategory.name}
              </span>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {selectedCategory.description}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Current subcategories: {selectedCategory.subcategories?.length || 0}
            </div>
          </div>
        )}

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
            {mode === 'create' ? 'Create Subcategory' : 'Save Changes'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default SubcategoryModal;
