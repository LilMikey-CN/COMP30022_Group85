import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Table, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const EmergencyContactsModal = ({ visible, onCancel, onSave, initialData, loading = false }) => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (visible && initialData) {
      const contactsWithKeys = initialData.map((contact, index) => ({
        ...contact,
        key: index,
        id: index
      }));
      setContacts(contactsWithKeys);
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    try {
      const isValid = contacts.every(contact =>
        contact.name?.trim() &&
        contact.relationship?.trim() &&
        contact.mobileNumber?.trim() &&
        contact.emailAddress?.trim() &&
        validateEmail(contact.emailAddress) &&
        validatePhoneNumber(contact.mobileNumber)
      );

      if (!isValid) {
        message.warning({
          content: 'Please fill in all required fields for all emergency contacts.',
          duration: 3,
          style: { marginTop: '10vh' }
        });
        return;
      }

      // eslint-disable-next-line no-unused-vars
      const contactsToSave = contacts.map(({ key, id, ...contact }) => contact);
      onSave(contactsToSave);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      message.error({
        content: 'Failed to validate emergency contacts.',
        duration: 4,
        style: { marginTop: '10vh' }
      });
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleAddNew = () => {
    const newKey = Date.now();
    const newContact = {
      key: newKey,
      id: newKey,
      name: '',
      relationship: '',
      mobileNumber: '',
      emailAddress: ''
    };
    setContacts([...contacts, newContact]);
  };

  const handleDelete = (contactId) => {
    const updatedContacts = contacts.filter(contact => contact.id !== contactId);
    setContacts(updatedContacts);
  };

  const handleInputChange = (contactId, field, value) => {
    setContacts(prev => prev.map(contact =>
      contact.id === contactId ? { ...contact, [field]: value } : contact
    ));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+?61|0)?[2-9]\d{8}$|^04\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '22%',
      align: 'center',
      render: (text, record) => (
        <Input
          value={text || ''}
          onChange={(e) => handleInputChange(record.id, 'name', e.target.value)}
          placeholder="Enter contact name"
          size="small"
        />
      ),
    },
    {
      title: 'Relationship',
      dataIndex: 'relationship',
      key: 'relationship',
      width: '18%',
      align: 'center',
      render: (text, record) => (
        <Input
          value={text || ''}
          onChange={(e) => handleInputChange(record.id, 'relationship', e.target.value)}
          placeholder="Enter relationship"
          size="small"
        />
      ),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      width: '22%',
      align: 'center',
      render: (text, record) => (
        <Input
          value={text || ''}
          onChange={(e) => handleInputChange(record.id, 'mobileNumber', e.target.value)}
          placeholder="Enter mobile number"
          size="small"
        />
      ),
    },
    {
      title: 'Email',
      dataIndex: 'emailAddress',
      key: 'emailAddress',
      width: '30%',
      align: 'center',
      render: (text, record) => (
        <Input
          value={text || ''}
          onChange={(e) => handleInputChange(record.id, 'emailAddress', e.target.value)}
          placeholder="Enter email address"
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '8%',
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="Delete Emergency Contact"
          description="Are you sure you want to delete this emergency contact?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title="Manage Emergency Contacts"
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={loading}
      okButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      width={1000}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={contacts}
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
          locale={{
            emptyText: 'No emergency contacts added yet. Click "Add Emergency Contact" to get started.'
          }}
          rowClassName={() => 'emergency-contact-editable-row'}
        />

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddNew}
          style={{ width: '100%' }}
        >
          Add Emergency Contact
        </Button>
      </div>

    </Modal>
  );
};

export default EmergencyContactsModal;
