import React from 'react';
import { Tag } from 'antd';

const STATUS_COLOR_MAP = {
  TODO: 'default',
  DONE: 'green',
  COVERED: 'blue',
  REFUNDED: 'purple',
  PARTIALLY_REFUNDED: 'gold',
  CANCELLED: 'red'
};

const ExecutionStatusTag = ({ status }) => {
  if (!status) {
    return null;
  }

  const color = STATUS_COLOR_MAP[status] || 'default';
  return <Tag color={color}>{status}</Tag>;
};

export default ExecutionStatusTag;
