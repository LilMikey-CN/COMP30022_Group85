import React, { useState } from 'react';
import { Typography, Card, Button, Progress, Space, Dropdown, Modal, Form, Input, Select, App } from 'antd';
import { PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { budgetData, formatCurrency, calculatePercentageSpent, getAvailableForSubcategories, getTotalAllocatedInSubcategories } from '../data/budgetData';

const { Title, Text } = Typography;
const { Option } = Select;

const BudgetContent = () => {
  const { patientId: _patientId } = useParams();
  const [data, setData] = useState(budgetData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Use App hooks for React 19 compatibility
  const { message, notification, modal } = App.useApp();

  // Future React Query integration hooks would go here
  // const { data: budgetData, isLoading, error } = useBudgetData(patientId);
  // const createCategoryMutation = useMutation(createCategory);
  // const updateCategoryMutation = useMutation(updateCategory);
  // const deleteCategoryMutation = useMutation(deleteCategory);

  // Modal handlers
  const openModal = (type, category = null, subcategory = null) => {
    setModalType(type);
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setIsModalVisible(true);

    // Pre-fill form for edit operations
    if (type === 'editCategory' && category) {
      form.setFieldsValue({
        name: category.name,
        budget: category.budget
      });
    } else if (type === 'editSubcategory' && subcategory) {
      form.setFieldsValue({
        name: subcategory.name,
        budget: subcategory.budget,
        parentCategory: category.id
      });
    } else if (type === 'addSubcategory' && category) {
      form.setFieldsValue({
        parentCategory: category.id
      });
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalType('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    form.resetFields();
  };

  // CRUD operations - Simplified approach
  const handleSubmit = (values) => {
    console.log('Form submitted with values:', values);

    try {
      const newData = { ...data };
      let successMessage = '';

      switch (modalType) {
        case 'addCategory': {
          const newCategory = {
            id: values.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: values.name,
            budget: parseFloat(values.budget),
            spent: 0,
            remaining: parseFloat(values.budget),
            subcategories: []
          };
          newData.categories.push(newCategory);
          newData.totalBudget += parseFloat(values.budget);
          newData.totalRemaining += parseFloat(values.budget);
          successMessage = `Category "${values.name}" created successfully`;
          break;
        }

        case 'editCategory': {
          const categoryIndex = newData.categories.findIndex(c => c.id === selectedCategory.id);
          if (categoryIndex !== -1) {
            const budgetDiff = parseFloat(values.budget) - selectedCategory.budget;
            newData.categories[categoryIndex] = {
              ...selectedCategory,
              name: values.name,
              budget: parseFloat(values.budget),
              remaining: selectedCategory.remaining + budgetDiff
            };
            newData.totalBudget += budgetDiff;
            newData.totalRemaining += budgetDiff;
          }
          successMessage = `Category "${values.name}" updated successfully`;
          break;
        }

        case 'addSubcategory': {
          const parentCategoryIndex = newData.categories.findIndex(c => c.id === values.parentCategory);
          if (parentCategoryIndex !== -1) {
            const newSubcategory = {
              id: values.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
              name: values.name,
              budget: parseFloat(values.budget),
              spent: 0,
              remaining: parseFloat(values.budget)
            };
            newData.categories[parentCategoryIndex].subcategories.push(newSubcategory);
          }
          successMessage = `Subcategory "${values.name}" created successfully`;
          break;
        }

        case 'editSubcategory': {
          const catIndex = newData.categories.findIndex(c => c.id === selectedCategory.id);
          if (catIndex !== -1) {
            const subIndex = newData.categories[catIndex].subcategories.findIndex(s => s.id === selectedSubcategory.id);
            if (subIndex !== -1) {
              newData.categories[catIndex].subcategories[subIndex] = {
                ...selectedSubcategory,
                name: values.name,
                budget: parseFloat(values.budget),
                remaining: selectedSubcategory.remaining + (parseFloat(values.budget) - selectedSubcategory.budget)
              };
            }
          }
          successMessage = `Subcategory "${values.name}" updated successfully`;
          break;
        }
      }

      // Update state immediately
      setData(newData);
      closeModal();

      // Show success message using React 19 compatible hooks
      console.log('About to show success message:', successMessage);
      message.success(successMessage);
      console.log('message.success called');

    } catch (error) {
      console.error('Operation failed:', error);
      message.error('Failed to save changes. Please try again.');
    }
  };

  const handleDeleteCategory = (category) => {
    console.log('Delete category clicked:', category.name);

    const subcategoryCount = category.subcategories ? category.subcategories.length : 0;
    const subcategoryText = subcategoryCount > 0
      ? ` and ${subcategoryCount} subcategory${subcategoryCount > 1 ? 'ies' : ''}`
      : '';

    modal.confirm({
      title: 'Delete Category',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${category.name}"? This will permanently remove the category${subcategoryText}. This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        console.log('Delete confirmed for:', category.name);

        const newData = { ...data };
        newData.categories = newData.categories.filter(c => c.id !== category.id);
        newData.totalBudget -= category.budget;
        newData.totalRemaining -= category.remaining;
        setData(newData);

        console.log('About to show delete success message');
        message.success(`"${category.name}" deleted successfully`);
        console.log('Delete completed');
      },
    });
  };

  const handleDeleteSubcategory = (category, subcategory) => {
    console.log('Delete subcategory clicked:', subcategory.name);

    modal.confirm({
      title: 'Delete Subcategory',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${subcategory.name}"? The budget will be returned to "${category.name}". This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        console.log('Delete subcategory confirmed for:', subcategory.name);

        const newData = { ...data };
        const categoryIndex = newData.categories.findIndex(c => c.id === category.id);
        if (categoryIndex !== -1) {
          // Remove the subcategory
          const updatedSubcategories = newData.categories[categoryIndex].subcategories.filter(s => s.id !== subcategory.id);
          newData.categories[categoryIndex].subcategories = updatedSubcategories;

          // Recalculate category remaining: budget - spent - total_subcategory_budgets
          const totalSubcategoryBudgets = getTotalAllocatedInSubcategories(updatedSubcategories);
          newData.categories[categoryIndex].remaining =
            newData.categories[categoryIndex].budget -
            newData.categories[categoryIndex].spent -
            totalSubcategoryBudgets;
        }
        setData(newData);

        console.log('About to show subcategory delete success message');
        message.success(`"${subcategory.name}" deleted successfully`);
        console.log('Subcategory delete completed');
      },
    });
  };

  // Calculate overall progress
  const overallProgress = calculatePercentageSpent(data.totalSpent, data.totalBudget);

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Budget
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Track costs and spending for your scheduled items
        </Text>
      </div>

      {/* Total Budget Summary */}
      <Card
        style={{ marginBottom: '24px' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50' }}>
              Total Budget Summary
            </span>
            <EditOutlined style={{ fontSize: '16px', color: '#5a7a9a', cursor: 'pointer' }} />
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Budget
            </div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#5e72e4' }}>
              {formatCurrency(data.totalBudget)}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Remaining
            </div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#2dce89' }}>
              {formatCurrency(data.totalRemaining)}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Spent
            </div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#f5365c' }}>
              {formatCurrency(data.totalSpent)}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <Text style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '8px', display: 'block' }}>
            Budget spent
          </Text>
          <Progress
            percent={overallProgress}
            strokeColor="#5e72e4"
            trailColor="#e9ecef"
            showInfo={false}
            style={{ marginBottom: '4px' }}
          />
          <Text style={{ fontSize: '14px', color: '#7f8c8d', float: 'right' }}>
            {overallProgress}%
          </Text>
        </div>
      </Card>

      {/* Category Budgets */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#2c3e50' }}>
              Category Budgets
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal('addCategory')}
              style={{ backgroundColor: '#5e72e4', borderColor: '#5e72e4' }}
            >
              Add category
            </Button>
          </div>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {data.categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              loading={loading}
              onEdit={() => openModal('editCategory', category)}
              onDelete={() => handleDeleteCategory(category)}
              onAddSubcategory={() => openModal('addSubcategory', category)}
              onEditSubcategory={(subcategory) => openModal('editSubcategory', category, subcategory)}
              onDeleteSubcategory={(subcategory) => handleDeleteSubcategory(category, subcategory)}
            />
          ))}
        </Space>
      </Card>

      {/* Modal for CRUD operations */}
      <Modal
        title={getModalTitle()}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={modalType.includes('delete') ? 400 : 480}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );

  function getModalTitle() {
    switch (modalType) {
      case 'addCategory': return 'Add New Category';
      case 'editCategory': return 'Edit Category';
      case 'addSubcategory': return 'Add Subcategory';
      case 'editSubcategory': return 'Edit Subcategory';
      default: return '';
    }
  }

  function renderModalContent() {
    if (modalType.includes('Category') || modalType.includes('Subcategory')) {
      return (
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          {modalType.includes('Subcategory') && (
            <Form.Item
              name="parentCategory"
              label="Parent Category"
              rules={[{ required: true, message: 'Please select a parent category' }]}
            >
              <Select placeholder="Select parent category">
                {data.categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label={modalType.includes('Category') ? 'Category Name' : 'Subcategory Name'}
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder={modalType.includes('Category') ? 'e.g., Transportation, Food, Healthcare' : 'e.g., Jackets, Shoes, Accessories'} />
          </Form.Item>

          <Form.Item
            name="budget"
            label="Budget Amount"
            rules={[
              { required: true, message: 'Please enter a budget amount' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const numValue = parseFloat(value);
                  if (isNaN(numValue) || numValue <= 0) {
                    return Promise.reject(new Error('Budget must be greater than 0'));
                  }
                  return Promise.resolve();
                }
              },
              ...(modalType === 'addSubcategory' && selectedCategory ? [{
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const availableBudget = getAvailableForSubcategories(selectedCategory.budget, selectedCategory.subcategories);
                  if (parseFloat(value) > availableBudget) {
                    return Promise.reject(new Error(`Budget cannot exceed available amount: ${formatCurrency(availableBudget)}`));
                  }
                  return Promise.resolve();
                }
              }] : []),
              ...(modalType === 'editSubcategory' && selectedCategory && selectedSubcategory ? [{
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const otherSubcategories = selectedCategory.subcategories.filter(s => s.id !== selectedSubcategory.id);
                  const availableBudget = getAvailableForSubcategories(selectedCategory.budget, otherSubcategories);
                  if (parseFloat(value) > availableBudget) {
                    return Promise.reject(new Error(`Budget cannot exceed available amount: ${formatCurrency(availableBudget)}`));
                  }
                  return Promise.resolve();
                }
              }] : [])
            ]}
          >
            <Input
              prefix="$"
              placeholder="0.00"
              type="number"
              step="0.01"
            />
          </Form.Item>

          {(modalType === 'addSubcategory' || modalType === 'editSubcategory') && selectedCategory && (
            <div style={{
              background: '#f0f7ff',
              border: '1px solid #d0e5ff',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1976d2'
            }}>
              <div style={{ marginBottom: '4px', fontWeight: 500 }}>
                Available budget from "{selectedCategory.name}":
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {modalType === 'addSubcategory'
                  ? formatCurrency(getAvailableForSubcategories(selectedCategory.budget, selectedCategory.subcategories))
                  : formatCurrency(getAvailableForSubcategories(selectedCategory.budget, selectedCategory.subcategories.filter(s => s.id !== selectedSubcategory?.id)))
                }
              </div>
              {modalType === 'editSubcategory' && selectedSubcategory && (
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                  Current allocation: {formatCurrency(selectedSubcategory.budget)}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
            <Button onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ backgroundColor: '#5e72e4', borderColor: '#5e72e4' }}
            >
              {modalType.includes('add') ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        </Form>
      );
    }

    return null;
  }
};

// Category Card Component
const CategoryCard = ({ category, loading, onEdit, onDelete, onAddSubcategory, onEditSubcategory, onDeleteSubcategory }) => {
  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Category',
      icon: <EditOutlined />,
      onClick: onEdit
    },
    {
      key: 'addSub',
      label: 'Add Subcategory',
      icon: <PlusOutlined />,
      onClick: onAddSubcategory
    },
    {
      key: 'delete',
      label: 'Delete Category',
      icon: <DeleteOutlined />,
      onClick: onDelete,
      danger: true
    }
  ];

  return (
    <div style={{
      border: '1px solid #e9ecef',
      borderRadius: '12px',
      padding: '20px',
      transition: 'box-shadow 0.2s',
      ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
    }}>
      {/* Category Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50', marginBottom: '12px' }}>
            {category.name}
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                Budget
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#2c3e50' }}>
                {formatCurrency(category.budget)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                Remaining
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#2dce89' }}>
                {formatCurrency(category.remaining)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                Spent
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#f5365c' }}>
                {formatCurrency(category.spent)}
              </div>
            </div>
          </div>
        </div>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ width: '36px', height: '36px' }}
            disabled={loading}
          />
        </Dropdown>
      </div>

      {/* Subcategories */}
      {category.subcategories && category.subcategories.length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Subcategories
            </span>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={onAddSubcategory}
              style={{ fontSize: '12px', color: '#5e72e4', padding: 0 }}
            >
              Add subcategory
            </Button>
          </div>

          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {category.subcategories.map(subcategory => (
              <SubcategoryItem
                key={subcategory.id}
                subcategory={subcategory}
                loading={loading}
                onEdit={() => onEditSubcategory(subcategory)}
                onDelete={() => onDeleteSubcategory(subcategory)}
              />
            ))}
          </Space>
        </div>
      )}

      {/* Add subcategory button when no subcategories exist */}
      {(!category.subcategories || category.subcategories.length === 0) && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={onAddSubcategory}
            style={{ width: '100%', color: '#5e72e4', borderColor: '#5e72e4' }}
          >
            Add subcategory
          </Button>
        </div>
      )}
    </div>
  );
};

// Subcategory Item Component
const SubcategoryItem = ({ subcategory, loading, onEdit, onDelete }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      background: '#f8f9fa',
      borderRadius: '8px',
      transition: 'background 0.2s',
      ':hover': { background: '#f1f3f5' }
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2c3e50', minWidth: '120px' }}>
          {subcategory.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', paddingRight: '10px', borderRight: '1px solid #e9ecef' }}>
            <span style={{ color: '#7f8c8d' }}>
              Budget: <span style={{ fontWeight: 600, color: '#2c3e50' }}>{formatCurrency(subcategory.budget)}</span>
            </span>
            <span style={{ color: '#7f8c8d' }}>
              Remaining: <span style={{ fontWeight: 600, color: '#2c3e50' }}>{formatCurrency(subcategory.remaining)}</span>
            </span>
            <span style={{ color: '#7f8c8d' }}>
              Spent: <span style={{ fontWeight: 600, color: '#2c3e50' }}>{formatCurrency(subcategory.spent)}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="small"
              onClick={onEdit}
              disabled={loading}
              style={{ background: '#e3f2fd', color: '#2196f3', border: 'none', fontSize: '11px' }}
            >
              Edit
            </Button>
            <Button
              size="small"
              onClick={onDelete}
              disabled={loading}
              style={{ background: '#ffebee', color: '#f44336', border: 'none', fontSize: '11px' }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with App component for React 19 compatibility
const Budget = () => {
  return (
    <App>
      <BudgetContent />
    </App>
  );
};

export default Budget;