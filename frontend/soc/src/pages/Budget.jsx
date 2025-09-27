import React, { useState } from 'react';
import { Typography, Card, Button, Space, App, Modal, message } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useBudgetAnalytics, useCategories, useDeleteCategory, useDeleteSubcategory } from '../hooks/useBudgetQuery';
import useAuthStore from '../store/authStore';
import BudgetSummaryCard from '../components/Budget/BudgetSummaryCard';
import CategoryBudgetCard from '../components/Budget/CategoryBudgetCard';
import BudgetAnalytics from '../components/Budget/BudgetAnalytics';
import CategoryModal from '../components/Budget/CategoryModal';
import SubcategoryModal from '../components/Budget/SubcategoryModal';

const { Title, Text } = Typography;

const BudgetContent = () => {
  const { user } = useAuthStore();
  const userId = user?.uid;

  // Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Use App hooks for React 19 compatibility
  const { modal } = App.useApp();

  // TanStack Query hooks
  const { data: budgetAnalytics, isLoading: analyticsLoading, error: analyticsError } = useBudgetAnalytics(userId);
  // eslint-disable-next-line no-unused-vars
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(userId);
  const deleteCategoryMutation = useDeleteCategory(userId);
  const deleteSubcategoryMutation = useDeleteSubcategory(userId);

  const isLoading = analyticsLoading || categoriesLoading;

  // Early return if loading or error
  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Typography.Text>Loading budget data...</Typography.Text>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Typography.Text type="danger">Error loading budget data: {analyticsError.message}</Typography.Text>
      </div>
    );
  }

  if (!budgetAnalytics) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Typography.Text>No budget data available</Typography.Text>
      </div>
    );
  }

  // Modal handlers
  const openCategoryModal = (mode, category = null) => {
    setModalMode(mode);
    setSelectedCategory(category);
    setCategoryModalOpen(true);
  };

  const openSubcategoryModal = (mode, category, subcategory = null) => {
    setModalMode(mode);
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSubcategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setSelectedCategory(null);
    setModalMode('create');
  };

  const closeSubcategoryModal = () => {
    setSubcategoryModalOpen(false);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setModalMode('create');
  };

  // CRUD handlers
  const handleAddCategory = () => {
    openCategoryModal('create');
  };

  const handleEditCategory = (category) => {
    openCategoryModal('edit', category);
  };

  const handleDeleteCategory = (category) => {
    modal.confirm({
      title: 'Delete Category',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete "{category.name}"?</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            This will permanently remove the category and cannot be undone.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await deleteCategoryMutation.mutateAsync(category.id);
          message.success(result.message);
        } catch (error) {
          message.error(error.message || 'Failed to delete category');
        }
      },
    });
  };

  const handleAddSubcategory = (category) => {
    openSubcategoryModal('create', category);
  };

  const handleEditSubcategory = (category, subcategory) => {
    openSubcategoryModal('edit', category, subcategory);
  };

  const handleDeleteSubcategory = (category, subcategory) => {
    modal.confirm({
      title: 'Delete Subcategory',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete "{subcategory.name}"?</p>
          <p style={{ color: '#8c8c8c', fontSize: '12px' }}>
            This subcategory will be removed from "{category.name}".
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await deleteSubcategoryMutation.mutateAsync({
            categoryId: category.id,
            subcategoryId: subcategory.id
          });
          message.success(result.message);
        } catch (error) {
          message.error(error.message || 'Failed to delete subcategory');
        }
      },
    });
  };

  // Main render function
  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Typography.Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Budget Management
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: '16px' }}>
          Track spending and budget allocation for care items with real-time analytics
        </Typography.Text>
      </div>

      {/* Budget Summary Card */}
      <BudgetSummaryCard budgetAnalytics={budgetAnalytics} />

      {/* Budget Analytics */}
      <BudgetAnalytics budgetAnalytics={budgetAnalytics} />

      {/* Category Budgets */}
      <Card
        className="budget-page-card"
        style={{
          backgroundColor: '#fafbfc',
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
        headStyle={{
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid #e1e8ed'
        }}
        bodyStyle={{ backgroundColor: '#fafbfc' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#2c3e50' }}>
              Category Budgets
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCategory}
              style={{ backgroundColor: '#5e72e4', borderColor: '#5e72e4' }}
            >
              Add category
            </Button>
          </div>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {budgetAnalytics.categoryBreakdown.map(category => (
            <CategoryBudgetCard
              key={category.id}
              category={category}
              loading={deleteCategoryMutation.isPending || deleteSubcategoryMutation.isPending}
              onEdit={() => handleEditCategory(category)}
              onDelete={() => handleDeleteCategory(category)}
              onAddSubcategory={() => handleAddSubcategory(category)}
              onEditSubcategory={(subcategory) => handleEditSubcategory(category, subcategory)}
              onDeleteSubcategory={(subcategory) => handleDeleteSubcategory(category, subcategory)}
              allTasks={[]}
            />
          ))}
        </Space>
      </Card>

      {/* Category Modal */}
      <CategoryModal
        open={categoryModalOpen}
        onCancel={closeCategoryModal}
        mode={modalMode}
        category={selectedCategory}
        patientId={userId}
      />

      {/* Subcategory Modal */}
      <SubcategoryModal
        open={subcategoryModalOpen}
        onCancel={closeSubcategoryModal}
        mode={modalMode}
        category={selectedCategory}
        subcategory={selectedSubcategory}
        patientId={userId}
      />
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