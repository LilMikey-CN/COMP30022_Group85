import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { useCareTasks } from '../hooks/useCareTasks';
import { useTaskExecutions, useCompleteTaskExecution } from '../hooks/useTaskExecutions';
import CompleteExecutionModal from '../components/CareTasks/CompleteExecutionModal';
import { showErrorMessage } from '../utils/messageConfig';
import uploadEvidenceImage from '../utils/objectStorage';
import {
  COMPLETED_EXECUTION_STATUSES,
  computeCoverableExecutions,
  determineExecutionDayStatus,
  groupExecutionsByDate,
  sortExecutionsByTaskThenDate
} from '../utils/taskExecutions';
import styles from './CalendarPage.module.css';

const { Title, Text } = Typography;

const dotColors = {
  upcoming: '#1677ff',
  overdue: '#ff4d4f',
  completed: '#8c8c8c'
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  } = useCareTasks({ is_active: 'true', limit: 500, offset: 0 });

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

  const executions = useMemo(() => {
    const allExecutions = executionsResponse?.executions || [];
    return allExecutions.filter((execution) => {
      const parentTask = careTasksById[execution.care_task_id];
      return parentTask && parentTask.is_active !== false;
    });
  }, [careTasksById, executionsResponse]);

  const executionsByDate = useMemo(
    () => groupExecutionsByDate(executions),
    [executions]
  );

  const statusByDate = useMemo(() => {
    const today = dayjs().startOf('day');
    const result = new Map();
    executionsByDate.forEach((items, key) => {
      const status = determineExecutionDayStatus(items, today);
      if (status) {
        result.set(key, status);
      }
    });
    return result;
  }, [executionsByDate]);

  const selectedExecutions = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD');
    const items = executionsByDate.get(key) || [];
    return sortExecutionsByTaskThenDate(items, careTasksById);
  }, [careTasksById, executionsByDate, selectedDate]);

  const computeCoverableCount = useCallback(
    (execution) => computeCoverableExecutions(execution, executions, careTasksById),
    [careTasksById, executions]
  );

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

    const coverableCount = computeCoverableCount(execution);
    setModalState({
      open: true,
      execution,
      task: parentTask,
      coverableCount
    });
  }, [careTasksById, computeCoverableCount]);

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

  const focusDate = location.state?.focusDate;

  useEffect(() => {
    if (!focusDate) {
      return;
    }
    const parsed = dayjs(focusDate);
    if (!parsed.isValid()) {
      return;
    }

    const targetDay = parsed.startOf('day');
    setSelectedDate(targetDay);
    setCalendarValue(targetDay);
  }, [focusDate]);

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

    if (COMPLETED_EXECUTION_STATUSES.has(execution.status)) {
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
