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
  CaretUpOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useCareTasks,
  useCreateCareTask,
  useUpdateCareTask,
  useDeactivateCareTask,
  useReactivateCareTask,
  useGenerateTaskExecution,
  useCreateManualExecution,
} from '../hooks/useCareTasks';
import { useCategories, useCreateCategory } from '../hooks/useCategories';
import TaskDetailsDrawer from '../components/CareTasks/TaskDetailsDrawer';
import AddCareTaskModal from '../components/CareTasks/AddCareTaskModal';
import EditCareTaskModal from '../components/CareTasks/EditCareTaskModal';
import ManualExecutionModal from '../components/CareTasks/ManualExecutionModal';
import { showErrorMessage } from '../utils/messageConfig';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const describeRecurrence = (interval) => {
  const numeric = Number(interval ?? 0);
  if (numeric === 0) {
    return 'One-off';
  }
  if (numeric === 1) {
    return 'Every day';
  }
  if (numeric === 7) {
    return 'Every week';
  }
  if (numeric === 14) {
    return 'Every 2 weeks';
  }
  if (numeric === 30) {
    return 'Every month';
  }
  if (numeric === 90) {
    return 'Every quarter';
  }
  if (numeric === 365) {
    return 'Every year';
  }
  return `Every ${numeric} days`;
};

const statusTag = (task) => {
  if (task.is_active === false) {
    return <Tag color="default">Inactive</Tag>;
  }
  if (task.end_date && dayjs(task.end_date).isBefore(dayjs(), 'day')) {
    return <Tag color="gold">Ended</Tag>;
  }
  return <Tag color="green">Active</Tag>;
};

const CareTasksPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startRange, setStartRange] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [manualTask, setManualTask] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', order: 'descend' });
  const [taskPagination, setTaskPagination] = useState({ current: 1, pageSize: 10 });

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
  } = useCareTasks({ is_active: 'all', limit: 500, offset: 0 });
  const {
    data: categoriesResponse,
    isFetching: isCategoriesFetching,
    refetch: refetchCategories
  } = useCategories();
  const createCategory = useCreateCategory();
  const categories = useMemo(() => categoriesResponse?.categories || [], [categoriesResponse]);
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      if (category?.id) {
        map.set(category.id, {
          name: category.name,
          color: category.color_code || category.color || undefined,
        });
      }
    });
    return map;
  }, [categories]);

  const handleCreateCategory = useCallback(
    async ({ name }) => {
      const response = await createCategory.mutateAsync({ name });
      await refetchCategories();
      return response?.data;
    },
    [createCategory, refetchCategories]
  );

  const careTasks = useMemo(() => careTasksResponse?.care_tasks || [], [careTasksResponse]);

  const createCareTask = useCreateCareTask();
  const updateCareTask = useUpdateCareTask();
  const deactivateCareTask = useDeactivateCareTask();
  const reactivateCareTask = useReactivateCareTask();
  const generateExecution = useGenerateTaskExecution();
  const createManualExecution = useCreateManualExecution();

  const filteredTasks = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    return careTasks.filter((task) => {
      if (lowered) {
        const name = task.name?.toLowerCase() || '';
        const description = task.description?.toLowerCase() || '';
        if (!name.includes(lowered) && !description.includes(lowered)) {
          return false;
        }
      }

      if (statusFilter === 'active' && task.is_active === false) {
        return false;
      }
      if (statusFilter === 'inactive' && task.is_active !== false) {
        return false;
      }

      if (typeFilter !== 'all' && task.task_type !== typeFilter) {
        return false;
      }

      if (startRange && startRange.length === 2) {
        const [from, to] = startRange;
        if (from && task.start_date && dayjs(task.start_date).isBefore(dayjs(from), 'day')) {
          return false;
        }
        if (to && task.start_date && dayjs(task.start_date).isAfter(dayjs(to), 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [careTasks, searchTerm, statusFilter, typeFilter, startRange]);

  const sortedTasks = useMemo(() => {
    const { field, order } = sortConfig;

    const getValue = (task) => {
      switch (field) {
        case 'name':
          return (task.name || '').toLowerCase();
        case 'task_type':
          return task.task_type || '';
        case 'category': {
          const category = categoryMap.get(task.category_id);
          return category?.name?.toLowerCase?.() || '';
        }
        case 'yearly_budget':
          return Number(task.yearly_budget ?? -Infinity);
        case 'recurrence_interval_days':
          return Number(task.recurrence_interval_days ?? 0);
        case 'start_date':
          return task.start_date ? dayjs(task.start_date).valueOf() : -Infinity;
        case 'end_date':
          return task.end_date ? dayjs(task.end_date).valueOf() : Number.MAX_SAFE_INTEGER;
        case 'status':
          return task.is_active === false ? 0 : 1;
        case 'created_at':
        default:
          return task.created_at ? dayjs(task.created_at).valueOf() : -Infinity;
      }
    };

    return [...filteredTasks].sort((a, b) => {
      const valueA = getValue(a);
      const valueB = getValue(b);

      if (valueA === valueB) {
        return 0;
      }

      if (order === 'ascend') {
        return valueA > valueB ? 1 : -1;
      }
      return valueA > valueB ? -1 : 1;
    });
  }, [categoryMap, filteredTasks, sortConfig]);

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

  const renderSortTitle = useCallback((label, field) => {
    const isActive = sortConfig.field === field;
    const isAsc = isActive && sortConfig.order === 'ascend';
    const isDesc = isActive && sortConfig.order === 'descend';

    return (
      <span
        onClick={() => handleSort(field)}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {label}
        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0 }}>
          <CaretUpOutlined style={{ fontSize: 12, color: isAsc ? '#1677ff' : '#bfbfbf' }} />
          <CaretDownOutlined style={{ fontSize: 12, color: isDesc ? '#1677ff' : '#bfbfbf' }} />
        </span>
      </span>
    );
  }, [handleSort, sortConfig]);

  useEffect(() => {
    setTaskPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchTerm, statusFilter, typeFilter, startRange, sortConfig, careTasks.length]);

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

  const handleDeactivate = useCallback((task) => {
    deactivateCareTask.mutate(task.id);
  }, [deactivateCareTask]);

  const handleReactivate = useCallback((task) => {
    reactivateCareTask.mutate(task.id);
  }, [reactivateCareTask]);

  const handleManualSubmit = useCallback(async (payload) => {
    if (!manualTask) return;
    try {
      await createManualExecution.mutateAsync({ taskId: manualTask.id, payload });
      setManualTask(null);
    } catch (error) {
      showErrorMessage(error.message || 'Failed to create execution');
    }
  }, [createManualExecution, manualTask]);

  const handleGenerateExecution = useCallback((task) => {
    generateExecution.mutate(task.id);
  }, [generateExecution]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  const columns = useMemo(() => ([
    {
      title: renderSortTitle('Name', 'name'),
      dataIndex: 'name',
      render: (value) => value || 'Untitled task',
    },
    {
      title: renderSortTitle('Type', 'task_type'),
      dataIndex: 'task_type',
      render: (value) => (value === 'PURCHASE' ? 'Purchase' : 'General'),
    },
    {
      title: renderSortTitle('Category', 'category'),
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
      title: renderSortTitle('Yearly budget', 'yearly_budget'),
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
      title: renderSortTitle('Recurrence', 'recurrence_interval_days'),
      dataIndex: 'recurrence_interval_days',
      render: (value) => describeRecurrence(value),
    },
    {
      title: renderSortTitle('Start', 'start_date'),
      dataIndex: 'start_date',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—'),
    },
    {
      title: renderSortTitle('End', 'end_date'),
      dataIndex: 'end_date',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—'),
    },
    {
      title: renderSortTitle('Status', 'status'),
      key: 'status',
      render: (_, task) => statusTag(task),
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
          {task.is_active !== false ? (
            <Tooltip title="Deactivate task">
              <Button size="small" danger onClick={() => handleDeactivate(task)}>
                Deactivate
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Reactivate task">
              <Button size="small" type="primary" ghost onClick={() => handleReactivate(task)}>
                Reactivate
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]), [categoryMap, currencyFormatter, handleDeactivate, handleReactivate, renderSortTitle]);

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
              onClick={() => setIsCreateModalOpen(true)}
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
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
                  <Option value="all">All statuses</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
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
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
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
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        submitting={createCareTask.isLoading || createCategory.isLoading}
        categories={categories}
        categoriesLoading={isCategoriesFetching || createCategory.isLoading}
        onCreateCategory={handleCreateCategory}
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
      />

      <ManualExecutionModal
        open={!!manualTask}
        onClose={() => setManualTask(null)}
        onSubmit={handleManualSubmit}
        submitting={createManualExecution.isLoading}
      />

      <TaskDetailsDrawer
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onEdit={(task) => setEditTask(task)}
        onManualExecution={(task) => setManualTask(task)}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onGenerateExecution={handleGenerateExecution}
      />
    </div>
  );
};

export default CareTasksPage;
