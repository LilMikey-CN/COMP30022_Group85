import React, { useMemo, useState, useCallback } from 'react';
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
  Spin,
  Alert,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
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
import AddCareTaskModal from '../components/CareTasks/AddCareTaskModal';
import EditCareTaskModal from '../components/CareTasks/EditCareTaskModal';
import ManualExecutionModal from '../components/CareTasks/ManualExecutionModal';
import TaskDetailsDrawer from '../components/CareTasks/TaskDetailsDrawer';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const statusFilterOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'All', value: 'all' },
];

const taskTypeOptions = [
  { label: 'All', value: 'all' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Purchase', value: 'PURCHASE' },
];

const sortOptions = [
  { label: 'Start date', value: 'start_date' },
  { label: 'Created', value: 'created_at' },
  { label: 'Updated', value: 'updated_at' },
  { label: 'Name', value: 'name' },
];

const describeTaskStatus = (task) => {
  if (!task) {
    return { label: 'Unknown', color: 'default' };
  }

  if (task.is_active === false) {
    return { label: 'Inactive', color: 'default' };
  }

  if (task.end_date && dayjs(task.end_date).isBefore(dayjs(), 'day')) {
    return { label: 'Ended', color: 'gold' };
  }

  return { label: 'Active', color: 'green' };
};

const describeRecurrence = (interval) => {
  const numeric = Number(interval ?? 0);
  if (numeric === 0) {
    return 'One-off';
  }
  if (numeric === 1) {
    return 'Daily';
  }
  if (numeric === 7) {
    return 'Weekly';
  }
  if (numeric === 14) {
    return 'Fortnightly';
  }
  if (numeric === 30) {
    return 'Monthly';
  }
  if (numeric === 90) {
    return 'Quarterly';
  }
  if (numeric === 365) {
    return 'Yearly';
  }
  return `Every ${numeric} days`;
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  return dayjs(value).format('DD MMM YYYY');
};

const CareTasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const [startDateRange, setStartDateRange] = useState(null);
  const [sortField, setSortField] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('ascend');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [manualTask, setManualTask] = useState(null);

  const careTaskApiParams = useMemo(() => {
    const params = {};

    if (statusFilter === 'active') {
      params.is_active = 'true';
    } else if (statusFilter === 'inactive') {
      params.is_active = 'false';
    } else {
      params.is_active = 'all';
    }

    if (taskTypeFilter !== 'all') {
      params.task_type = taskTypeFilter;
    }

    if (startDateRange && startDateRange.length === 2) {
      params.start_date_from = startDateRange[0] ? dayjs(startDateRange[0]).format('YYYY-MM-DD') : undefined;
      params.start_date_to = startDateRange[1] ? dayjs(startDateRange[1]).format('YYYY-MM-DD') : undefined;
    }

    params.limit = 200;
    params.offset = 0;

    return params;
  }, [statusFilter, taskTypeFilter, startDateRange]);

  const {
    data: careTasksResponse,
    isLoading: isCareTasksLoading,
    isFetching: isCareTasksFetching,
    error: careTasksError,
    refetch: refetchCareTasks,
  } = useCareTasks(careTaskApiParams);

  const {
    data: careItemsResponse,
    isLoading: isCareItemsLoading,
  } = useCareItems({ is_active: 'all' });

  const careItems = useMemo(() => careItemsResponse?.care_items || [], [careItemsResponse]);
  const careItemsById = useMemo(() => {
    return careItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [careItems]);

  const careTasks = useMemo(() => careTasksResponse?.care_tasks || [], [careTasksResponse]);

  const filteredTasks = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    const filtered = careTasks.filter((task) => {
      if (lowerSearch) {
        const matchesName = task.name?.toLowerCase().includes(lowerSearch);
        const matchesDescription = task.description?.toLowerCase().includes(lowerSearch);
        const careItemName = careItemsById[task.care_item_id]?.name?.toLowerCase();
        if (!matchesName && !matchesDescription && !(careItemName && careItemName.includes(lowerSearch))) {
          return false;
        }
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortField) {
        case 'name':
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
          break;
        case 'created_at':
          valueA = dayjs(a.created_at).valueOf();
          valueB = dayjs(b.created_at).valueOf();
          break;
        case 'updated_at':
          valueA = dayjs(a.updated_at).valueOf();
          valueB = dayjs(b.updated_at).valueOf();
          break;
        case 'start_date':
        default:
          valueA = dayjs(a.start_date).valueOf();
          valueB = dayjs(b.start_date).valueOf();
          break;
      }

      if (valueA === valueB) {
        return 0;
      }
      if (sortOrder === 'ascend') {
        return valueA > valueB ? 1 : -1;
      }
      return valueA > valueB ? -1 : 1;
    });

    return sorted;
  }, [careTasks, careItemsById, searchTerm, sortField, sortOrder]);

  const createCareTask = useCreateCareTask();
  const updateCareTask = useUpdateCareTask();
  const deactivateCareTask = useDeactivateCareTask();
  const reactivateCareTask = useReactivateCareTask();
  const generateExecution = useGenerateTaskExecution();
  const createManualExecution = useCreateManualExecution();

  const handleCreateTask = useCallback(async (payload) => {
    await createCareTask.mutateAsync(payload);
  }, [createCareTask]);

  const handleUpdateTask = useCallback(async (id, payload) => {
    await updateCareTask.mutateAsync({ id, payload });
  }, [updateCareTask]);

  const handleDeactivate = useCallback((task) => {
    deactivateCareTask.mutate(task.id);
  }, [deactivateCareTask]);

  const handleReactivate = useCallback((task) => {
    reactivateCareTask.mutate(task.id);
  }, [reactivateCareTask]);

  const handleGenerate = useCallback((task) => {
    generateExecution.mutate(task.id);
  }, [generateExecution]);

  const handleManualSubmit = useCallback(async (payload) => {
    if (!manualTask) return;
    await createManualExecution.mutateAsync({ taskId: manualTask.id, payload });
  }, [createManualExecution, manualTask]);

  const columns = useMemo(() => ([
    {
      title: 'Task',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{value}</span>
          <Space size={4}>
            <Tag color={record.task_type === 'PURCHASE' ? 'cyan' : 'blue'}>{record.task_type}</Tag>
            {record.care_item_id && (
              <Tag>
                {careItemsById[record.care_item_id]?.name || 'Linked item'}
              </Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = describeTaskStatus(record);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: 'Recurrence',
      dataIndex: 'recurrence_interval_days',
      render: (value) => describeRecurrence(value),
    },
    {
      title: 'Start date',
      dataIndex: 'start_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'End date',
      dataIndex: 'end_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="View details">
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => setSelectedTaskId(record.id)}
            />
          </Tooltip>
          <Button size="small" onClick={() => setEditTask(record)}>Edit</Button>
        </Space>
      ),
    },
  ]), [careItemsById]);

  const handleRefresh = () => {
    refetchCareTasks();
  };

  const careItemsLoadingState = isCareItemsLoading && careItems.length === 0;

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>Care tasks</Title>
            <Typography.Text type="secondary">
              Manage recurring responsibilities and track their execution history.
            </Typography.Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isCareTasksFetching}>
              Refresh
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
                placeholder="Search by task, description, or care item"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                allowClear
                style={{ minWidth: 260, maxWidth: 360 }}
              />
              <Space wrap>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 150 }}
                >
                  {statusFilterOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
                <Select
                  value={taskTypeFilter}
                  onChange={setTaskTypeFilter}
                  style={{ width: 140 }}
                >
                  {taskTypeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
                <RangePicker
                  value={startDateRange}
                  onChange={(range) => setStartDateRange(range)}
                  allowEmpty={[true, true]}
                  format="YYYY-MM-DD"
                />
                <Select
                  value={`${sortField}:${sortOrder}`}
                  style={{ width: 190 }}
                  onChange={(value) => {
                    const [field, order] = value.split(':');
                    setSortField(field);
                    setSortOrder(order);
                  }}
                >
                  {sortOptions.map((option) => (
                    <React.Fragment key={option.value}>
                      <Option value={`${option.value}:ascend`}>
                        {option.label} ↑
                      </Option>
                      <Option value={`${option.value}:descend`}>
                        {option.label} ↓
                      </Option>
                    </React.Fragment>
                  ))}
                </Select>
              </Space>
            </Space>

            <Spin spinning={isCareTasksLoading}>
              {filteredTasks.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No care tasks yet" />
              ) : (
                <Table
                  dataSource={filteredTasks}
                  columns={columns}
                  rowKey="id"
                  size="middle"
                  scroll={{ x: true }}
                  pagination={false}
                />
              )}
            </Spin>
          </Space>
        </Card>
      </Space>

      <AddCareTaskModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        submitting={createCareTask.isLoading}
        careItems={careItems}
        careItemsLoading={careItemsLoadingState}
      />

      <EditCareTaskModal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleUpdateTask}
        submitting={updateCareTask.isLoading}
        careItems={careItems}
        careItemsLoading={careItemsLoadingState}
        task={editTask}
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
        onGenerateExecution={handleGenerate}
        careItemsById={careItemsById}
      />
    </div>
  );
};

export default CareTasksPage;

