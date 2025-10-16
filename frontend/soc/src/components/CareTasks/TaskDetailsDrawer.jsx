import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Drawer,
  Typography,
  Tag,
  Space,
  Button,
  Descriptions,
  Divider,
  Tabs,
  Table,
  Empty,
  Spin,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  CheckOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCareTaskDetails } from '../../hooks/useCareTasks';
import {
  useCompleteTaskExecution,
  useTaskExecutionsForTask,
  useUpdateTaskExecution,
  useRefundTaskExecution,
} from '../../hooks/useTaskExecutions';
import { useCategories } from '../../hooks/useCategories';
import RefundExecutionModal from './RefundExecutionModal';

const { Title, Text } = Typography;

const DEFAULT_DRAWER_WIDTH = 640;

const statusColorMap = {
  TODO: 'default',
  DONE: 'green',
  COVERED: 'blue',
  REFUNDED: 'purple',
  PARTIALLY_REFUNDED: 'gold',
  CANCELLED: 'red',
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  return dayjs(value).format('DD MMM YYYY');
};

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

const computeTaskStatus = (task) => {
  if (!task) {
    return { label: 'Loading', color: 'default' };
  }

  if (task.is_active === false) {
    return { label: 'Inactive', color: 'default' };
  }

  if (task.end_date && dayjs(task.end_date).isBefore(dayjs(), 'day')) {
    return { label: 'Ended', color: 'gold' };
  }

  return { label: 'Active', color: 'green' };
};

const TaskDetailsDrawer = ({
  taskId,
  open,
  onClose,
  onEdit,
  //onManualExecution,
  onGenerateRemaining,
  onReplicate,
  onDeactivate,
  deactivating = false,
  generatingRemaining = false,
  selectedExecution,
  onCompleteExecution,
}) => {
  const {
    data: task,
    isLoading: isTaskLoading,
    isFetching: isTaskFetching,
  } = useCareTaskDetails(taskId, { keepPreviousData: true });

  const {
    data: executionsResponse,
    isLoading: isExecutionsLoading,
    isFetching: isExecutionsFetching,
  } = useTaskExecutionsForTask(taskId, { limit: 100, offset: 0 });

  const completeExecution = useCompleteTaskExecution();
  const updateExecution = useUpdateTaskExecution();
  const refundExecution = useRefundTaskExecution();
  const { data: categoriesResponse } = useCategories({ is_active: 'all' });

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundExecutionTarget, setRefundExecutionTarget] = useState(null);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [activeTab, setActiveTab] = useState('overview');

  const executions = useMemo(() => executionsResponse?.executions || [], [executionsResponse]);
  const taskStatus = computeTaskStatus(task);
  const selectedExecutionId = selectedExecution?.id || null;

  const categoryDisplay = useMemo(() => {
    if (!task) {
      return '—';
    }
    const categories = categoriesResponse?.categories || [];
    const match = categories.find((category) => category.id === task.category_id);
    if (match?.name) {
      return match.name;
    }
    return task.category_id || '—';
  }, [categoriesResponse, task]);

  useEffect(() => {
    if (!open) {
      setDrawerWidth(DEFAULT_DRAWER_WIDTH);
      setActiveTab('overview');
      setRefundModalOpen(false);
      setRefundExecutionTarget(null);
    }
  }, [open]);

  const closeRefundModal = useCallback(() => {
    setRefundModalOpen(false);
    setRefundExecutionTarget(null);
  }, []);

  const handleRefundSubmit = useCallback(async (payload) => {
    if (!refundExecutionTarget) {
      return;
    }

    await refundExecution.mutateAsync({
      taskId,
      executionId: refundExecutionTarget.id,
      payload,
    });

    closeRefundModal();
  }, [closeRefundModal, refundExecution, refundExecutionTarget, taskId]);

  useEffect(() => {
    if (!refundExecutionTarget) {
      return;
    }

    const latest = executions.find((execution) => execution.id === refundExecutionTarget.id);
    if (latest && latest !== refundExecutionTarget) {
      setRefundExecutionTarget(latest);
    }
    if (!latest) {
      closeRefundModal();
    }
  }, [closeRefundModal, executions, refundExecutionTarget]);

  const handleCancelExecution = useCallback((execution) => {
    updateExecution.mutate({ id: execution.id, payload: { status: 'CANCELLED' }, taskId });
  }, [updateExecution, taskId]);

  const executionColumns = useMemo(() => ([
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value) => (
        <Tag color={statusColorMap[value] || 'default'}>{value}</Tag>
      ),
    },
    {
      title: 'Scheduled',
      dataIndex: 'scheduled_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Completed',
      dataIndex: 'execution_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity_purchased',
      render: (value, record) => (
        <span>
          {value ?? '—'} {record.quantity_unit}
        </span>
      ),
    },
    {
      title: 'Actual cost',
      dataIndex: 'actual_cost',
      render: (value) => (value !== null && value !== undefined ? `$${Number(value).toFixed(2)}` : '—'),
    },
    {
      title: 'Refund',
      dataIndex: 'refund',
      render: (value) => (
        value && value.refund_amount !== undefined && value.refund_amount !== null
          ? `$${Number(value.refund_amount).toFixed(2)}`
          : '—'
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      ellipsis: true,
      render: (value) => value || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const disabled = completeExecution.isLoading || updateExecution.isLoading || refundExecution.isLoading;
        const isTodo = record.status === 'TODO';
        const isDone = record.status === 'DONE';
        const isCancelled = record.status === 'CANCELLED';
        const hasRefund = Boolean(record.refund);
        const hasRecordedCost = record.actual_cost !== null && record.actual_cost !== undefined && Number(record.actual_cost) > 0;
        const canRefund =
          isDone &&
          !isCancelled &&
          !hasRefund &&
          hasRecordedCost &&
          task?.task_type === 'PURCHASE';

        return (
          <Space size="middle">
            {isTodo && onCompleteExecution && (
              <Tooltip title="Mark as done">
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  disabled={disabled}
                  onClick={() => onCompleteExecution(record, task)}
                >
                  Done
                </Button>
              </Tooltip>
            )}
            {canRefund && (
              <Tooltip title="Record refund">
                <Button
                  size="small"
                  onClick={() => {
                    setRefundExecutionTarget(record);
                    setRefundModalOpen(true);
                  }}
                  disabled={disabled}
                >
                  Refund
                </Button>
              </Tooltip>
            )}
            {isTodo && (
              <Tooltip title="Cancel execution">
                <Button
                  size="small"
                  danger
                  ghost
                  icon={<CloseCircleOutlined />}
                  loading={updateExecution.isLoading}
                  disabled={disabled}
                  onClick={() => handleCancelExecution(record)}
                >
                  Cancel
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ]), [
    completeExecution.isLoading,
    updateExecution.isLoading,
    refundExecution.isLoading,
    handleCancelExecution,
    onCompleteExecution,
    task,
  ]);

  const drawerTitle = (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>
        {task?.name || 'Care task'}
      </Title>

      <Space align="center" wrap>
        {task?.task_type && (
          <Tag color={task?.task_type === 'PURCHASE' ? 'cyan' : 'blue'}>{task.task_type}</Tag>
        )}
        <Tag color={taskStatus.color}>{taskStatus.label}</Tag>
      </Space>

      <Space wrap>
        <Button icon={<EditOutlined />} onClick={() => onEdit?.(task)} disabled={!task}>
          Edit
        </Button>
        {/*
          Temporaly disabled, needs more thought
        <Button icon={<PlusOutlined />} onClick={() => onManualExecution?.(task)} disabled={!task}>
          Manual execution
        </Button>
        */}
        {(() => {
          const isHistoryTask = task?.start_date
            ? dayjs(task.start_date).isValid() && dayjs(task.start_date).year() < dayjs().year()
            : false;
          if (isHistoryTask) {
            return (
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => onReplicate?.(task)}
                disabled={!task}
              >
                Replicate for current year
              </Button>
            );
          }
          return (
            <Button
              icon={<SyncOutlined />}
              onClick={() => onGenerateRemaining?.(task)}
              disabled={!task || generatingRemaining}
              loading={generatingRemaining}
            >
              Generate rest
            </Button>
          );
        })()}
      </Space>
    </Space>
  );

  return (
    <Drawer
      width={drawerWidth}
      title={drawerTitle}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <div style={{ position: 'relative', height: '100%' }}>
        <Spin spinning={isTaskLoading || isTaskFetching}>
          {task ? (
            <>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary">
                  Recurrence: <Text strong>{describeRecurrence(task.recurrence_interval_days)}</Text>
                </Text>
              </Space>

              <Divider />

              <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                  setActiveTab(key);
                  if (key === 'executions') {
                    const halfWidth = Math.round(window.innerWidth / 2);
                    setDrawerWidth(Math.min(halfWidth, window.innerWidth - 80));
                  } else {
                    setDrawerWidth(DEFAULT_DRAWER_WIDTH);
                  }
                }}
                items={[
                  {
                    key: 'overview',
                    label: 'Overview',
                    children: (
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Descriptions
                          column={1}
                          size="small"
                          labelStyle={{ fontWeight: 600 }}
                          contentStyle={{ marginBottom: 8 }}
                        >
                          <Descriptions.Item label="Description">
                            {task.description || '—'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Category">
                            {categoryDisplay}
                          </Descriptions.Item>
                          <Descriptions.Item label="Start date">
                            {formatDate(task.start_date)}
                          </Descriptions.Item>
                          <Descriptions.Item label="End date">
                            {formatDate(task.end_date)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Created">
                            {formatDate(task.created_at)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Updated">
                            {formatDate(task.updated_at)}
                          </Descriptions.Item>
                        </Descriptions>

                        <Popconfirm
                          placement="right"
                          title="Delete care task"
                          description="Deleting this task removes it and its schedule from views. Are you sure?"
                          okText="Yes, delete"
                          cancelText="Cancel"
                          onConfirm={() => onDeactivate?.(task)}
                          disabled={deactivating}
                        >
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={deactivating}
                            disabled={deactivating}
                          >
                            Delete care task
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                  {
                    key: 'executions',
                    label: 'Executions',
                    children: (
                      <Spin spinning={isExecutionsLoading || isExecutionsFetching}>
                        {executions.length === 0 ? (
                          <Empty description="No executions yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          <>
                            <Table
                              dataSource={executions}
                              columns={executionColumns}
                              pagination={false}
                              rowKey="id"
                              size="small"
                              rowClassName={(record) => record.id === selectedExecutionId ? 'selected-execution-row' : ''}
                            />
                            <style>{`
                              .selected-execution-row {
                                background-color: #e6f7ff !important;
                              }
                            `}</style>
                          </>
                        )}
                      </Spin>
                    ),
                  },
                ]}
              />

            </>
          ) : (
            <Empty description="Select a task to see details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </div>
      <RefundExecutionModal
        open={refundModalOpen}
        execution={refundExecutionTarget}
        submitting={refundExecution.isLoading}
        maxAmount={refundExecutionTarget?.actual_cost ?? null}
        onClose={closeRefundModal}
        onSubmit={handleRefundSubmit}
      />
    </Drawer>
  );
};

export default TaskDetailsDrawer;
