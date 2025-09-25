import React, { useState } from 'react';
import { Card, Button, Dropdown, Collapse, Typography, Space } from 'antd';
import { MoreOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../data/budgetCalculations';
import { getCareItemsByCategory } from '../../data/dataHelpers';
import CareItemCard from './CareItemCard';

const { Text } = Typography;
const { Panel } = Collapse;

const CategoryBudgetCard = ({
  category,
  loading,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  allTasks = []
}) => {
  const [showCareItems, setShowCareItems] = useState(false);

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Category',
      icon: <EditOutlined />,
      onClick: onEdit
    },
    {
      key: 'addSub',
      label: 'Add Subcategory',
      icon: <PlusOutlined />,
      onClick: onAddSubcategory
    },
    {
      key: 'delete',
      label: 'Delete Category',
      icon: <DeleteOutlined />,
      onClick: onDelete,
      danger: true
    }
  ];

  const categoryTasks = allTasks.filter(task => task.budgetCategoryId === category.id);

  return (
    <Card
      style={{
        marginBottom: '24px',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      {/* Category Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: category.color || '#d9d9d9'
              }}
            />
            <Text style={{ fontSize: '20px', fontWeight: 600, color: '#2c3e50' }}>
              {category.name}
            </Text>
            <Text style={{ fontSize: '12px', color: '#7f8c8d', fontStyle: 'italic' }}>
              {category.description}
            </Text>
          </div>

          {/* Budget Summary */}
          <div style={{ display: 'flex', gap: '32px', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: '12px',
                color: '#7f8c8d',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: '4px'
              }}>
                Annual Budget
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#2c3e50' }}>
                {formatCurrency(category.annualBudget)}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                color: '#7f8c8d',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: '4px'
              }}>
                Remaining
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#2dce89' }}>
                {formatCurrency(category.remaining)}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                color: '#7f8c8d',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: '4px'
              }}>
                Spent
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#f5365c' }}>
                {formatCurrency(category.actualSpent)}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                color: '#7f8c8d',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                marginBottom: '4px'
              }}>
                Utilization
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 600,
                color: category.utilization > 100 ? '#ff4d4f' : category.utilization > 80 ? '#fa8c16' : '#52c41a'
              }}>
                {category.utilization}%
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#7f8c8d' }}>
            <span>{category.careItems?.length || 0} care items</span>
            <span>{category.subcategoryBreakdown?.length || 0} subcategories</span>
            <span>{categoryTasks.filter(t => t.status === 'completed').length} completed tasks</span>
          </div>
        </div>

        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ width: '36px', height: '36px' }}
            disabled={loading}
          />
        </Dropdown>
      </div>

      {/* Care Items Section */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <Button
            type="text"
            onClick={() => setShowCareItems(!showCareItems)}
            style={{ padding: 0, height: 'auto', color: '#5e72e4', fontWeight: 500 }}
            icon={showCareItems ? <DownOutlined /> : <RightOutlined />}
          >
            Care Tasks ({category.careItems?.length || 0})
          </Button>
          {/*
            Maybe not needed here?
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            style={{ fontSize: '12px', color: '#5e72e4', padding: 0 }}
          >
            Add care task
          </Button>
          */}
        </div>

        {showCareItems && (
          <div style={{ marginTop: '12px' }}>
            {category.careItems && category.careItems.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {category.careItems.map(careItem => (
                  <CareItemCard
                    key={careItem.id}
                    careItem={careItem}
                    tasks={categoryTasks.filter(task => task.careItemId === careItem.id)}
                  />
                ))}
              </Space>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                color: '#8c8c8c',
                fontSize: '14px'
              }}>
                No care items in this category yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subcategories Section */}
      {category.subcategoryBreakdown && category.subcategoryBreakdown.length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{
              fontSize: '12px',
              color: '#7f8c8d',
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}>
              Subcategories
            </span>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={onAddSubcategory}
              style={{ fontSize: '12px', color: '#5e72e4', padding: 0 }}
            >
              Add subcategory
            </Button>
          </div>

          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {category.subcategoryBreakdown.map(subcategory => (
              <SubcategoryItem
                key={subcategory.id}
                subcategory={subcategory}
                loading={loading}
                onEdit={() => onEditSubcategory(subcategory)}
                onDelete={() => onDeleteSubcategory(subcategory)}
              />
            ))}
          </Space>
        </div>
      )}

      {/* Add subcategory button when no subcategories exist */}
      {(!category.subcategoryBreakdown || category.subcategoryBreakdown.length === 0) && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={onAddSubcategory}
            style={{ width: '100%', color: '#5e72e4', borderColor: '#5e72e4' }}
          >
            Add subcategory
          </Button>
        </div>
      )}
    </Card>
  );
};

// Subcategory Item Component
const SubcategoryItem = ({ subcategory, loading, onEdit, onDelete }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2c3e50', minWidth: '120px' }}>
          {subcategory.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', paddingRight: '10px', borderRight: '1px solid #e9ecef' }}>
            <span style={{ color: '#7f8c8d' }}>
              Budget: <span style={{ fontWeight: 600, color: '#2c3e50' }}>{formatCurrency(subcategory.annualBudget)}</span>
            </span>
            <span style={{ color: '#7f8c8d' }}>
              Remaining: <span style={{ fontWeight: 600, color: '#2c3e50' }}>{formatCurrency(subcategory.remaining)}</span>
            </span>
            <span style={{ color: '#7f8c8d' }}>
              Spent: <span style={{ fontWeight: 600, color: '#2c3e50' }}>{formatCurrency(subcategory.actualSpent)}</span>
            </span>
            <span style={{ color: '#7f8c8d' }}>
              Items: <span style={{ fontWeight: 600, color: '#2c3e50' }}>{subcategory.careItems?.length || 0}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="small"
              onClick={onEdit}
              disabled={loading}
              style={{ background: '#e3f2fd', color: '#2196f3', border: 'none', fontSize: '11px' }}
            >
              Edit
            </Button>
            <Button
              size="small"
              onClick={onDelete}
              disabled={loading}
              style={{ background: '#ffebee', color: '#f44336', border: 'none', fontSize: '11px' }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryBudgetCard;
