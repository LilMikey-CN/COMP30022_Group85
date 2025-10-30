import React from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Select,
  Space,
  Tooltip,
} from 'antd';
import { ClearOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const pageSizeOptions = [
  { label: '10 / page', value: '10' },
  { label: '20 / page', value: '20' },
  { label: '50 / page', value: '50' },
];

const TaskSchedulingFilters = ({
  searchTerm,
  onSearchTermChange,
  showOverdueOnly,
  onToggleOverdue,
  yearFilter,
  onYearFilterChange,
  statusFilter,
  statusOptions = [],
  onStatusFilterChange,
  startDateRange,
  onDateRangeChange,
  pageSize,
  onPageSizeChange,
  canResetFilters,
  onResetFilters,
}) => (
  <Space align="center" wrap style={{ justifyContent: 'space-between', width: '100%' }}>
    <Input
      placeholder="Search by task or notes"
      value={searchTerm}
      onChange={(event) => onSearchTermChange(event.target.value)}
      allowClear
      style={{ minWidth: 260, maxWidth: 360 }}
    />
    <Space wrap>
      <Tooltip title="Clear search, filters, and sort">
        <span style={{ display: 'inline-block' }}>
          <Button
            icon={<ClearOutlined />}
            onClick={onResetFilters}
            disabled={!canResetFilters}
          >
            Reset filters
          </Button>
        </span>
      </Tooltip>
      <Checkbox
        checked={showOverdueOnly}
        onChange={(event) => onToggleOverdue(event.target.checked)}
      >
        Show overdue only
      </Checkbox>
      <Select
        value={yearFilter}
        onChange={onYearFilterChange}
        style={{ width: 180 }}
      >
        <Select.Option value="current">Current year</Select.Option>
        <Select.Option value="history">History</Select.Option>
        <Select.Option value="all">All time</Select.Option>
      </Select>
      <Select
        value={statusFilter}
        onChange={onStatusFilterChange}
        style={{ width: 150 }}
      >
        {statusOptions.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
      <RangePicker
        value={startDateRange}
        onChange={onDateRangeChange}
        allowEmpty={[true, true]}
        format="YYYY-MM-DD"
      />
      <Select
        value={String(pageSize)}
        style={{ width: 140 }}
        onChange={(value) => onPageSizeChange(Number(value))}
      >
        {pageSizeOptions.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </Space>
  </Space>
);

export default TaskSchedulingFilters;
