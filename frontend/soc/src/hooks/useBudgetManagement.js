import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCategories,
  useCreateCategory
} from './useCategories';
import {
  CARE_TASKS_QUERY_KEY,
  useCareTasks,
  useCreateCareTask,
  useUpdateCareTask
} from './useCareTasks';
import { useTaskExecutions } from './useTaskExecutions';
import { buildBudgetAnalytics } from '../utils/budgetAnalytics';

const defaultCategoryModalState = {
  open: false,
  mode: 'create',
  category: null
};

const defaultCareTaskModalState = {
  open: false,
  mode: 'create',
  category: null,
  task: null
};

export const useBudgetManagement = () => {
  const queryClient = useQueryClient();

  const [categoryModalState, setCategoryModalState] = useState(defaultCategoryModalState);
  const [careTaskModalState, setCareTaskModalState] = useState(defaultCareTaskModalState);

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const categories = useMemo(
    () => (categoriesResponse?.categories ?? []).map((category) => ({
      ...category,
      color: category.color_code
    })),
    [categoriesResponse]
  );

  const createCategoryMutation = useCreateCategory();

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

  const careTasksById = useMemo(() => {
    const map = new Map();
    careTasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [careTasks]);

  const openCategoryModal = useCallback((mode, category = null) => {
    setCategoryModalState({
      open: true,
      mode,
      category
    });
  }, []);

  const closeCategoryModal = useCallback(() => {
    setCategoryModalState(defaultCategoryModalState);
  }, []);

  const openCareTaskModal = useCallback((mode, payload = {}) => {
    setCareTaskModalState({
      open: true,
      mode,
      category: payload.category ?? null,
      task: payload.task ?? null
    });
  }, []);

  const closeCareTaskModal = useCallback(() => {
    setCareTaskModalState(defaultCareTaskModalState);
  }, []);

  const handleAddCategory = useCallback(() => {
    openCategoryModal('create');
  }, [openCategoryModal]);

  const handleEditCategory = useCallback((category) => {
    openCategoryModal('edit', category);
  }, [openCategoryModal]);

  const handleAddCareTask = useCallback((category) => {
    openCareTaskModal('create', { category, task: null });
  }, [openCareTaskModal]);

  const handleEditCareTask = useCallback((taskSummary) => {
    const fullTask = careTasksById.get(taskSummary.id);
    if (!fullTask) {
      message.error('Unable to load care task details');
      return;
    }
    const category = categories.find((item) => item.id === fullTask.category_id) || null;
    openCareTaskModal('edit', { category, task: fullTask });
  }, [careTasksById, categories, openCareTaskModal]);

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
    const activeCareTask = careTaskModalState.task;
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
  }, [careTaskModalState.task, queryClient, updateCareTask, refetchCareTasks, refetchExecutions]);

  const handleCreateCategory = useCallback(async ({ name }) => {
    const trimmedName = (name || '').trim();
    const result = await createCategoryMutation.mutateAsync({
      name: trimmedName,
      description: trimmedName ? `${trimmedName} category` : '',
      color_code: '#1890ff'
    });
    return result?.data;
  }, [createCategoryMutation]);

  const isLoading = categoriesLoading || careTasksLoading || (taskIds.length > 0 && executionsLoading);
  const error = categoriesError || careTasksError || executionsError;

  return {
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
  };
};

export default useBudgetManagement;
