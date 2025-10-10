import React, { useCallback, useMemo, useState } from 'react';
import {
  Typography,
  Button,
  Card,
  Row,
  Col,
  Calendar,
  Spin,
  Empty,
  List,
  Tag,
  Space,
  Alert,
} from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useCareTasks } from '../hooks/useCareTasks';
import { useTaskExecutions, useCompleteTaskExecution } from '../hooks/useTaskExecutions';
import CompleteExecutionModal from '../components/CareTasks/CompleteExecutionModal';
import { showErrorMessage } from '../utils/messageConfig';
import styles from './CalendarPage.module.css';

const { Title, Text } = Typography;

const COMPLETED_STATUSES = new Set([
  'DONE',
  'COVERED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
]);

const dotColors = {
  upcoming: '#1677ff',
  overdue: '#ff4d4f',
  completed: '#8c8c8c'
};

const uploadEvidence = async (file) => {
  if (!file) {
    return null;
  }

  const baseUrl = import.meta.env.VITE_OBJECT_STORAGE_BASE_URL;
  if (!baseUrl) {
    throw new Error('Evidence upload endpoint is not configured');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${baseUrl}/upload`, {
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

const determineDayStatus = (items, today) => {
  if (!items || items.length === 0) {
    return null;
  }

  let hasOverdue = false;
  let hasUpcoming = false;
  let hasCompleted = false;

  items.forEach((item) => {
    if (!item || item.status === 'CANCELLED') {
      return;
    }

    const scheduled = item.scheduled_date ? dayjs(item.scheduled_date) : null;
    if (!scheduled || !scheduled.isValid()) {
      return;
    }

    if (COMPLETED_STATUSES.has(item.status)) {
      hasCompleted = true;
      return;
    }

    if (item.status === 'TODO') {
      if (scheduled.isBefore(today, 'day')) {
        hasOverdue = true;
      } else {
        hasUpcoming = true;
      }
    }
  });

  if (hasOverdue) {
    return 'overdue';
  }
  if (hasUpcoming) {
    return 'upcoming';
  }
  if (hasCompleted) {
    return 'completed';
  }
  return null;
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs().startOf('day'));
  const [calendarValue, setCalendarValue] = useState(dayjs());
  const [modalState, setModalState] = useState({
    open: false,
    execution: null,
    task: null,
    coverableCount: 0
  });

  const {
    data: careTasksResponse,
    isLoading: careTasksLoading,
    isFetching: careTasksFetching,
    error: careTasksError,
    refetch: refetchCareTasks
  } = useCareTasks({ is_active: 'all', limit: 500, offset: 0 });

  const careTasks = useMemo(() => careTasksResponse?.care_tasks || [], [careTasksResponse]);
  const careTasksById = useMemo(() => careTasks.reduce((acc, task) => {
    if (task?.id) {
      acc[task.id] = task;
    }
    return acc;
  }, {}), [careTasks]);

  const taskIds = useMemo(
    () => careTasks.map((task) => task.id).filter(Boolean),
    [careTasks]
  );

  const {
    data: executionsResponse,
    isLoading: executionsLoading,
    isFetching: executionsFetching,
    error: executionsError,
    refetch: refetchExecutions,
  } = useTaskExecutions({
    taskIds,
    params: { limit: 500, offset: 0 }
  });

  const executions = useMemo(
    () => executionsResponse?.executions || [],
    [executionsResponse]
  );

  const executionsByDate = useMemo(() => {
    const map = new Map();
    executions.forEach((execution) => {
      if (!execution?.scheduled_date) {
        return;
      }
      const scheduled = dayjs(execution.scheduled_date);
      if (!scheduled.isValid()) {
        return;
      }
      const key = scheduled.format('YYYY-MM-DD');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(execution);
    });
    return map;
  }, [executions]);

  const statusByDate = useMemo(() => {
    const today = dayjs().startOf('day');
    const result = new Map();
    executionsByDate.forEach((items, key) => {
      const status = determineDayStatus(items, today);
      if (status) {
        result.set(key, status);
      }
    });
    return result;
  }, [executionsByDate]);

  const selectedExecutions = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD');
    const items = executionsByDate.get(key) || [];
    return [...items].sort((a, b) => {
      const aTask = careTasksById[a.care_task_id]?.name?.toLowerCase() || '';
      const bTask = careTasksById[b.care_task_id]?.name?.toLowerCase() || '';
      if (aTask !== bTask) {
        return aTask.localeCompare(bTask);
      }
      return dayjs(a.scheduled_date).valueOf() - dayjs(b.scheduled_date).valueOf();
    });
  }, [careTasksById, executionsByDate, selectedDate]);

  const computeCoverableExecutions = useCallback((execution) => {
    if (!execution) {
      return 0;
    }
    const parentTask = careTasksById[execution.care_task_id];
    if (!parentTask || parentTask.task_type !== 'PURCHASE') {
      return 0;
    }

    const baseScheduled = execution.scheduled_date ? dayjs(execution.scheduled_date) : null;
    const baseScheduledTime = baseScheduled ? baseScheduled.valueOf() : null;

    return executions
      .filter((candidate) => (
        candidate.care_task_id === execution.care_task_id &&
        candidate.id !== execution.id &&
        candidate.status === 'TODO'
      ))
      .filter((candidate) => {
        if (!baseScheduled) {
          return true;
        }
        if (!candidate.scheduled_date) {
          return false;
        }
        const candidateDate = dayjs(candidate.scheduled_date);
        if (!candidateDate.isValid()) {
          return false;
        }
        return candidateDate.valueOf() >= baseScheduledTime;
      })
      .length;
  }, [careTasksById, executions]);

  const navigateToScheduling = useCallback(() => {
    navigate('/task-scheduling');
  }, [navigate]);

  const openCompleteModal = useCallback((execution) => {
    if (!execution) {
      return;
    }
    const parentTask = careTasksById[execution.care_task_id];
    if (!parentTask) {
      showErrorMessage('Unable to locate care task for this execution');
      return;
    }

    const coverableCount = computeCoverableExecutions(execution);
    setModalState({
      open: true,
      execution,
      task: parentTask,
      coverableCount
    });
  }, [careTasksById, computeCoverableExecutions]);

  const closeModal = useCallback(() => {
    setModalState({
      open: false,
      execution: null,
      task: null,
      coverableCount: 0
    });
  }, []);

  const completeExecution = useCompleteTaskExecution();

  const handleCompleteSubmit = useCallback(async ({ actualCost, notes, file, quantity }) => {
    if (!modalState.execution || !modalState.task) {
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
        id: modalState.execution.id,
        payload,
        taskId: modalState.execution.care_task_id,
      });

      closeModal();
      await refetchExecutions();
      await refetchCareTasks();
    } catch (error) {
      showErrorMessage(error.message || 'Failed to complete task execution');
    }
  }, [closeModal, completeExecution, modalState, refetchCareTasks, refetchExecutions]);

  const onSelectDate = useCallback((value) => {
    setSelectedDate(value.startOf('day'));
    setCalendarValue(value.clone());
  }, []);

  const onPanelChange = useCallback((value) => {
    setCalendarValue(value.clone());
  }, []);

  const renderDateCell = useCallback((date) => {
    const key = date.format('YYYY-MM-DD');
    const status = statusByDate.get(key);
    const isSelected = date.isSame(selectedDate, 'day');
    const isCurrentMonth = date.month() === calendarValue.month();

    const baseStyle = {
      borderRadius: 8,
      textAlign: 'center',
      padding: '6px 0',
      cursor: 'pointer',
      border: isSelected ? '1px solid #1677ff' : '1px solid transparent',
      backgroundColor: isSelected ? '#e6f4ff' : 'transparent',
      color: isCurrentMonth ? '#344054' : '#bfbfbf',
      fontWeight: isSelected ? 600 : 500,
      transition: 'background-color 0.2s, border 0.2s',
      minHeight: 54,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    };

    return (
      <div style={baseStyle}>
        <span style={{ fontSize: 16 }}>{date.date()}</span>
        {status && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              display: 'inline-block',
              backgroundColor: dotColors[status] || '#bfbfbf',
            }}
          />
        )}
      </div>
    );
  }, [calendarValue, selectedDate, statusByDate]);

  const renderHeader = useCallback(({ value, onChange }) => {
    const current = value.clone();

    const handlePrev = () => {
      const next = current.subtract(1, 'month');
      onChange(next);
      setCalendarValue(next);
    };

    const handleNext = () => {
      const next = current.add(1, 'month');
      onChange(next);
      setCalendarValue(next);
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={handlePrev}
        />
        <Text style={{ fontSize: 18, fontWeight: 600 }}>
          {current.format('MMMM YYYY')}
        </Text>
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={handleNext}
        />
      </div>
    );
  }, []);

  const loading = careTasksLoading || careTasksFetching || executionsLoading || executionsFetching;

  const today = dayjs().startOf('day');

  const renderStatusTag = (execution) => {
    if (!execution) {
      return null;
    }

    const scheduled = execution.scheduled_date ? dayjs(execution.scheduled_date) : null;
    const isPast = scheduled ? scheduled.isBefore(today, 'day') : false;

    if (execution.status === 'TODO') {
      if (isPast) {
        return <Tag color="red">Overdue</Tag>;
      }
      return <Tag color="blue">Scheduled</Tag>;
    }

    if (COMPLETED_STATUSES.has(execution.status)) {
      return <Tag color="default">Completed</Tag>;
    }

    if (execution.status === 'CANCELLED') {
      return <Tag color="default">Cancelled</Tag>;
    }

    return <Tag color="default">{execution.status}</Tag>;
  };

  const selectedDayLabel = selectedDate.format('DD/MM/YYYY');

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f8fb', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
            Calendar
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            View your scheduled tasks by date
          </Text>
        </div>
        <Button
          type="primary"
          onClick={navigateToScheduling}
          className={styles.ctaButton}
        >
          Go to task scheduling
        </Button>
      </div>

      {(careTasksError || executionsError) && (
        <Alert
          type="error"
          message="Unable to load calendar data"
          description={careTasksError?.message || executionsError?.message || 'Please try again later.'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div>
                  <Text strong style={{ fontSize: 16 }}>Schedule Calendar</Text>
                  <div>
                    <Text type="secondary">Click on a date to see scheduled items</Text>
                  </div>
                </div>
              }
              bodyStyle={{ padding: 0 }}
              style={{ borderRadius: 16 }}
            >
              <div style={{ padding: 16 }}>
                <Calendar
                  fullscreen={false}
                  value={calendarValue}
                  onSelect={onSelectDate}
                  onPanelChange={onPanelChange}
                  dateFullCellRender={renderDateCell}
                  headerRender={renderHeader}
                />
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 16px' }}>
                <Space size="large">
                  <Space size={6}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColors.upcoming, display: 'inline-block' }} />
                    <Text type="secondary">Upcoming</Text>
                  </Space>
                  <Space size={6}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColors.overdue, display: 'inline-block' }} />
                    <Text type="secondary">Overdue</Text>
                  </Space>
                  <Space size={6}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColors.completed, display: 'inline-block' }} />
                    <Text type="secondary">Completed</Text>
                  </Space>
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div>
                  <Text strong style={{ fontSize: 16 }}>{selectedDayLabel}</Text>
                  <div>
                    <Text type="secondary">
                      {selectedExecutions.length === 1
                        ? '1 item scheduled'
                        : `${selectedExecutions.length} items scheduled`}
                    </Text>
                  </div>
                </div>
              }
              style={{ borderRadius: 16, height: '100%', backgroundColor: '#fafbfc' }}
              bodyStyle={{ padding: 0 }}
            >
              {selectedExecutions.length === 0 ? (
                <div style={{ padding: '32px 24px' }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No task executions scheduled"
                  />
                </div>
              ) : (
                <List
                  dataSource={selectedExecutions}
                  itemLayout="horizontal"
                  split={false}
                  renderItem={(execution) => {
                    const task = careTasksById[execution.care_task_id];
                    const taskName = task?.name || 'Care task';
                    const canMarkDone = execution.status === 'TODO';

                    return (
                      <List.Item
                        style={{ paddingLeft: '16px' }}
                        className={styles.executionListItem}
                        actions={[
                          canMarkDone ? (
                            <Button
                              key="mark-done"
                              type="primary"
                              size="small"
                              onClick={() => openCompleteModal(execution)}
                              loading={completeExecution.isLoading && modalState.execution?.id === execution.id}
                            >
                              Mark done
                            </Button>
                          ) : null
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          title={
                            <Space size="small">
                              <Text strong style={{ fontSize: 15 }}>{taskName}</Text>
                              {renderStatusTag(execution)}
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>

      <CompleteExecutionModal
        open={modalState.open}
        onClose={closeModal}
        onSubmit={handleCompleteSubmit}
        submitting={completeExecution.isLoading}
        task={modalState.task}
        execution={modalState.execution}
        maxCoverableExecutions={modalState.coverableCount}
      />
    </div>
  );
};

export default CalendarPage;
