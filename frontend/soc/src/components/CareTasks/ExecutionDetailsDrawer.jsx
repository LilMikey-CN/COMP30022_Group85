import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Drawer,
  Typography,
  Descriptions,
  Space,
  Button,
  Tag,
  Divider,
  Empty,
  Popconfirm
} from 'antd';
import {
  EditOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRefundTaskExecution } from '../../hooks/useTaskExecutions';
import RefundExecutionModal from './RefundExecutionModal';

const { Title } = Typography;

const statusColorMap = {
  TODO: 'default',
  DONE: 'green',
  COVERED: 'blue',
  REFUNDED: 'purple',
  PARTIALLY_REFUNDED: 'gold',
  CANCELLED: 'red'
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  return dayjs(value).format('DD MMM YYYY');
};

const ExecutionDetailsDrawer = ({
  open,
  execution,
  task,
  onClose,
  onEdit,
  onMarkDone,
  onAddExecution,
  onCancel,
  onNavigateToTask,
  isUpdating = false,
  isCompleting = false
}) => {
  const refundExecution = useRefundTaskExecution();
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  useEffect(() => {
    if (!execution) {
      setRefundModalOpen(false);
    }
  }, [execution]);

  const statusTag = useMemo(() => {
    if (!execution) {
      return null;
    }
    const color = statusColorMap[execution.status] || 'default';
    return <Tag color={color}>{execution.status}</Tag>;
  }, [execution]);

  const taskTag = useMemo(() => {
    if (!task) {
      return null;
    }
    const color = task.task_type === 'PURCHASE' ? 'cyan' : 'blue';
    return <Tag color={color}>{task.task_type}</Tag>;
  }, [task]);

  const closeRefundModal = useCallback(() => {
    setRefundModalOpen(false);
  }, []);

  const handleRefundSubmit = useCallback(async (payload) => {
    if (!execution) {
      return;
    }

    await refundExecution.mutateAsync({
      taskId: execution.care_task_id,
      executionId: execution.id,
      payload,
    });

    closeRefundModal();
  }, [closeRefundModal, execution, refundExecution]);

  const hasRecordedCost = execution && execution.actual_cost !== null && execution.actual_cost !== undefined && Number(execution.actual_cost) > 0;
  const canRefund = execution && execution.status === 'DONE' && !execution.refund && hasRecordedCost && task?.task_type === 'PURCHASE';

  return (
    <Drawer
      width={520}
      open={open}
      onClose={onClose}
      title={execution ? 'Task execution details' : 'Execution details'}
      destroyOnClose
    >
      {!execution ? (
        <Empty description="Select a task execution to view details" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>
              {task?.name || 'Care task'}
            </Title>
            <Space wrap>
              {statusTag}
              {taskTag}
            </Space>
            <Space wrap>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(execution)}
                disabled={isUpdating}
              >
                Edit execution
              </Button>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => onAddExecution?.(task)}
                disabled={!task || task.is_active === false || isUpdating}
              >
                Add execution
              </Button>
              {execution.status === 'TODO' && !execution.refund && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => onMarkDone?.(execution)}
                  loading={isCompleting}
                  disabled={isCompleting}
                >
                  Mark done
                </Button>
              )}
              {canRefund && (
                <Button
                  size="small"
                  onClick={() => setRefundModalOpen(true)}
                  loading={refundExecution.isLoading}
                  disabled={refundExecution.isLoading}
                >
                  Refund
                </Button>
              )}
              {execution.status === 'TODO' && (
                <Popconfirm
                  title="Cancel execution"
                  description="This will mark the execution as cancelled. Continue?"
                  okText="Cancel execution"
                  cancelText="Back"
                  onConfirm={() => onCancel?.(execution)}
                >
                  <Button
                    size="small"
                    icon={<CloseCircleOutlined />}
                    danger
                    disabled={isUpdating}
                  >
                    Cancel execution
                  </Button>
                </Popconfirm>
              )}
              <Button
                size="small"
                icon={<LinkOutlined />}
                onClick={() => onNavigateToTask?.(execution.care_task_id)}
              >
                View care task
              </Button>
            </Space>
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          <Descriptions
            column={1}
            size="small"
            labelStyle={{ fontWeight: 600, width: 160 }}
          >
            <Descriptions.Item label="Scheduled date">
              {formatDate(execution.scheduled_date)}
            </Descriptions.Item>
            <Descriptions.Item label="Execution date">
              {formatDate(execution.execution_date)}
            </Descriptions.Item>

            {task?.task_type === 'PURCHASE' && (
              <>
                <Descriptions.Item label="Quantity">
                  {execution.quantity_purchased ?? '—'} {execution.quantity_unit || ''}
                </Descriptions.Item>
                <Descriptions.Item label="Actual cost">
                  {execution.actual_cost !== null && execution.actual_cost !== undefined
                    ? `$${Number(execution.actual_cost).toFixed(2)}`
                    : '—'}
                </Descriptions.Item>
              </>
            )}

            {execution.refund && (
              <>
                <Descriptions.Item label="Refund amount">
                  {execution.refund.refund_amount !== undefined && execution.refund.refund_amount !== null
                    ? `$${Number(execution.refund.refund_amount).toFixed(2)}`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Refund date">
                  {formatDate(execution.refund.refund_date)}
                </Descriptions.Item>
                <Descriptions.Item label="Refund reason">
                  {execution.refund.refund_reason || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Refund evidence">
                  {execution.refund.refund_evidence_url ? (
                    <a
                      href={execution.refund.refund_evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View evidence
                    </a>
                  ) : '—'}
                </Descriptions.Item>
              </>
            )}

            {execution.status === 'DONE' && execution.evidence_url && (
              <Descriptions.Item label="Evidence">
                <a
                  href={execution.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block' }}
                >
                  <img
                    src={execution.evidence_url}
                    alt="Execution evidence"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid #f0f0f0'
                    }}
                  />
                </a>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Notes">
              {execution.notes || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDate(execution.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Last updated">
              {formatDate(execution.updated_at)}
            </Descriptions.Item>
          </Descriptions>

          <RefundExecutionModal
            open={refundModalOpen}
            execution={execution}
            submitting={refundExecution.isLoading}
            maxAmount={execution?.actual_cost ?? null}
            onClose={closeRefundModal}
            onSubmit={handleRefundSubmit}
          />
        </Space>
      )}
    </Drawer>
  );
};

export default ExecutionDetailsDrawer;
