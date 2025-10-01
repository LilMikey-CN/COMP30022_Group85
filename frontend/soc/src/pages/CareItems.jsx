import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, Button, Space, Select, Table, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DollarOutlined } from '@ant-design/icons';
import { useCareItems } from '../hooks/useCareItems';
import { useCategories } from '../hooks/useCategories';

const { Title, Text } = Typography;
const { Option } = Select;

const statusFilters = [
  { label: 'Active Only', value: 'true' },
  { label: 'All', value: 'all' },
  { label: 'Inactive Only', value: 'false' }
];

const mapCategoriesById = (categories = []) => {
  return categories.reduce((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(value);
};

const CareItems = () => {
  const [statusFilter, setStatusFilter] = useState('true');
  const careItemsParams = useMemo(() => ({ is_active: statusFilter }), [statusFilter]);
  const categoriesParams = useMemo(() => ({ is_active: 'true' }), []);

  const { data: careItemsResponse, isLoading: isCareItemsLoading, error: careItemsError } = useCareItems(careItemsParams);
  const { data: categoriesResponse, isLoading: isCategoriesLoading, error: categoriesError } = useCategories(categoriesParams);

  const categoriesById = useMemo(() => {
    return mapCategoriesById(categoriesResponse?.categories || []);
  }, [categoriesResponse]);

  const careItems = careItemsResponse?.care_items || [];

  useEffect(() => {
    if (careItemsError) {
      message.error(careItemsError.message || 'Failed to load care items');
    }
  }, [careItemsError]);

  useEffect(() => {
    if (categoriesError) {
      message.error(categoriesError.message || 'Failed to load categories');
    }
  }, [categoriesError]);

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      render: (value) => (
        <Text style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>
          {value || 'Untitled Item'}
        </Text>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category_id',
      render: (categoryId) => {
        const category = categoriesById[categoryId];
        if (!category) {
          return (
            <Tag color="#d9d9d9" style={{ fontSize: '12px', borderRadius: '4px' }}>
              Uncategorized
            </Tag>
          );
        }
        return (
          <Tag
            color={category.color_code || '#1890ff'}
            style={{ fontSize: '12px', borderRadius: '4px', fontWeight: 500 }}
          >
            {category.name}
          </Tag>
        );
      }
    },
    {
      title: 'Unit Cost',
      dataIndex: 'estimated_unit_cost',
      render: (value) => (
        <Text style={{ fontSize: '14px', color: '#1f2937' }}>
          {formatCurrency(value)}
        </Text>
      )
    },
    {
      title: 'Quick Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="default"
            size="small"
            onClick={() => { /* TODO: Implement edit modal */ }}
          >
            Edit
          </Button>
          <Button
            icon={<DollarOutlined />}
            type="primary"
            size="small"
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
            onClick={() => { /* TODO: Navigate to budget page */ }}
          >
            Budget
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '32px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Card
        style={{
          borderRadius: '16px',
          border: 'none',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>Care Items</Title>
            <Text type="secondary">
              Manage all care-related items, supplies, and services for your client.
            </Text>
          </div>
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              size="middle"
            >
              {statusFilters.map((status) => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="middle"
              onClick={() => { /* TODO: Open create care item form */ }}
            >
              Add Care Item
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 24 }}>
          <Table
            rowKey="id"
            loading={isCareItemsLoading || isCategoriesLoading}
            columns={columns}
            dataSource={careItems}
            pagination={{
              pageSize: 10,
              showSizeChanger: false
            }}
            style={{ background: '#ffffff', borderRadius: '12px' }}
          />
        </div>
      </Card>
    </div>
  );
};

export default CareItems;
