import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  FileSearchOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import SortableColumnTitle from '../common/SortableColumnTitle';
import ExecutionStatusTag from '../common/ExecutionStatusTag';
import { formatExecutionDate } from '../../utils/taskExecutions';

// Central column factory keeps action logic in one place for all scheduling tables.
export const buildTaskSchedulingColumns = ({
  careTasksById = {},
  sortConfig,
  onSort,
  onViewDetails,
  onEdit,
  onComplete,
  onAddExecution,
  onRefund,
  mutationStates = {},
} = {}) => {
  const {
    completeLoading = false,
    updateLoading = false,
    refundLoading = false,
  } = mutationStates;

  return [
    {
      title: (
        <SortableColumnTitle
          label="Task"
          field="task_name"
          activeField={sortConfig?.field}
          order={sortConfig?.order}
          onToggle={onSort}
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
          activeField={sortConfig?.field}
          order={sortConfig?.order}
          onToggle={onSort}
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
          activeField={sortConfig?.field}
          order={sortConfig?.order}
          onToggle={onSort}
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
          activeField={sortConfig?.field}
          order={sortConfig?.order}
          onToggle={onSort}
        />
      ),
      dataIndex: 'execution_date',
      render: (date) => formatExecutionDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, execution) => {
        const parentTask = careTasksById[execution.care_task_id];
        const isPurchaseTask = parentTask?.task_type === 'PURCHASE';
        const hasRecordedCost = execution.actual_cost !== null
          && execution.actual_cost !== undefined
          && Number(execution.actual_cost) > 0;
        const canComplete = execution.status === 'TODO';
        const canRefund = execution.status === 'DONE'
          && !execution.refund
          && isPurchaseTask
          && hasRecordedCost;
        const disableActions = updateLoading || completeLoading;

        return (
          <Space size="small">
            <Tooltip title="View details">
              <Button
                size="small"
                icon={<FileSearchOutlined />}
                onClick={() => onViewDetails?.(execution)}
              />
            </Tooltip>
            <Tooltip title="Edit execution">
              <Button
                size="small"
                onClick={() => onEdit?.(execution)}
                disabled={!parentTask || disableActions}
              >
                Edit
              </Button>
            </Tooltip>
            {parentTask && (
              <Tooltip title="Add execution">
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => onAddExecution?.(parentTask)}
                  disabled={!parentTask || parentTask.is_active === false || disableActions}
                />
              </Tooltip>
            )}
            {canComplete && (
              <Button
                size="small"
                type="primary"
                onClick={() => onComplete?.(execution)}
                disabled={disableActions}
                loading={completeLoading}
              >
                Mark done
              </Button>
            )}
            {canRefund && (
              <Button
                size="small"
                onClick={() => onRefund?.(execution)}
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
  ];
};

export default buildTaskSchedulingColumns;
