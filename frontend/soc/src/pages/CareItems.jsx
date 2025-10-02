import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Select,
  Table,
  Tag,
  message,
  Input,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DollarOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useCareItems, useCreateCareItem, useUpdateCareItem } from '../hooks/useCareItems';
import { useCategories, useCreateCategory } from '../hooks/useCategories';
import AddCareItemModal from '../components/CareItems/AddCareItemModal.jsx';
import EditCareItemModal from '../components/CareItems/EditCareItemModal.jsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
  const [sortConfig, setSortConfig] = useState({ field: 'name', order: 'ascend' });
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [costFilter, setCostFilter] = useState('all');
  const [startDateRange, setStartDateRange] = useState(null);
  const [editingCareItem, setEditingCareItem] = useState(null);
  const careItemsParams = useMemo(() => ({ is_active: statusFilter }), [statusFilter]);
  const categoriesParams = useMemo(() => ({ is_active: 'true' }), []);

  const { data: careItemsResponse, isLoading: isCareItemsLoading, error: careItemsError } = useCareItems(careItemsParams);
  const { data: categoriesResponse, isLoading: isCategoriesLoading, error: categoriesError } = useCategories(categoriesParams);
  const careItems = useMemo(() => careItemsResponse?.care_items || [], [careItemsResponse]);
  const categoriesList = useMemo(() => categoriesResponse?.categories || [], [categoriesResponse]);
  const createCareItem = useCreateCareItem();
  const createCategory = useCreateCategory();
  const updateCareItem = useUpdateCareItem();

  const categoriesById = useMemo(() => {
    return mapCategoriesById(categoriesList);
  }, [categoriesList]);

  const costOptions = useMemo(() => ([
    { value: 'all', label: 'All Costs' },
    { value: 'low', label: 'Under $25', min: 0, max: 25 },
    { value: 'medium', label: '$25 - $75', min: 25, max: 75 },
    { value: 'high', label: 'Above $75', min: 75 }
  ]), []);

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

  const toggleSort = (field) => {
    setSortConfig((prev) => {
      if (prev?.field === field) {
        return {
          field,
          order: prev.order === 'ascend' ? 'descend' : 'ascend',
        };
      }
      return { field, order: 'ascend' };
    });
  };

  const getSortValue = useCallback((item, fieldKey) => {
    switch (fieldKey) {
      case 'name':
        return (item?.name || '').toLowerCase();
      case 'category': {
        const categoryName = categoriesById[item?.category_id]?.name || '';
        return categoryName.toLowerCase();
      }
      case 'unitCost':
        return Number.isFinite(item?.estimated_unit_cost)
          ? item.estimated_unit_cost
          : (item?.estimated_unit_cost ?? 0);
      default:
        return '';
    }
  }, [categoriesById]);

  const filteredCareItems = useMemo(() => {
    const loweredSearch = searchTerm.trim().toLowerCase();
    const activeCostBand = costOptions.find((option) => option.value === costFilter);

    return careItems.filter((item) => {
      const category = categoriesById[item?.category_id];

      if (loweredSearch) {
        const categoryName = category?.name?.toLowerCase() || '';
        const matchesSearch = (item?.name || '').toLowerCase().includes(loweredSearch) || categoryName.includes(loweredSearch);
        if (!matchesSearch) {
          return false;
        }
      }

      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(item?.category_id || '')) {
          return false;
        }
      }

      if (activeCostBand && activeCostBand.value !== 'all') {
        const unitCost = Number(item?.estimated_unit_cost ?? 0);
        if (activeCostBand.min !== undefined && unitCost < activeCostBand.min) {
          return false;
        }
        if (activeCostBand.max !== undefined && unitCost >= activeCostBand.max) {
          return false;
        }
      }

      if (startDateRange && Array.isArray(startDateRange) && startDateRange[0] && startDateRange[1]) {
        const itemStart = item?.start_date ? dayjs(item.start_date) : null;
        if (!itemStart) {
          return false;
        }
        if (itemStart.isBefore(startDateRange[0], 'day') || itemStart.isAfter(startDateRange[1], 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [careItems, categoriesById, searchTerm, selectedCategories, costFilter, startDateRange, costOptions]);

  const sortedCareItems = useMemo(() => {
    if (!sortConfig) {
      return [...filteredCareItems];
    }

    const sorted = [...filteredCareItems].sort((a, b) => {
      const valueA = getSortValue(a, sortConfig.field);
      const valueB = getSortValue(b, sortConfig.field);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortConfig.order === 'ascend'
          ? valueA - valueB
          : valueB - valueA;
      }

      const compareResult = String(valueA).localeCompare(String(valueB));
      return sortConfig.order === 'ascend' ? compareResult : -compareResult;
    });

    return sorted;
  }, [filteredCareItems, sortConfig, getSortValue]);

  const renderSortIndicator = (field, label) => {
    const isActive = sortConfig?.field === field;
    const isAsc = sortConfig?.order === 'ascend';

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {label}
        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
          <CaretUpOutlined style={{ fontSize: 10, color: isActive && isAsc ? '#1677ff' : '#bfbfbf' }} />
          <CaretDownOutlined style={{ fontSize: 10, color: isActive && !isAsc ? '#1677ff' : '#bfbfbf' }} />
        </span>
      </span>
    );
  };

  // Handles care item creation including optional category creation / reuse based on modal selection
  const handleCreateCareItem = async ({ careItemPayload, category }) => {
    let categoryId = null;

    if (category?.type === 'existing' && category.id) {
      categoryId = category.id;
    } else if (category?.type === 'new' && category.name) {
      const trimmedName = category.name.trim();

      const existingMatch = categoriesList.find((existingCategory) => (
        existingCategory.name?.trim().toLowerCase() === trimmedName.toLowerCase()
      ));

      if (existingMatch) {
        categoryId = existingMatch.id;
      } else {
        // Persist the new category first; backend returns the canonical id we then pass to the care item
        const createResponse = await createCategory.mutateAsync({ name: trimmedName });
        categoryId = createResponse?.data?.id || createResponse?.id || null;
      }
    }

    const payload = {
      ...careItemPayload,
      ...(categoryId ? { category_id: categoryId } : {}),
    };

    await createCareItem.mutateAsync(payload);
  };

  // Handles updates, including optional category reassignment or creation before PUT request
  const handleUpdateCareItem = async ({ id, careItemPayload, category }) => {
    let categoryId = null;

    if (category?.type === 'existing' && category.id) {
      categoryId = category.id;
    } else if (category?.type === 'new' && category.name) {
      const trimmedName = category.name.trim();

      const existingMatch = categoriesList.find((existingCategory) => (
        existingCategory.name?.trim().toLowerCase() === trimmedName.toLowerCase()
      ));

      if (existingMatch) {
        categoryId = existingMatch.id;
      } else {
        const createResponse = await createCategory.mutateAsync({ name: trimmedName });
        categoryId = createResponse?.data?.id || createResponse?.id || null;
      }
    }

    const payload = {
      ...careItemPayload,
      ...(categoryId ? { category_id: categoryId } : { category_id: null }),
    };

    await updateCareItem.mutateAsync({ id, payload });
  };

  const columns = [
    {
      title: renderSortIndicator('name', 'Item Name'),
      dataIndex: 'name',
      onHeaderCell: () => ({ onClick: () => toggleSort('name'), style: { cursor: 'pointer' } }),
      render: (value) => (
        <Text style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>
          {value || 'Untitled Item'}
        </Text>
      )
    },
    {
      title: renderSortIndicator('category', 'Category'),
      dataIndex: 'category_id',
      onHeaderCell: () => ({ onClick: () => toggleSort('category'), style: { cursor: 'pointer' } }),
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
      title: renderSortIndicator('unitCost', 'Unit Cost'),
      dataIndex: 'estimated_unit_cost',
      onHeaderCell: () => ({ onClick: () => toggleSort('unitCost'), style: { cursor: 'pointer' } }),
      render: (value) => (
        <Text style={{ fontSize: '14px', color: '#1f2937' }}>
          {formatCurrency(value)}
        </Text>
      )
    },
    {
      title: 'Quick Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="default"
            size="small"
            onClick={() => setEditingCareItem(record)}
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
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#5a7a9a' }}>
          Care Items
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Manage all care-related items, supplies, and services for your client.
        </Text>
      </div>

      <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <Space size={12} wrap>
            <Input
              allowClear
              placeholder="Search by item or category"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ width: 240 }}
            />

            <Select
              mode="multiple"
              allowClear
              placeholder="Filter by categories"
              value={selectedCategories}
              onChange={setSelectedCategories}
              style={{ minWidth: 220 }}
              maxTagCount={2}
            >
              {categoriesList.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>

            <Select
              value={costFilter}
              onChange={setCostFilter}
              style={{ width: 160 }}
            >
              {costOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>

            <RangePicker
              value={startDateRange}
              onChange={(value) => setStartDateRange(value)}
              allowClear
              placeholder={['Start from', 'Start to']}
            />
          </Space>

          <Space size={12}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ minWidth: 160 }}
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
              onClick={() => setIsCreateModalVisible(true)}
            >
              Add Care Item
            </Button>
          </Space>
        </div>

        <div className="care-items-table">
          <Table
            rowKey="id"
            loading={isCareItemsLoading || isCategoriesLoading}
            columns={columns}
            dataSource={sortedCareItems}
            pagination={{
              pageSize: 10,
              showSizeChanger: false
            }}
            size="small"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
      </Card>

      <style jsx>{`
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600 !important;
          color: #262626 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .care-items-table {
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }
        .care-items-table .ant-table-wrapper,
        .care-items-table .ant-spin-nested-loading,
        .care-items-table .ant-spin-container,
        .care-items-table .ant-table,
        .care-items-table .ant-table-container,
        .care-items-table .ant-table-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .care-items-table .ant-table-body {
          flex: 1;
          overflow: auto !important;
        }
        .care-items-table .ant-table-pagination {
          margin-top: auto;
        }
      `}</style>
      <AddCareItemModal
        open={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={handleCreateCareItem}
        categories={categoriesList}
        categoriesLoading={isCategoriesLoading}
        submitting={createCareItem.isPending || createCategory.isPending}
      />

      <EditCareItemModal
        open={!!editingCareItem}
        onClose={() => setEditingCareItem(null)}
        onSubmit={async (submission) => {
          if (!editingCareItem) {
            return;
          }
          await handleUpdateCareItem({
            id: editingCareItem.id,
            careItemPayload: submission.careItemPayload,
            category: submission.category,
          });
          setEditingCareItem(null);
        }}
        categories={categoriesList}
        categoriesLoading={isCategoriesLoading}
        submitting={updateCareItem.isPending || createCategory.isPending}
        initialItem={editingCareItem}
      />
    </div>
  );
};

export default CareItems;
