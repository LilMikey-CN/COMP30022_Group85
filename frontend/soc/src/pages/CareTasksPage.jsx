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
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCareItems } from '../hooks/useCareItems';
import {
  useCareTasks,
  useCreateCareTask,
  useUpdateCareTask,
  useDeactivateCareTask,
  useReactivateCareTask,
  useGenerateTaskExecution,
  useCreateManualExecution,
} from '../hooks/useCareTasks';
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

  useEffect(() => {
    if (location.state?.focusTaskId) {
      setSelectedTaskId(location.state.focusTaskId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const { data: careItemsResponse, isLoading: isCareItemsLoading } = useCareItems({ is_active: 'all' });
  const {
    data: careTasksResponse,
    isFetching: isCareTasksFetching,
    error: careTasksError,
    refetch: refetchCareTasks,
  } = useCareTasks({ is_active: 'all', limit: 500, offset: 0 });

  const careItems = useMemo(() => careItemsResponse?.care_items || [], [careItemsResponse]);
  const careItemsById = useMemo(() => careItems.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}), [careItems]);

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
        const careItemName = task.care_item_id ? (careItemsById[task.care_item_id]?.name?.toLowerCase() || '') : '';
        if (!name.includes(lowered) && !description.includes(lowered) && !careItemName.includes(lowered)) {
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
  }, [careTasks, careItemsById, searchTerm, statusFilter, typeFilter, startRange]);

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

  const columns = useMemo(() => ([
    {
      title: 'Name',
      dataIndex: 'name',
      render: (value) => value || 'Untitled task',
    },
    {
      title: 'Type',
      dataIndex: 'task_type',
      render: (value) => (value === 'PURCHASE' ? 'Purchase' : 'General'),
    },
    {
      title: 'Recurrence',
      dataIndex: 'recurrence_interval_days',
      render: (value) => describeRecurrence(value),
    },
    {
      title: 'Start',
      dataIndex: 'start_date',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—'),
    },
    {
      title: 'End',
      dataIndex: 'end_date',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—'),
    },
    {
      title: 'Status',
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
  ]), [handleDeactivate, handleReactivate]);

  const handleRefresh = () => {
    refetchCareTasks();
  };

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>Care tasks</Title>
            <Text type="secondary">
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
                placeholder="Search by name, description, or care item"
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
              </Space>
            </Space>
          </Space>
        </Card>

        <Card>
          <Table
            rowKey="id"
            dataSource={filteredTasks}
            columns={columns}
            loading={isCareItemsLoading && careItems.length === 0}
            pagination={{ pageSize: 10 }}
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
        submitting={createCareTask.isLoading}
        careItems={careItems}
        careItemsLoading={isCareItemsLoading}
      />

      <EditCareTaskModal
        open={!!editTask}
        task={editTask}
        onClose={() => setEditTask(null)}
        onSubmit={(values) => handleUpdateTask(editTask.id, values)}
        submitting={updateCareTask.isLoading}
        careItems={careItems}
        careItemsLoading={isCareItemsLoading}
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
        careItemsById={careItemsById}
      />
    </div>
  );
};

export default CareTasksPage;
