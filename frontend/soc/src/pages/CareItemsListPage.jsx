/*
 * TODO: 
 * 1. Add pagination if the list exceeds 15 items and when backend is integrated
 * 2. Integrate with backend API to fetch real data
 * */
import React, { useState, useMemo } from 'react';
import {
  Typography,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Card
} from 'antd';
import { SearchOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { careItemsData } from '../data/mockData';

const { Title, Text } = Typography;
const { Option } = Select;

const CareItemsListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('Date');
  const [sortDirection, setSortDirection] = useState('asc');

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return '#1890ff';
      case 'Overdue':
        return '#ff4d4f';
      case 'Completed':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#ff4d4f';
      case 'Medium':
        return '#fa8c16';
      case 'Low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  // Category color mapping
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Medical':
        return '#1890ff';
      case 'Hygiene':
        return '#722ed1';
      case 'Clothing':
        return '#13c2c2';
      default:
        return '#d9d9d9';
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...careItemsData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'Date':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'Priority': {
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        }
        case 'Category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'Status': {
          const statusOrder = { 'Overdue': 3, 'Active': 2, 'Completed': 1 };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        }
        case 'Cost':
          aValue = parseFloat(a.cost.replace('$', ''));
          bValue = parseFloat(b.cost.replace('$', ''));
          break;
        case 'Item':
          aValue = a.item.toLowerCase();
          bValue = b.item.toLowerCase();
          break;
        default:
          aValue = a.dueDate;
          bValue = b.dueDate;
      }

      let result = 0;
      if (aValue < bValue) result = -1;
      if (aValue > bValue) result = 1;

      return sortDirection === 'desc' ? -result : result;
    });

    return filtered;
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      width: 100,
      render: (action, record) => (
        <Button
          type="primary"
          size="small"
          style={{
            backgroundColor: record.status === 'Completed' ? '#52c41a' : '#1890ff',
            borderColor: record.status === 'Completed' ? '#52c41a' : '#1890ff',
            fontSize: '12px'
          }}
        >
          {record.status === 'Completed' ? '✓ Review' : action}
        </Button>
      ),
    },
    {
      title: 'Item',
      dataIndex: 'item',
      render: (item) => (
        <Text style={{ fontWeight: '500', fontSize: '14px' }}>
          {item}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag
          color={getStatusColor(status)}
          style={{
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '4px'
          }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Due date',
      dataIndex: 'dueDate',
      width: 120,
      render: (date) => (
        <Text style={{ fontSize: '14px' }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: 100,
      render: (category) => (
        <Tag
          color={getCategoryColor(category)}
          style={{
            fontSize: '11px',
            fontWeight: '500',
            borderRadius: '12px',
            color: 'white'
          }}
        >
          {category}
        </Tag>
      ),
    },
    {
      title: 'Cycle',
      dataIndex: 'cycle',
      width: 100,
      render: (cycle) => (
        <Text style={{ fontSize: '14px' }}>
          {cycle}
        </Text>
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      width: 80,
      render: (cost) => (
        <Text style={{ fontSize: '14px', fontWeight: '500' }}>
          {cost}
        </Text>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 100,
      render: (priority) => (
        <Tag
          color={getPriorityColor(priority)}
          style={{
            fontSize: '11px',
            fontWeight: '500',
            borderRadius: '4px',
            color: 'white'
          }}
        >
          {priority}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Care Items
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Manage lifetime care requirements and track attendance schedules
        </Text>
      </div>

      <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* Filters and Search */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <Input
            placeholder="Search"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '300px',
              borderRadius: '6px'
            }}
          />

          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '120px' }}
              suffixIcon={<span style={{ fontSize: '12px' }}>▼</span>}
            >
              <Option value="All">All</Option>
              <Option value="Active">Active</Option>
              <Option value="Overdue">Overdue</Option>
              <Option value="Completed">Completed</Option>
            </Select>

            <Select
              value={sortField}
              onChange={setSortField}
              style={{ width: '120px' }}
              placeholder="Sort by"
            >
              <Option value="Date">Date</Option>
              <Option value="Priority">Priority</Option>
              <Option value="Category">Category</Option>
              <Option value="Status">Status</Option>
              <Option value="Cost">Cost</Option>
              <Option value="Item">Item</Option>
            </Select>

            <Button
              icon={sortDirection === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '32px'
              }}
              title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
            />
          </Space>
        </div>

        {/* Care Items Table */}
        <Table
          columns={columns}
          dataSource={filteredAndSortedData}
          rowKey="id"
          pagination={false}
          size="small"
          rowClassName={(record) => {
            if (record.status === 'Overdue') return 'overdue-row';
            if (record.status === 'Completed') return 'completed-row';
            return '';
          }}
          style={{
            backgroundColor: 'white'
          }}
        />
      </Card>

      <style jsx>{`
        .ant-table-tbody > tr.overdue-row {
          background-color: #fff2f0 !important;
        }
        .ant-table-tbody > tr.overdue-row:hover {
          background-color: #ffebe6 !important;
        }
        .ant-table-tbody > tr.completed-row {
          background-color: #f6ffed !important;
        }
        .ant-table-tbody > tr.completed-row:hover {
          background-color: #f0f9e8 !important;
        }
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600 !important;
          color: #262626 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
      `}</style>
    </div>
  );
};

export default CareItemsListPage;
