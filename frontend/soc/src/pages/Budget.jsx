import React, { useState, useMemo, useCallback } from 'react';
import { Typography, Card, Button, Space, App, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import BudgetSummaryCard from '../components/Budget/BudgetSummaryCard';
import CategoryBudgetCard from '../components/Budget/CategoryBudgetCard';
import BudgetAnalytics from '../components/Budget/BudgetAnalytics';
import CategoryModal from '../components/Budget/CategoryModal';
import AddCareTaskModal from '../components/CareTasks/AddCareTaskModal';
import EditCareTaskModal from '../components/CareTasks/EditCareTaskModal';
import {
  useCategories,
  useCreateCategory
} from '../hooks/useCategories';
import {
  CARE_TASKS_QUERY_KEY,
  useCareTasks,
  useCreateCareTask,
  useUpdateCareTask
} from '../hooks/useCareTasks';
import { useTaskExecutions } from '../hooks/useTaskExecutions';
import { buildBudgetAnalytics } from '../utils/budgetAnalytics';

const BudgetContent = () => {
  const queryClient = useQueryClient();

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState('create');
  const [activeCategory, setActiveCategory] = useState(null);

  const [careTaskModalOpen, setCareTaskModalOpen] = useState(false);
  const [careTaskModalMode, setCareTaskModalMode] = useState('create');
  const [careTaskCategory, setCareTaskCategory] = useState(null);
  const [activeCareTask, setActiveCareTask] = useState(null);

  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const categories = useMemo(
    () => (categoriesResponse?.categories ?? []).map((category) => ({
      ...category,
      color: category.color_code
    })),
    [categoriesResponse]
  );

  const {
    data: careTasksResponse,
    isLoading: careTasksLoading,
    error: careTasksError,
    refetch: refetchCareTasks,
  } = useCareTasks({ is_active: 'all', limit: 500, offset: 0 });

  const careTasks = useMemo(
    () => careTasksResponse?.care_tasks ?? [],
    [careTasksResponse]
  );

  const purchaseTasks = useMemo(
    () => careTasks.filter((task) => task.task_type === 'PURCHASE'),
    [careTasks]
  );

  const taskIds = useMemo(
    () => purchaseTasks.map((task) => task.id).filter(Boolean),
    [purchaseTasks]
  );

  const {
    data: executionsResponse,
    isLoading: executionsLoading,
    error: executionsError,
    refetch: refetchExecutions
  } = useTaskExecutions({
    taskIds,
    params: { limit: 200, offset: 0 }
  });

  const executions = useMemo(
    () => executionsResponse?.executions ?? [],
    [executionsResponse]
  );

  const budgetAnalytics = useMemo(() => buildBudgetAnalytics({
    categories,
    careTasks: purchaseTasks,
    executions
  }), [categories, purchaseTasks, executions]);

  const createCareTask = useCreateCareTask();
  const updateCareTask = useUpdateCareTask();
  const createCategoryMutation = useCreateCategory();

  const isLoading = categoriesLoading || careTasksLoading || (taskIds.length > 0 && executionsLoading);

  const error = categoriesError || careTasksError || executionsError;

  const careTasksById = useMemo(() => {
    const map = new Map();
    careTasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [careTasks]);

  const closeCategoryModal = useCallback(() => {
    setCategoryModalOpen(false);
    setCategoryModalMode('create');
    setActiveCategory(null);
  }, []);

  const closeCareTaskModal = useCallback(() => {
    setCareTaskModalOpen(false);
    setCareTaskModalMode('create');
    setCareTaskCategory(null);
    setActiveCareTask(null);
  }, []);

  const handleAddCategory = () => {
    setCategoryModalMode('create');
    setActiveCategory(null);
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setCategoryModalMode('edit');
    setActiveCategory(category);
    setCategoryModalOpen(true);
  };

  const handleAddCareTask = (category) => {
    setCareTaskCategory(category);
    setCareTaskModalMode('create');
    setActiveCareTask(null);
    setCareTaskModalOpen(true);
  };

  const handleEditCareTask = (taskSummary) => {
    const fullTask = careTasksById.get(taskSummary.id);
    if (!fullTask) {
      message.error('Unable to load care task details');
      return;
    }
    setCareTaskCategory(categories.find((category) => category.id === fullTask.category_id) || null);
    setActiveCareTask(fullTask);
    setCareTaskModalMode('edit');
    setCareTaskModalOpen(true);
  };

  const handleCreateCareTask = useCallback(async (payload) => {
    try {
      const result = await createCareTask.mutateAsync({
        ...payload,
        task_type: 'PURCHASE',
        yearly_budget:
          payload.yearly_budget !== undefined
            ? payload.yearly_budget
            : null
      });
      const createdTask = result?.data;
      if (createdTask?.id) {
        queryClient.setQueriesData({ queryKey: [CARE_TASKS_QUERY_KEY] }, (oldData) => {
          if (!oldData) {
            return oldData;
          }

          if (Array.isArray(oldData.care_tasks)) {
            return {
              ...oldData,
              care_tasks: [createdTask, ...oldData.care_tasks]
            };
          }

          if (Array.isArray(oldData)) {
            return [createdTask, ...oldData];
          }

          return oldData;
        });
      }
      await refetchCareTasks();
      await refetchExecutions();
    } catch (err) {
      message.error(err?.message || 'Failed to create care task');
      throw err;
    }
  }, [createCareTask, queryClient, refetchCareTasks, refetchExecutions]);

  const handleUpdateCareTask = useCallback(async (payload) => {
    if (!activeCareTask) {
      return;
    }
    try {
      const finalPayload = {
        ...payload,
        task_type: 'PURCHASE',
        yearly_budget:
          payload.yearly_budget !== undefined
            ? payload.yearly_budget
            : activeCareTask.yearly_budget ?? null
      };

      const result = await updateCareTask.mutateAsync({
        id: activeCareTask.id,
        payload: finalPayload
      });
      const updatedTask = result?.data;
      if (updatedTask?.id) {
        queryClient.setQueriesData({ queryKey: [CARE_TASKS_QUERY_KEY] }, (oldData) => {
          if (!oldData) {
            return oldData;
          }

          if (Array.isArray(oldData.care_tasks)) {
            return {
              ...oldData,
              care_tasks: oldData.care_tasks.map((task) =>
                task.id === updatedTask.id ? { ...task, ...updatedTask } : task
              )
            };
          }

          if (Array.isArray(oldData)) {
            return oldData.map((task) =>
              task.id === updatedTask.id ? { ...task, ...updatedTask } : task
            );
          }

          return oldData;
        });
      }
      await refetchCareTasks();
      await refetchExecutions();
    } catch (err) {
      message.error(err?.message || 'Failed to update care task');
      throw err;
    }
  }, [activeCareTask, queryClient, updateCareTask, refetchCareTasks, refetchExecutions]);

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
              Add category
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
        open={categoryModalOpen}
        onCancel={closeCategoryModal}
        mode={categoryModalMode}
        category={activeCategory}
      />

      <AddCareTaskModal
        open={careTaskModalOpen && careTaskModalMode === 'create'}
        onClose={closeCareTaskModal}
        onSubmit={handleCreateCareTask}
        submitting={createCareTask.isPending}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onCreateCategory={async ({ name }) => {
          const trimmedName = (name || '').trim();
          const result = await createCategoryMutation.mutateAsync({
            name: trimmedName,
            description: trimmedName ? `${trimmedName} category` : '',
            color_code: '#1890ff'
          });
          return result?.data;
        }}
        defaultTaskType="PURCHASE"
        isTaskTypeEditable={false}
        initialCategoryId={careTaskCategory?.id || null}
        initialCategoryName={careTaskCategory?.name || ''}
      />

      <EditCareTaskModal
        open={careTaskModalOpen && careTaskModalMode === 'edit'}
        onClose={closeCareTaskModal}
        onSubmit={handleUpdateCareTask}
        submitting={updateCareTask.isPending}
        task={activeCareTask}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onCreateCategory={async ({ name }) => {
          const trimmedName = (name || '').trim();
          const result = await createCategoryMutation.mutateAsync({
            name: trimmedName,
            description: trimmedName ? `${trimmedName} category` : '',
            color_code: '#1890ff'
          });
          return result?.data;
        }}
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
