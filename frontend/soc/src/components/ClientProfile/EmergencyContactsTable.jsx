import React from 'react';
import { Table } from 'antd';

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Relationship',
    dataIndex: 'relationship',
    key: 'relationship',
  },
  {
    title: 'Mobile number',
    dataIndex: 'mobileNumber',
    key: 'mobileNumber',
  },
  {
    title: 'Email address',
    dataIndex: 'emailAddress',
    key: 'emailAddress',
  },
];

const EmergencyContactsTable = ({ contacts = [] }) => (
  <Table
    columns={columns}
    dataSource={contacts.map((contact, index) => ({
      ...contact,
      key: index,
    }))}
    pagination={false}
    size="small"
    style={{ border: 'none' }}
    locale={{ emptyText: 'No emergency contacts added' }}
  />
);

export default EmergencyContactsTable;
