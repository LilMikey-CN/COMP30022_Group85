import React from 'react';
import { Typography, Card, Button, Space, App, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import BudgetSummaryCard from '../components/Budget/BudgetSummaryCard';
import CategoryBudgetCard from '../components/Budget/CategoryBudgetCard';
import BudgetAnalytics from '../components/Budget/BudgetAnalytics';
import CategoryModal from '../components/Budget/CategoryModal';
import AddCareTaskModal from '../components/CareTasks/AddCareTaskModal';
import EditCareTaskModal from '../components/CareTasks/EditCareTaskModal';
import useBudgetManagement from '../hooks/useBudgetManagement';

const BudgetContent = () => {
  const {
    isLoading,
    error,
    categories,
    categoriesLoading,
    budgetAnalytics,
    categoryModalState,
    careTaskModalState,
    createCategoryMutation,
    createCareTask,
    updateCareTask,
    handleAddCategory,
    handleEditCategory,
    handleAddCareTask,
    handleEditCareTask,
    handleCreateCareTask,
    handleUpdateCareTask,
    handleCreateCategory,
    closeCategoryModal,
    closeCareTaskModal,
  } = useBudgetManagement();

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Typography.Text type="danger">
          {error.message || 'Failed to load budget data'}
        </Typography.Text>
      </div>
    );
  }

  if (!budgetAnalytics) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Typography.Text>No budget data available</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Budget Management
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          Track spending and budget allocation across care categories with real-time analytics
        </Typography.Text>
      </div>

      <BudgetSummaryCard budgetAnalytics={budgetAnalytics} />
      <BudgetAnalytics budgetAnalytics={budgetAnalytics} />

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
        title={(
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#2c3e50' }}>
              Category Budgets
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCategory}
              style={{ backgroundColor: '#5e72e4', borderColor: '#5e72e4' }}
              loading={createCategoryMutation.isPending}
            >
              Create category
            </Button>
          </div>
        )}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {budgetAnalytics.categoryBreakdown.map((category) => (
            <CategoryBudgetCard
              key={category.id}
              category={category}
              loading={createCareTask.isPending || updateCareTask.isPending}
              onEditCategory={() => handleEditCategory(category)}
              onAddCareTask={() => handleAddCareTask(category)}
              onEditCareTask={handleEditCareTask}
            />
          ))}
          {budgetAnalytics.categoryBreakdown.length === 0 && (
            <Typography.Text type="secondary">
              Create a category to start tracking budgets.
            </Typography.Text>
          )}
        </Space>
      </Card>

      <CategoryModal
        open={categoryModalState.open}
        onCancel={closeCategoryModal}
        mode={categoryModalState.mode}
        category={categoryModalState.category}
      />

      <AddCareTaskModal
        open={careTaskModalState.open && careTaskModalState.mode === 'create'}
        onClose={closeCareTaskModal}
        onSubmit={handleCreateCareTask}
        submitting={createCareTask.isPending}
        categories={categories}
        categoriesLoading={categoriesLoading || createCategoryMutation.isPending}
        onCreateCategory={handleCreateCategory}
        defaultTaskType="PURCHASE"
        isTaskTypeEditable={false}
        initialCategoryId={careTaskModalState.category?.id || null}
        initialCategoryName={careTaskModalState.category?.name || ''}
      />

      <EditCareTaskModal
        open={careTaskModalState.open && careTaskModalState.mode === 'edit'}
        onClose={closeCareTaskModal}
        onSubmit={handleUpdateCareTask}
        submitting={updateCareTask.isPending}
        task={careTaskModalState.task}
        categories={categories}
        categoriesLoading={categoriesLoading || createCategoryMutation.isPending}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
};

const Budget = () => (
  <App>
    <BudgetContent />
  </App>
);

export default Budget;
