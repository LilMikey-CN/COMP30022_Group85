import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Table, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const EmergencyContactsModal = ({ visible, onCancel, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [editingKeys, setEditingKeys] = useState([]);

  useEffect(() => {
    if (visible && initialData) {
      const contactsWithKeys = initialData.map((contact, index) => ({
        ...contact,
        key: index,
        id: index // Add ID for tracking
      }));
      setContacts(contactsWithKeys);
      // Set all existing contacts as editable
      setEditingKeys(contactsWithKeys.map(contact => contact.key));
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    try {
      // Validate all contacts
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

      setLoading(true);

      // Placeholder for API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate API response - you can replace this with actual API call
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        message.success({
          content: 'Emergency contacts updated successfully!',
          duration: 3,
          style: { marginTop: '10vh' }
        });
        // eslint-disable-next-line no-unused-vars
        const contactsToSave = contacts.map(({ key, id, ...contact }) => contact);
        onSave(contactsToSave);
      } else {
        message.error({
          content: 'Failed to update emergency contacts. Server error occurred. Please try again.',
          duration: 4,
          style: { marginTop: '10vh' }
        });
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      message.error({
        content: 'Failed to update emergency contacts. Network connection error.',
        duration: 4,
        style: { marginTop: '10vh' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingKeys([]);
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
    setEditingKeys([...editingKeys, newKey]);
  };

  const handleDelete = async (contactId) => {
    try {
      // Placeholder for API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate API response
      const success = Math.random() > 0.1;

      if (success) {
        const updatedContacts = contacts.filter(contact => contact.id !== contactId);
        setContacts(updatedContacts);
        setEditingKeys(editingKeys.filter(key => key !== contactId));
        message.success({
          content: 'Emergency contact deleted successfully!',
          duration: 3,
          style: { marginTop: '10vh' }
        });
      } else {
        message.error({
          content: 'Failed to delete emergency contact. Server error occurred. Please try again.',
          duration: 4,
          style: { marginTop: '10vh' }
        });
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      message.error({
        content: 'Failed to delete emergency contact. Network connection error.',
        duration: 4,
        style: { marginTop: '10vh' }
      });
    }
  };

  const handleInputChange = (key, field, value) => {
    const updatedContacts = contacts.map(contact =>
      contact.key === key ? { ...contact, [field]: value } : contact
    );
    setContacts(updatedContacts);
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+?61|0)?[2-9]\d{8}$|^04\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const EditableCell = ({ value, onChange, placeholder, validator }) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [error, setError] = useState('');

    useEffect(() => {
      setInputValue(value || '');
    }, [value]);

    const handleChange = (e) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);

      // Clear error when user starts typing
      if (error && newValue.trim()) {
        setError('');
      }
    };

    const handleBlur = () => {
      if (validator && inputValue.trim() && !validator(inputValue)) {
        setError('Invalid format');
      } else if (inputValue.trim()) {
        setError('');
      }
    };

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '40px',
        width: '100%'
      }}>
        <Input
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          size="small"
          status={error ? 'error' : ''}
          style={{
            border: error ? '1px solid #ff4d4f' : undefined,
            borderRadius: '4px'
          }}
        />
        {error && (
          <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '2px' }}>
            {error}
          </div>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '22%',
      align: 'center',
      render: (text, record) => (
        <EditableCell
          value={text}
          onChange={(value) => handleInputChange(record.key, 'name', value)}
          placeholder="Enter contact name"
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
        <EditableCell
          value={text}
          onChange={(value) => handleInputChange(record.key, 'relationship', value)}
          placeholder="Enter relationship"
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
        <EditableCell
          value={text}
          onChange={(value) => handleInputChange(record.key, 'mobileNumber', value)}
          placeholder="Enter mobile number"
          validator={validatePhoneNumber}
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
        <EditableCell
          value={text}
          onChange={(value) => handleInputChange(record.key, 'emailAddress', value)}
          placeholder="Enter email address"
          validator={validateEmail}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '8%',
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40px' }}>
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
        </div>
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
      width={1000}
      destroyOnClose
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
