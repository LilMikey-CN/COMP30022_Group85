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
  Spin,
  Alert,
  Empty,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  FileSearchOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useCareItems } from '../hooks/useCareItems';
import {
  useCareTasks,
  useCreateManualExecution,
} from '../hooks/useCareTasks';
import {
  useTaskExecutions,
  useCompleteTaskExecution,
  useUpdateTaskExecution,
} from '../hooks/useTaskExecutions';
import ManualExecutionModal from '../components/CareTasks/ManualExecutionModal';
import CompleteExecutionModal from '../components/CareTasks/CompleteExecutionModal';
import ExecutionDetailsDrawer from '../components/CareTasks/ExecutionDetailsDrawer';
import { showErrorMessage } from '../utils/messageConfig';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const OBJECT_STORAGE_BASE_URL = import.meta.env.VITE_OBJECT_STORAGE_BASE_URL;

const executionStatusFilters = [
  { label: 'All', value: 'all' },
  { label: 'To do', value: 'TODO' },
  { label: 'Done', value: 'DONE' },
  { label: 'Covered', value: 'COVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const sortOptions = [
  { label: 'Scheduled date', value: 'scheduled_date' },
  { label: 'Created', value: 'created_at' },
  { label: 'Updated', value: 'updated_at' },
  { label: 'Task name', value: 'task_name' },
];

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  return dayjs(value).format('DD MMM YYYY');
};

const uploadEvidence = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${OBJECT_STORAGE_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload evidence image');
  }

  const data = await response.json();
  const location = data?.file?.location;
  if (!location) {
    throw new Error('Evidence upload did not return a file URL');
  }

  return location;
};

const TaskSchedulingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateRange, setStartDateRange] = useState(null);
  const [sortField, setSortField] = useState('scheduled_date');
  const [sortOrder, setSortOrder] = useState('ascend');

  const [detailsExecution, setDetailsExecution] = useState(null);
  const [executionFormState, setExecutionFormState] = useState({
    open: false,
    mode: 'create',
    task: null,
    execution: null,
    initialValues: null
  });
  const [completeModalState, setCompleteModalState] = useState({ open: false, task: null, execution: null });

  const { data: careItemsResponse } = useCareItems({ is_active: 'all' });
  const {
    data: careTasksResponse,
    isFetching: isCareTasksFetching,
    error: careTasksError,
    refetch: refetchCareTasks,
  } = useCareTasks({ is_active: 'all', limit: 500, offset: 0 });

  const executionParams = useMemo(() => {
    const params = {
      limit: 300,
      offset: 0,
    };

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (startDateRange && startDateRange.length === 2) {
      params.date_from = startDateRange[0] ? dayjs(startDateRange[0]).format('YYYY-MM-DD') : undefined;
      params.date_to = startDateRange[1] ? dayjs(startDateRange[1]).format('YYYY-MM-DD') : undefined;
    }

    return params;
  }, [statusFilter, startDateRange]);

  const {
    data: executionsResponse,
    isLoading: isExecutionsLoading,
    isFetching: isExecutionsFetching,
    error: executionsError,
    refetch: refetchExecutions,
  } = useTaskExecutions(executionParams);

  const careItems = useMemo(() => careItemsResponse?.care_items || [], [careItemsResponse]);
  const careItemsById = useMemo(() => careItems.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}), [careItems]);

  const careTasks = useMemo(() => careTasksResponse?.care_tasks || [], [careTasksResponse]);
  const careTasksById = useMemo(() => careTasks.reduce((acc, task) => {
    acc[task.id] = task;
    return acc;
  }, {}), [careTasks]);

  const updateExecution = useUpdateTaskExecution();
  const completeExecution = useCompleteTaskExecution();
  const createManualExecution = useCreateManualExecution();

  const executions = useMemo(() => executionsResponse?.executions || [], [executionsResponse]);

  useEffect(() => {
    if (!detailsExecution) {
      return;
    }
    const latest = executions.find(exec => exec.id === detailsExecution.id);
    if (latest && latest !== detailsExecution) {
      setDetailsExecution(latest);
    }
    if (!latest) {
      setDetailsExecution(null);
    }
  }, [executions, detailsExecution]);

  const filteredExecutions = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    const filtered = executions.filter((execution) => {
      if (!lowered) {
        return true;
      }
      const parentTask = careTasksById[execution.care_task_id];
      const taskName = parentTask?.name?.toLowerCase() || '';
      const notes = execution.notes?.toLowerCase() || '';
      const careItemName = parentTask?.care_item_id ? (careItemsById[parentTask.care_item_id]?.name?.toLowerCase() || '') : '';
      return taskName.includes(lowered) || notes.includes(lowered) || careItemName.includes(lowered);
    });

    const sorted = [...filtered].sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortField) {
        case 'created_at':
          valueA = dayjs(a.created_at).valueOf();
          valueB = dayjs(b.created_at).valueOf();
          break;
        case 'updated_at':
          valueA = dayjs(a.updated_at).valueOf();
          valueB = dayjs(b.updated_at).valueOf();
          break;
        case 'task_name': {
          valueA = careTasksById[a.care_task_id]?.name?.toLowerCase() || '';
          valueB = careTasksById[b.care_task_id]?.name?.toLowerCase() || '';
          break;
        }
        case 'scheduled_date':
        default:
          valueA = dayjs(a.scheduled_date).valueOf();
          valueB = dayjs(b.scheduled_date).valueOf();
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
  }, [executions, careTasksById, careItemsById, searchTerm, sortField, sortOrder]);

  const handleExecutionFormClose = useCallback(() => {
    setExecutionFormState({ open: false, mode: 'create', task: null, execution: null, initialValues: null });
  }, []);

  const openCompleteModal = useCallback((execution, providedTask) => {
    const parentTask = providedTask || careTasksById[execution.care_task_id];
    if (!parentTask) {
      showErrorMessage('Unable to locate parent task for this execution');
      return;
    }
    setCompleteModalState({ open: true, task: parentTask, execution });
  }, [careTasksById]);

  const openCreateExecutionForm = useCallback((task) => {
    setExecutionFormState({
      open: true,
      mode: 'create',
      task,
      execution: null,
      initialValues: {
        status: 'TODO',
        quantity_purchased: 1,
        quantity_unit: task?.task_type === 'PURCHASE' ? 'piece' : ''
      }
    });
  }, []);

  const openEditExecutionForm = useCallback((execution) => {
    setExecutionFormState({
      open: true,
      mode: 'edit',
      task: careTasksById[execution.care_task_id],
      execution,
      initialValues: {
        scheduled_date: execution.scheduled_date ? dayjs(execution.scheduled_date) : null,
        execution_date: execution.execution_date ? dayjs(execution.execution_date) : null,
        status: execution.status,
        quantity_purchased: execution.quantity_purchased ?? 1,
        quantity_unit: execution.quantity_unit || '',
        actual_cost: execution.actual_cost ?? undefined,
        notes: execution.notes ?? ''
      }
    });
  }, [careTasksById]);

  const handleManualSubmit = useCallback(async (payload) => {
    if (executionFormState.mode === 'edit' && executionFormState.execution) {
      await updateExecution.mutateAsync({
        id: executionFormState.execution.id,
        payload,
        taskId: executionFormState.execution.care_task_id
      });
    } else {
      if (!executionFormState.task) {
        return;
      }
      await createManualExecution.mutateAsync({ taskId: executionFormState.task.id, payload });
    }

    handleExecutionFormClose();
    await refetchExecutions();
    await refetchCareTasks();
  }, [executionFormState, updateExecution, createManualExecution, handleExecutionFormClose, refetchExecutions, refetchCareTasks]);

  const handleCancelExecution = useCallback((execution) => {
    updateExecution.mutate({
      id: execution.id,
      payload: { status: 'CANCELLED' },
      taskId: execution.care_task_id
    });
  }, [updateExecution]);

  const openDetailsDrawer = useCallback((execution) => {
    setDetailsExecution(execution);
  }, []);

  const closeDetailsDrawer = useCallback(() => {
    setDetailsExecution(null);
  }, []);

  const handleCompleteSubmit = async ({ actualCost, notes, file }) => {
    if (!completeModalState.execution) {
      return;
    }

    try {
      let evidenceUrl = null;
      if (file) {
        evidenceUrl = await uploadEvidence(file);
      }

      const payload = {};

      if (actualCost !== undefined && actualCost !== null && actualCost !== '') {
        payload.actual_cost = Number(actualCost);
      }

      if (notes !== undefined) {
        payload.notes = notes;
      }

      if (evidenceUrl) {
        payload.evidence_url = evidenceUrl;
      }

      await completeExecution.mutateAsync({
        id: completeModalState.execution.id,
        payload,
        taskId: completeModalState.execution.care_task_id,
      });

      setCompleteModalState({ open: false, task: null, execution: null });
      await refetchExecutions();
      await refetchCareTasks();
    } catch (error) {
      showErrorMessage(error.message || 'Failed to complete task execution');
    }
  };

  const columns = useMemo(() => ([
    {
      title: 'Task',
      dataIndex: 'care_task_id',
      render: (taskId) => careTasksById[taskId]?.name || 'Care task',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => <Tag color={status === 'DONE' ? 'green' : status === 'CANCELLED' ? 'red' : 'blue'}>{status}</Tag>,
    },
    {
      title: 'Scheduled date',
      dataIndex: 'scheduled_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Completed',
      dataIndex: 'execution_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const parentTask = careTasksById[record.care_task_id];
        const canComplete = record.status === 'TODO';
        const loading = completeExecution.isLoading || updateExecution.isLoading;
        return (
          <Space size="small">
            <Tooltip title="View details">
              <Button
                size="small"
                icon={<FileSearchOutlined />}
                onClick={() => openDetailsDrawer(record)}
              />
            </Tooltip>
            <Tooltip title="Edit execution">
              <Button
                size="small"
                onClick={() => openEditExecutionForm(record)}
                disabled={!parentTask || loading}
              >
                Edit
              </Button>
            </Tooltip>
            {parentTask && (
              <Tooltip title="Add execution">
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => openCreateExecutionForm(parentTask)}
                  disabled={!parentTask || parentTask.is_active === false || loading}
                />
              </Tooltip>
            )}
            {canComplete && (
              <Button
                size="small"
                type="primary"
                onClick={() => openCompleteModal(record)}
                disabled={loading}
              >
                Mark done
              </Button>
            )}
          </Space>
        );
      }
    }
  ]), [careTasksById, completeExecution.isLoading, updateExecution.isLoading, openDetailsDrawer, openEditExecutionForm, openCompleteModal]);

  const handleRefresh = () => {
    refetchCareTasks();
    refetchExecutions();
  };

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>Task scheduling</Title>
            <Typography.Text type="secondary">
              Review upcoming and completed task executions. Update status, upload evidence, and generate additional runs.
            </Typography.Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isCareTasksFetching || isExecutionsFetching}>
              Refresh
            </Button>
            <Button onClick={() => navigate('/care-tasks')}>Care tasks</Button>
          </Space>
        </Space>

        {(careTasksError || executionsError) && (
          <Alert
            type="error"
            showIcon
            message="Failed to load data"
            description={careTasksError?.message || executionsError?.message}
          />
        )}

        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space align="center" wrap style={{ justifyContent: 'space-between', width: '100%' }}>
              <Input
                placeholder="Search by task, care item, or notes"
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
                  {executionStatusFilters.map((option) => (
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

            <Spin spinning={isExecutionsLoading}>
              {filteredExecutions.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No task executions found" />
              ) : (
                <Table
                  dataSource={filteredExecutions}
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

      <ManualExecutionModal
        open={executionFormState.open}
        mode={executionFormState.mode}
        initialValues={executionFormState.initialValues}
        onClose={handleExecutionFormClose}
        onSubmit={handleManualSubmit}
        submitting={createManualExecution.isLoading || updateExecution.isLoading}
        title={executionFormState.mode === 'edit' ? 'Edit execution' : 'Create manual execution'}
        okText={executionFormState.mode === 'edit' ? 'Save changes' : 'Create'}
      />

      <CompleteExecutionModal
        open={completeModalState.open}
        onClose={() => setCompleteModalState({ open: false, task: null, execution: null })}
        onSubmit={handleCompleteSubmit}
        submitting={completeExecution.isLoading}
        task={completeModalState.task}
        execution={completeModalState.execution}
      />

      <ExecutionDetailsDrawer
        open={!!detailsExecution}
        execution={detailsExecution}
        task={detailsExecution ? careTasksById[detailsExecution.care_task_id] : null}
        onClose={closeDetailsDrawer}
        onEdit={(execution) => openEditExecutionForm(execution)}
        onMarkDone={(execution) => openCompleteModal(execution)}
        onAddExecution={(task) => task && openCreateExecutionForm(task)}
        onCancel={(execution) => handleCancelExecution(execution)}
        onNavigateToTask={(taskId) => {
          closeDetailsDrawer();
          navigate('/care-tasks', { state: { focusTaskId: taskId } });
        }}
        isUpdating={updateExecution.isLoading}
        isCompleting={completeExecution.isLoading}
      />
    </div>
  );
};

export default TaskSchedulingPage;
