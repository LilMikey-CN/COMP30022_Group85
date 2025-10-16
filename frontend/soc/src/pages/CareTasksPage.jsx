import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Alert,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  CopyOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useCareTasks,
  useCreateCareTask,
  useUpdateCareTask,
  useDeactivateCareTask,
  useCreateManualExecution,
  useGenerateRemainingExecutions,
} from '../hooks/useCareTasks';
import { useCategories, useCreateCategory } from '../hooks/useCategories';
import TaskDetailsDrawer from '../components/CareTasks/TaskDetailsDrawer';
import AddCareTaskModal from '../components/CareTasks/AddCareTaskModal';
import EditCareTaskModal from '../components/CareTasks/EditCareTaskModal';
import ManualExecutionModal from '../components/CareTasks/ManualExecutionModal';
import { showErrorMessage } from '../utils/messageConfig';
import SortableColumnTitle from '../components/common/SortableColumnTitle';
import {
  buildCategoryMap,
  describeRecurrence,
  filterCareTasks,
  sortCareTasks
} from '../utils/careTasks';
import {
  TASK_SCHEDULING_ROUTE,
  createTaskSchedulingNavigationState
} from '../utils/taskSchedulingNavigation';
import {
  CARE_TASK_DEFAULT_FILTERS,
  CARE_TASK_DEFAULT_PAGINATION,
  buildCareTaskDefaultPagination,
  buildCareTaskDefaultSort,
  isCareTaskFilterStateDefault
} from '../utils/careTaskFilters';
import { buildCareTaskNameSet } from '../utils/careTaskNameUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CareTasksPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(CARE_TASK_DEFAULT_FILTERS.searchTerm);
  const [typeFilter, setTypeFilter] = useState(CARE_TASK_DEFAULT_FILTERS.typeFilter);
  const [startRange, setStartRange] = useState(CARE_TASK_DEFAULT_FILTERS.startRange);
  const [yearFilter, setYearFilter] = useState(CARE_TASK_DEFAULT_FILTERS.yearFilter);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [manualTask, setManualTask] = useState(null);
  const [createModalInitialValues, setCreateModalInitialValues] = useState(null);
  const currentYearRef = useMemo(() => dayjs().year(), []);
  const [sortConfig, setSortConfig] = useState(() => buildCareTaskDefaultSort());
  const [taskPagination, setTaskPagination] = useState(() => buildCareTaskDefaultPagination());

  useEffect(() => {
    if (location.state?.focusTaskId) {
      setSelectedTaskId(location.state.focusTaskId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const {
    data: careTasksResponse,
    isFetching: isCareTasksFetching,
    error: careTasksError,
    refetch: refetchCareTasks,
  } = useCareTasks({ is_active: 'true', limit: 500, offset: 0 });
  const {
    data: categoriesResponse,
    isFetching: isCategoriesFetching,
    refetch: refetchCategories
  } = useCategories();
  const createCategory = useCreateCategory();
  const categories = useMemo(() => categoriesResponse?.categories || [], [categoriesResponse]);
  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);

  const handleCreateCategory = useCallback(
    async ({ name }) => {
      const response = await createCategory.mutateAsync({ name });
      await refetchCategories();
      return response?.data;
    },
    [createCategory, refetchCategories]
  );

  const careTasks = useMemo(() => careTasksResponse?.care_tasks || [], [careTasksResponse]);
  const existingTaskNames = useMemo(() => buildCareTaskNameSet(careTasks, dayjs()), [careTasks]);

  const createCareTask = useCreateCareTask();
  const updateCareTask = useUpdateCareTask();
  const deactivateCareTask = useDeactivateCareTask();
  const generateRemainingExecutions = useGenerateRemainingExecutions();
  const createManualExecution = useCreateManualExecution();

  const filteredTasks = useMemo(() => filterCareTasks(careTasks, {
    searchTerm,
    typeFilter,
    startRange
  }).filter((task) => {
    if (yearFilter === 'all') {
      return true;
    }
    const startDate = task?.start_date ? dayjs(task.start_date) : null;
    if (!startDate?.isValid()) {
      return yearFilter !== 'current';
    }
    const taskYear = startDate.year();
    const currentYear = dayjs().year();
    if (yearFilter === 'current') {
      return taskYear === currentYear;
    }
    return taskYear < currentYear;
  }), [careTasks, searchTerm, typeFilter, startRange, yearFilter]);

  const sortedTasks = useMemo(
    () => sortCareTasks(filteredTasks, sortConfig, categoryMap),
    [categoryMap, filteredTasks, sortConfig]
  );

  const handleSort = useCallback((field) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          order: prev.order === 'ascend' ? 'descend' : 'ascend'
        };
      }
      return { field, order: 'ascend' };
    });
  }, []);

  useEffect(() => {
    setTaskPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchTerm, typeFilter, startRange, yearFilter, sortConfig, careTasks.length]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sortedTasks.length / taskPagination.pageSize));
    if (taskPagination.current > maxPage) {
      setTaskPagination((prev) => ({ ...prev, current: maxPage }));
    }
  }, [sortedTasks.length, taskPagination.pageSize, taskPagination]);

  const handleCreateTask = useCallback(async (payload) => {
    await createCareTask.mutateAsync(payload);
    await refetchCareTasks();
  }, [createCareTask, refetchCareTasks]);

  const handleUpdateTask = useCallback(async (id, payload) => {
    await updateCareTask.mutateAsync({ id, payload });
    await refetchCareTasks();
  }, [updateCareTask, refetchCareTasks]);

  const handleManualSubmit = useCallback(async (payload) => {
    if (!manualTask) return;
    try {
      await createManualExecution.mutateAsync({ taskId: manualTask.id, payload });
      setManualTask(null);
    } catch (error) {
      showErrorMessage(error.message || 'Failed to create execution');
    }
  }, [createManualExecution, manualTask]);

  const handleGenerateRemainingExecutions = useCallback((task) => {
    generateRemainingExecutions.mutate(task.id);
  }, [generateRemainingExecutions]);

  const handleDeactivateTask = useCallback(async (task) => {
    if (!task?.id) {
      return;
    }
    try {
      await deactivateCareTask.mutateAsync(task.id);
      setSelectedTaskId(null);
      await refetchCareTasks();
    } catch (error) {
      showErrorMessage(error.message || 'Failed to deactivate care task');
    }
  }, [deactivateCareTask, refetchCareTasks]);

  const handleReplicateTask = useCallback((task) => {
    if (!task) {
      return;
    }
    const category = categoryMap.get(task.category_id);
    setCreateModalInitialValues({
      name: task.name || '',
      description: task.description || '',
      task_type: task.task_type || 'GENERAL',
      recurrence_interval_days: task.recurrence_interval_days ?? 0,
      category_id: task.category_id || null,
      category_name: category?.name || task.category_id || '',
      yearly_budget: task.yearly_budget ?? null,
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: null,
    });
    setIsCreateModalOpen(true);
  }, [categoryMap]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  const isHistoryTask = useCallback((task) => {
    if (!task?.start_date) {
      return false;
    }
    const startDate = dayjs(task.start_date);
    if (!startDate.isValid()) {
      return false;
    }
    return startDate.year() < currentYearRef;
  }, [currentYearRef]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm(CARE_TASK_DEFAULT_FILTERS.searchTerm);
    setTypeFilter(CARE_TASK_DEFAULT_FILTERS.typeFilter);
    setStartRange(CARE_TASK_DEFAULT_FILTERS.startRange);
    setYearFilter(CARE_TASK_DEFAULT_FILTERS.yearFilter);
    setSortConfig(buildCareTaskDefaultSort());
    setTaskPagination((prev) => ({
      ...prev,
      current: CARE_TASK_DEFAULT_PAGINATION.current,
    }));
  }, []);

  const canResetFilters = useMemo(
    () => !isCareTaskFilterStateDefault({
      searchTerm,
      typeFilter,
      startRange,
      yearFilter,
      sortConfig,
    }),
    [
      searchTerm,
      typeFilter,
      startRange,
      yearFilter,
      sortConfig,
    ]
  );

  const handleNavigateToExecutions = useCallback((task) => {
    if (!task) {
      return;
    }
    const navState = createTaskSchedulingNavigationState(task.name);
    navigate(TASK_SCHEDULING_ROUTE, { state: navState });
  }, [navigate]);

  const columns = useMemo(() => ([
    {
      title: (
        <SortableColumnTitle
          label="Name"
          field="name"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'name',
      render: (value, task) => (
        <Typography.Link onClick={() => handleNavigateToExecutions(task)}>
          {value || 'Untitled task'}
        </Typography.Link>
      ),
    },
    {
      title: (
        <SortableColumnTitle
          label="Type"
          field="task_type"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'task_type',
      render: (value) => (value === 'PURCHASE' ? 'Purchase' : 'General'),
    },
    {
      title: (
        <SortableColumnTitle
          label="Category"
          field="category"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      key: 'category',
      render: (_, task) => {
        const category = categoryMap.get(task.category_id);
        if (!category) {
          return <Tag>Uncategorised</Tag>;
        }
        return (
          <Tag color={category.color || 'default'}>
            {category.name || 'Uncategorised'}
          </Tag>
        );
      }
    },
    {
      title: (
        <SortableColumnTitle
          label="Yearly budget"
          field="yearly_budget"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      key: 'yearly_budget',
      align: 'right',
      render: (_, task) => {
        if (task.yearly_budget === null || task.yearly_budget === undefined) {
          return '—';
        }
        return currencyFormatter.format(Number(task.yearly_budget));
      },
    },
    {
      title: (
        <SortableColumnTitle
          label="Recurrence"
          field="recurrence_interval_days"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'recurrence_interval_days',
      render: (value) => describeRecurrence(value),
    },
    {
      title: (
        <SortableColumnTitle
          label="Start"
          field="start_date"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'start_date',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—'),
    },
    {
      title: (
        <SortableColumnTitle
          label="End"
          field="end_date"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'end_date',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, task) => (
        <Space size="small">
          <Tooltip title="View details">
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => setSelectedTaskId(task.id)}
            />
          </Tooltip>
          <Tooltip title="Edit task">
            <Button
              size="small"
              onClick={() => setEditTask(task)}
            >
              Edit
            </Button>
          </Tooltip>
          {isHistoryTask(task) && (
            <Tooltip title="Copy this task into the current year with today's start date">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleReplicateTask(task)}
              >
                Replicate
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]), [categoryMap, currencyFormatter, handleNavigateToExecutions, handleReplicateTask, handleSort, isHistoryTask, sortConfig]);

  const handleRefresh = () => {
    refetchCareTasks();
  };

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 0, color: '#5a7a9a' }}>Care tasks</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Manage recurring and one-off care tasks. Use task scheduling to view execution history and upcoming runs.
            </Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isCareTasksFetching}>
              Refresh
            </Button>
            <Button
              icon={<CalendarOutlined />}
              onClick={() => navigate('/task-scheduling')}
            >
              Task scheduling
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreateModalInitialValues(null);
                setIsCreateModalOpen(true);
              }}
            >
              New care task
            </Button>
          </Space>
        </Space>

        {careTasksError && (
          <Alert
            type="error"
            showIcon
            message="Failed to load care tasks"
            description={careTasksError.message}
          />
        )}

        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space align="center" wrap style={{ justifyContent: 'space-between', width: '100%' }}>
              <Input
                placeholder="Search by name or description"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                allowClear
                style={{ minWidth: 260, maxWidth: 360 }}
              />
              <Space wrap>
                <Tooltip title="Clear search, filters, and sort">
                  <span style={{ display: 'inline-block' }}>
                    <Button
                      icon={<ClearOutlined />}
                      onClick={handleResetFilters}
                      disabled={!canResetFilters}
                    >
                      Reset filters
                    </Button>
                  </span>
                </Tooltip>
                <Select value={yearFilter} onChange={setYearFilter} style={{ width: 180 }}>
                  <Option value="all">All tasks</Option>
                  <Option value="current">Current year</Option>
                  <Option value="history">History</Option>
                </Select>
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 150 }}>
                  <Option value="all">All types</Option>
                  <Option value="GENERAL">General</Option>
                  <Option value="PURCHASE">Purchase</Option>
                </Select>
                <RangePicker
                  value={startRange}
                  onChange={(range) => setStartRange(range)}
                  placeholder={['Start from', 'Start to']}
                  allowClear
                />
                <Select
                  value={String(taskPagination.pageSize)}
                  style={{ width: 140 }}
                  onChange={(value) =>
                    setTaskPagination({ current: 1, pageSize: Number(value) })
                  }
                >
                  <Option value="10">10 / page</Option>
                  <Option value="20">20 / page</Option>
                  <Option value="50">50 / page</Option>
                </Select>
              </Space>
            </Space>
          </Space>
        </Card>

        <Card>
          <Table
            rowKey="id"
            dataSource={sortedTasks}
            columns={columns}
            loading={isCareTasksFetching}
            pagination={{
              current: taskPagination.current,
              pageSize: taskPagination.pageSize,
              total: sortedTasks.length,
              onChange: (page, pageSize) => setTaskPagination({ current: page, pageSize }),
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              showSizeChanger: false,
            }}
            locale={{
              emptyText: (
                <div style={{ padding: 32, textAlign: 'center' }}>
                  <CalendarOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                  <div style={{ marginTop: 12 }}>No care tasks found</div>
                </div>
              )
            }}
          />
        </Card>
      </Space>

      <AddCareTaskModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalInitialValues(null);
        }}
        onSubmit={handleCreateTask}
        submitting={createCareTask.isLoading || createCategory.isLoading}
        categories={categories}
        categoriesLoading={isCategoriesFetching || createCategory.isLoading}
        onCreateCategory={handleCreateCategory}
        initialValues={createModalInitialValues}
        existingNames={existingTaskNames}
      />

      <EditCareTaskModal
        open={!!editTask}
        task={editTask}
        onClose={() => setEditTask(null)}
        onSubmit={(values) => handleUpdateTask(editTask.id, values)}
        submitting={updateCareTask.isLoading || createCategory.isLoading}
        categories={categories}
        categoriesLoading={isCategoriesFetching || createCategory.isLoading}
        onCreateCategory={handleCreateCategory}
        existingNames={existingTaskNames}
      />

      <ManualExecutionModal
        open={!!manualTask}
        onClose={() => setManualTask(null)}
        onSubmit={handleManualSubmit}
        submitting={createManualExecution.isLoading}
        taskStartDate={manualTask?.start_date || null}
      />

      <TaskDetailsDrawer
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onEdit={(task) => setEditTask(task)}
        onManualExecution={(task) => setManualTask(task)}
        onGenerateRemaining={handleGenerateRemainingExecutions}
        onDeactivate={handleDeactivateTask}
        deactivating={deactivateCareTask.isLoading}
        generatingRemaining={generateRemainingExecutions.isLoading}
        onReplicate={handleReplicateTask}
      />
    </div>
  );
};

export default CareTasksPage;
