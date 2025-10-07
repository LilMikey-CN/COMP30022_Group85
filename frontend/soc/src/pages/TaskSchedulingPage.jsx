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
  PlusOutlined,
  CaretUpOutlined,
  CaretDownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  useCareTasks,
  useCreateManualExecution,
} from '../hooks/useCareTasks';
import {
  useTaskExecutions,
  useCompleteTaskExecution,
  useUpdateTaskExecution,
  useRefundTaskExecution,
} from '../hooks/useTaskExecutions';
import ManualExecutionModal from '../components/CareTasks/ManualExecutionModal';
import CompleteExecutionModal from '../components/CareTasks/CompleteExecutionModal';
import ExecutionDetailsDrawer from '../components/CareTasks/ExecutionDetailsDrawer';
import RefundExecutionModal from '../components/CareTasks/RefundExecutionModal';
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

const DEFAULT_SORT = { field: 'scheduled_date', order: 'ascend' };

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
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

  const [detailsExecution, setDetailsExecution] = useState(null);
  const [executionFormState, setExecutionFormState] = useState({
    open: false,
    mode: 'create',
    task: null,
    execution: null,
    initialValues: null
  });
  const [completeModalState, setCompleteModalState] = useState({ open: false, task: null, execution: null });
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundExecutionTarget, setRefundExecutionTarget] = useState(null);
  const [executionPagination, setExecutionPagination] = useState({ current: 1, pageSize: 10 });

  const {
    data: careTasksResponse,
    isFetching: isCareTasksFetching,
    error: careTasksError,
    refetch: refetchCareTasks,
  } = useCareTasks({ is_active: 'all', limit: 500, offset: 0 });

  const careTasks = useMemo(() => careTasksResponse?.care_tasks || [], [careTasksResponse]);
  const careTasksById = useMemo(() => careTasks.reduce((acc, task) => {
    acc[task.id] = task;
    return acc;
  }, {}), [careTasks]);
  const taskIds = useMemo(() => careTasks.map((task) => task.id).filter(Boolean), [careTasks]);

  const executionQueryParams = useMemo(() => ({
    limit: 300,
    offset: 0,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }), [statusFilter]);

  const {
    data: executionsResponse,
    isLoading: isExecutionsLoading,
    isFetching: isExecutionsFetching,
    error: executionsError,
    refetch: refetchExecutions,
  } = useTaskExecutions({
    taskIds,
    params: executionQueryParams,
  });

  const updateExecution = useUpdateTaskExecution();
  const completeExecution = useCompleteTaskExecution();
  const createManualExecution = useCreateManualExecution();
  const refundExecutionMutation = useRefundTaskExecution();

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

  useEffect(() => {
    if (!refundExecutionTarget) {
      return;
    }
    const latest = executions.find(exec => exec.id === refundExecutionTarget.id);
    if (latest && latest !== refundExecutionTarget) {
      setRefundExecutionTarget(latest);
    }
    if (!latest) {
      setRefundExecutionTarget(null);
      setRefundModalOpen(false);
    }
  }, [executions, refundExecutionTarget]);

  const openRefundModal = useCallback((execution) => {
    setRefundExecutionTarget(execution);
    setRefundModalOpen(true);
  }, []);

  const closeRefundModal = useCallback(() => {
    setRefundModalOpen(false);
    setRefundExecutionTarget(null);
  }, []);

  const handleRefundSubmit = useCallback(async (payload) => {
    if (!refundExecutionTarget) {
      return;
    }

    await refundExecutionMutation.mutateAsync({
      taskId: refundExecutionTarget.care_task_id,
      executionId: refundExecutionTarget.id,
      payload,
    });

    closeRefundModal();
  }, [closeRefundModal, refundExecutionMutation, refundExecutionTarget]);

  const filteredExecutions = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    const [from, to] = startDateRange || [];
    const fromBoundary = from ? dayjs(from) : null;
    const toBoundary = to ? dayjs(to) : null;

    return executions.filter((execution) => {
      const parentTask = careTasksById[execution.care_task_id];
      const taskName = parentTask?.name?.toLowerCase() || '';
      const notes = execution.notes?.toLowerCase() || '';

      if (lowered && !taskName.includes(lowered) && !notes.includes(lowered)) {
        return false;
      }

      if (fromBoundary || toBoundary) {
        const scheduled = execution.scheduled_date ? dayjs(execution.scheduled_date) : null;
        if (fromBoundary && scheduled && scheduled.isBefore(fromBoundary, 'day')) {
          return false;
        }
        if (toBoundary && scheduled && scheduled.isAfter(toBoundary, 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [executions, careTasksById, searchTerm, startDateRange]);

  const sortedExecutions = useMemo(() => {
    const data = [...filteredExecutions];
    const { field, order } = sortConfig;

    const getValue = (execution) => {
      switch (field) {
        case 'task_name':
          return careTasksById[execution.care_task_id]?.name?.toLowerCase() || '';
        case 'status':
          return execution.status || '';
        case 'scheduled_date':
          return execution.scheduled_date ? dayjs(execution.scheduled_date).valueOf() : -Infinity;
        case 'execution_date':
          return execution.execution_date ? dayjs(execution.execution_date).valueOf() : Number.MAX_SAFE_INTEGER;
        case 'created_at':
          return execution.created_at ? dayjs(execution.created_at).valueOf() : -Infinity;
        case 'updated_at':
          return execution.updated_at ? dayjs(execution.updated_at).valueOf() : -Infinity;
        default:
          return execution.scheduled_date ? dayjs(execution.scheduled_date).valueOf() : -Infinity;
      }
    };

    return data.sort((a, b) => {
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
  }, [filteredExecutions, sortConfig, careTasksById]);

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
    setExecutionPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchTerm, statusFilter, startDateRange, sortConfig, executions.length]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sortedExecutions.length / executionPagination.pageSize));
    if (executionPagination.current > maxPage) {
      setExecutionPagination((prev) => ({ ...prev, current: maxPage }));
    }
  }, [sortedExecutions.length, executionPagination.pageSize, executionPagination]);

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

  const handleCompleteSubmit = async ({ actualCost, notes, file, quantity }) => {
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

      if (quantity !== undefined) {
        payload.quantity = Number(quantity) || 1;
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
      title: renderSortTitle('Task', 'task_name'),
      dataIndex: 'care_task_id',
      render: (taskId) => careTasksById[taskId]?.name || 'Care task',
    },
    {
      title: renderSortTitle('Status', 'status'),
      dataIndex: 'status',
      render: (status) => <Tag color={status === 'DONE' ? 'green' : status === 'CANCELLED' ? 'red' : 'blue'}>{status}</Tag>,
    },
    {
      title: renderSortTitle('Scheduled date', 'scheduled_date'),
      dataIndex: 'scheduled_date',
      render: (date) => formatDate(date),
    },
    {
      title: renderSortTitle('Completed', 'execution_date'),
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
        const isPurchaseTask = parentTask?.task_type === 'PURCHASE';
        const hasRecordedCost = record.actual_cost !== null && record.actual_cost !== undefined && Number(record.actual_cost) > 0;
        const canRefund = record.status === 'DONE' && !record.refund && isPurchaseTask && hasRecordedCost;
        const refundLoading = refundExecutionMutation.isLoading;
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
            {canRefund && (
              <Button
                size="small"
                onClick={() => openRefundModal(record)}
                disabled={refundLoading}
                loading={refundLoading}
              >
                Refund
              </Button>
            )}
          </Space>
        );
      }
    }
  ]), [
    careTasksById,
    completeExecution.isLoading,
    updateExecution.isLoading,
    refundExecutionMutation.isLoading,
    renderSortTitle,
    openDetailsDrawer,
    openEditExecutionForm,
    openCompleteModal,
    openCreateExecutionForm,
    openRefundModal,
  ]);

  const handleRefresh = () => {
    refetchCareTasks();
    if (taskIds.length > 0) {
      refetchExecutions();
    }
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
                placeholder="Search by task or notes"
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
                  value={String(executionPagination.pageSize)}
                  style={{ width: 140 }}
                  onChange={(value) =>
                    setExecutionPagination({ current: 1, pageSize: Number(value) })
                  }
                >
                  <Option value="10">10 / page</Option>
                  <Option value="20">20 / page</Option>
                  <Option value="50">50 / page</Option>
                </Select>
              </Space>
            </Space>

            <Spin spinning={isExecutionsLoading}>
              {sortedExecutions.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No task executions found" />
              ) : (
                <Table
                  dataSource={sortedExecutions}
                  columns={columns}
                  rowKey="id"
                  size="middle"
                  scroll={{ x: true }}
                  pagination={{
                    current: executionPagination.current,
                    pageSize: executionPagination.pageSize,
                    total: sortedExecutions.length,
                    onChange: (page, pageSize) => setExecutionPagination({ current: page, pageSize }),
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
                  }}
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
      <RefundExecutionModal
        open={refundModalOpen}
        execution={refundExecutionTarget}
        submitting={refundExecutionMutation.isLoading}
        maxAmount={refundExecutionTarget?.actual_cost ?? null}
        onClose={closeRefundModal}
        onSubmit={handleRefundSubmit}
      />
    </div>
  );
};

export default TaskSchedulingPage;
