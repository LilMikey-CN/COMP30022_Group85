import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Upload, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { showErrorMessage } from '../../utils/messageConfig';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const CompleteExecutionModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  task,
  execution,
}) => {
  const [form] = Form.useForm();
  const [uploadList, setUploadList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  const requiresCost = task?.task_type === 'PURCHASE';
  const quantityValue = Form.useWatch('quantity', form) || 1;
  const additionalCovered = Math.max(quantityValue - 1, 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      actual_cost: execution?.actual_cost ?? undefined,
      notes: execution?.notes ?? '',
      quantity: execution?.quantity ?? 1
    });
    setUploadList([]);
    setSelectedFile(null);
    setFileError(null);
  }, [open, execution, form]);

  const beforeUpload = (file) => {
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type);
    if (!isValidType) {
      showErrorMessage('Only image files (JPG, PNG, GIF, WEBP) are allowed');
      return Upload.LIST_IGNORE;
    }

    const isValidSize = file.size <= MAX_FILE_SIZE;
    if (!isValidSize) {
      showErrorMessage('Image must be smaller than 10MB');
      return Upload.LIST_IGNORE;
    }

    setFileError(null);
    setSelectedFile(file);
    setUploadList([{
      uid: file.uid || `${file.name}-${Date.now()}`,
      name: file.name,
      status: 'done',
      originFileObj: file,
    }]);
    return false;
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    if (newFileList.length === 0) {
      setUploadList([]);
      setSelectedFile(null);
      return;
    }

    const latest = newFileList.slice(-1)[0];
    const origin = latest.originFileObj || selectedFile;
    setUploadList([{ ...latest, status: 'done', originFileObj: origin }]);
    setSelectedFile(origin);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setFileError(null);
      await onSubmit({
        actualCost: values.actual_cost,
        notes: values.notes,
        file: selectedFile,
        quantity: values.quantity || 1,
      });
      form.resetFields();
      setUploadList([]);
      setSelectedFile(null);
    } catch (err) {
      if (!err?.errorFields) {
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    form.resetFields();
    setUploadList([]);
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  return (
    <Modal
      title="Complete task execution"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Mark as done"
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          actual_cost: execution?.actual_cost ?? undefined,
          notes: execution?.notes ?? '',
          quantity: execution?.quantity ?? 1,
        }}
      >
        {requiresCost && (
          <>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: 'Please enter the quantity' }, { type: 'number', min: 1, message: 'Quantity must be at least 1' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                step={1}
                stringMode
                disabled={submitting}
              />
            </Form.Item>
            <div style={{ marginTop: -8, marginBottom: 16 }}>
              <Typography.Text type="secondary">
                {additionalCovered > 0
                  ? `This completion will cover ${additionalCovered} additional execution${additionalCovered === 1 ? '' : 's'}.`
                  : 'This completion will only apply to this execution.'}
              </Typography.Text>
            </div>
          </>
        )}

        {requiresCost && (
          <Form.Item
            name="actual_cost"
            label="Actual cost (AUD)"
            rules={[{ required: true, message: 'Please enter the actual cost' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.5}
              stringMode
            />
          </Form.Item>
        )}

        {!requiresCost && (
          <Form.Item name="actual_cost" label="Actual cost (optional)">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.5}
              stringMode
            />
          </Form.Item>
        )}

        <Form.Item
          name="notes"
          label="Notes"
          rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
        >
          <Input.TextArea rows={3} showCount maxLength={500} placeholder="Optional notes about this execution" />
        </Form.Item>

        <Form.Item
          label="Evidence image (optional)"
          validateStatus={fileError ? 'error' : undefined}
          help={fileError}
        >
          <Upload.Dragger
            multiple={false}
            beforeUpload={beforeUpload}
            onRemove={() => {
              setUploadList([]);
              setSelectedFile(null);
            }}
            onChange={handleUploadChange}
            fileList={uploadList}
            accept="image/*"
            showUploadList={{ showRemoveIcon: !submitting }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Click or drag file to upload evidence image</p>
            <p className="ant-upload-hint">Max size 10MB. Accepted formats: JPG, PNG, GIF, WEBP</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompleteExecutionModal;
