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
  Spin,
  Alert,
  Empty,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  FileSearchOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
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
import uploadEvidenceImage from '../utils/objectStorage';
import {
  computeCoverableExecutions,
  formatExecutionDate
} from '../utils/taskExecutions';
import {
  filterExecutions,
  sortExecutions as sortTaskExecutions
} from '../utils/taskScheduling';
import SortableColumnTitle from '../components/common/SortableColumnTitle';
import ExecutionStatusTag from '../components/common/ExecutionStatusTag';
import { extractTaskSchedulingPrefill } from '../utils/taskSchedulingNavigation';
import {
  TASK_EXECUTION_DEFAULT_FILTERS,
  TASK_EXECUTION_DEFAULT_PAGINATION,
  buildTaskExecutionDefaultPagination,
  buildTaskExecutionDefaultSort,
  isTaskExecutionFilterStateDefault
} from '../utils/taskExecutionFilters';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const executionStatusFilters = [
  { label: 'All', value: 'all' },
  { label: 'To do', value: 'TODO' },
  { label: 'Done', value: 'DONE' },
  { label: 'Covered', value: 'COVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Partially refunded', value: 'PARTIALLY_REFUNDED' },
];

const TaskSchedulingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(TASK_EXECUTION_DEFAULT_FILTERS.searchTerm);
  const [statusFilter, setStatusFilter] = useState(TASK_EXECUTION_DEFAULT_FILTERS.statusFilter);
  const [startDateRange, setStartDateRange] = useState(TASK_EXECUTION_DEFAULT_FILTERS.startDateRange);
  const [sortConfig, setSortConfig] = useState(() => buildTaskExecutionDefaultSort());
  const [yearFilter, setYearFilter] = useState(TASK_EXECUTION_DEFAULT_FILTERS.yearFilter);

  const [detailsExecution, setDetailsExecution] = useState(null);
  const [executionFormState, setExecutionFormState] = useState({
    open: false,
    mode: 'create',
    task: null,
    execution: null,
    initialValues: null
  });
  const [completeModalState, setCompleteModalState] = useState({
    open: false,
    task: null,
    execution: null,
    coverableCount: 0
  });
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundExecutionTarget, setRefundExecutionTarget] = useState(null);
  const [executionPagination, setExecutionPagination] = useState(() => buildTaskExecutionDefaultPagination());

  const {
    data: careTasksResponse,
    isFetching: isCareTasksFetching,
    error: careTasksError,
    refetch: refetchCareTasks,
  } = useCareTasks({ is_active: 'true', limit: 500, offset: 0 });

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

  const executions = useMemo(() => {
    const allExecutions = executionsResponse?.executions || [];
    return allExecutions.filter((execution) => {
      const task = careTasksById[execution.care_task_id];
      return task && task.is_active !== false;
    });
  }, [careTasksById, executionsResponse]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm(TASK_EXECUTION_DEFAULT_FILTERS.searchTerm);
    setStatusFilter(TASK_EXECUTION_DEFAULT_FILTERS.statusFilter);
    setStartDateRange(TASK_EXECUTION_DEFAULT_FILTERS.startDateRange);
    setYearFilter(TASK_EXECUTION_DEFAULT_FILTERS.yearFilter);
    setSortConfig(buildTaskExecutionDefaultSort());
    setExecutionPagination((prev) => ({
      ...prev,
      current: TASK_EXECUTION_DEFAULT_PAGINATION.current,
    }));
  }, []);

  const canResetFilters = useMemo(() => !isTaskExecutionFilterStateDefault({
    searchTerm,
    statusFilter,
    startDateRange,
    yearFilter,
    sortConfig,
  }), [searchTerm, statusFilter, startDateRange, yearFilter, sortConfig]);

  useEffect(() => {
    const prefill = extractTaskSchedulingPrefill(location.state);
    if (!prefill) {
      return;
    }

    if (typeof prefill.searchTerm === 'string') {
      setSearchTerm(prefill.searchTerm);
    }

    if (prefill.sortConfig) {
      setSortConfig({ ...prefill.sortConfig });
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  const isInitialLoading = useMemo(() => {
    const waitingForTasks = isCareTasksFetching && !careTasksResponse;
    const waitingForExecutions = taskIds.length > 0 && (isExecutionsLoading || isExecutionsFetching) && !executionsResponse;
    return waitingForTasks || waitingForExecutions;
  }, [careTasksResponse, executionsResponse, isCareTasksFetching, isExecutionsLoading, isExecutionsFetching, taskIds.length]);

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

  const filteredExecutions = useMemo(() => filterExecutions(executions, {
    searchTerm,
    startDateRange,
    careTasksById
  }).filter((execution) => {
    if (yearFilter === 'all') {
      return true;
    }

    const scheduledDate = execution?.scheduled_date ? dayjs(execution.scheduled_date) : null;
    if (!scheduledDate?.isValid()) {
      return yearFilter !== 'current';
    }

    const execYear = scheduledDate.year();
    const currentYear = dayjs().year();

    if (yearFilter === 'current') {
      return execYear === currentYear;
    }

    return execYear < currentYear;
  }), [careTasksById, executions, searchTerm, startDateRange, yearFilter]);

  const sortedExecutions = useMemo(
    () => sortTaskExecutions(filteredExecutions, sortConfig, careTasksById),
    [filteredExecutions, sortConfig, careTasksById]
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
    setExecutionPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchTerm, statusFilter, startDateRange, yearFilter, sortConfig, executions.length]);

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
    const coverableCount = computeCoverableExecutions(execution, executions, careTasksById);
    setCompleteModalState({ open: true, task: parentTask, execution, coverableCount });
  }, [careTasksById, executions]);

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
    const refund = execution.refund || null;
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
        notes: execution.notes ?? '',
        refund_amount: refund?.refund_amount ?? undefined,
        refund_date: refund?.refund_date ? dayjs(refund.refund_date) : null,
        refund_reason: refund?.refund_reason ?? undefined,
        refund_evidence_url: refund?.refund_evidence_url ?? undefined
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
        evidenceUrl = await uploadEvidenceImage(file);
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

      setCompleteModalState({ open: false, task: null, execution: null, coverableCount: 0 });
      await refetchExecutions();
      await refetchCareTasks();
    } catch (error) {
      showErrorMessage(error.message || 'Failed to complete task execution');
    }
  };

  const columns = useMemo(() => ([
    {
      title: (
        <SortableColumnTitle
          label="Task"
          field="task_name"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'care_task_id',
      render: (taskId) => careTasksById[taskId]?.name || 'Care task',
    },
    {
      title: (
        <SortableColumnTitle
          label="Status"
          field="status"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'status',
      render: (status) => <ExecutionStatusTag status={status} />,
    },
    {
      title: (
        <SortableColumnTitle
          label="Scheduled date"
          field="scheduled_date"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'scheduled_date',
      render: (date) => formatExecutionDate(date),
    },
    {
      title: (
        <SortableColumnTitle
          label="Completed"
          field="execution_date"
          activeField={sortConfig.field}
          order={sortConfig.order}
          onToggle={handleSort}
        />
      ),
      dataIndex: 'execution_date',
      render: (date) => formatExecutionDate(date),
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
    sortConfig,
    handleSort,
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

  if (isInitialLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 0, color: '#5a7a9a' }}>Task scheduling</Title>
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
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
                <Select
                  value={yearFilter}
                  onChange={setYearFilter}
                  style={{ width: 180 }}
                >
                  <Option value="current">Current year</Option>
                  <Option value="history">History</Option>
                  <Option value="all">All time</Option>
                </Select>
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
                    onChange: (page) =>
                      setExecutionPagination({ current: page, pageSize: executionPagination.pageSize }),
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    showSizeChanger: false,
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
        taskStartDate={executionFormState.task?.start_date || null}
      />

      <CompleteExecutionModal
        open={completeModalState.open}
        onClose={() => setCompleteModalState({ open: false, task: null, execution: null, coverableCount: 0 })}
        onSubmit={handleCompleteSubmit}
        submitting={completeExecution.isLoading}
        task={completeModalState.task}
        execution={completeModalState.execution}
        maxCoverableExecutions={completeModalState.coverableCount}
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
