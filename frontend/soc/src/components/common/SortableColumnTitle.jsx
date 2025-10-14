import React from 'react';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';

const SortableColumnTitle = ({
  label,
  field,
  activeField,
  order,
  onToggle
}) => {
  const isActive = field === activeField;
  const isAsc = isActive && order === 'ascend';
  const isDesc = isActive && order === 'descend';

  const handleClick = () => {
    onToggle?.(field);
  };

  return (
    <span
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4
      }}
    >
      {label}
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0 }}>
        <CaretUpOutlined style={{ fontSize: 12, color: isAsc ? '#1677ff' : '#bfbfbf' }} />
        <CaretDownOutlined style={{ fontSize: 12, color: isDesc ? '#1677ff' : '#bfbfbf' }} />
      </span>
    </span>
  );
};

export default SortableColumnTitle;
