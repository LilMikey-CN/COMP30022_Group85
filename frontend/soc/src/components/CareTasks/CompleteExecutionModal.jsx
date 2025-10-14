import React, { useState, useEffect, useRef } from 'react';
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
  maxCoverableExecutions = null,
}) => {
  const [form] = Form.useForm();
  const [uploadList, setUploadList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const requiresCost = task?.task_type === 'PURCHASE';
  const rawQuantityValue = Form.useWatch('quantity', form);
  const normalizedQuantity = Number(rawQuantityValue ?? 1);
  const safeQuantity = Number.isFinite(normalizedQuantity) && normalizedQuantity > 0
    ? normalizedQuantity
    : 1;
  const requestedAdditional = Math.max(safeQuantity - 1, 0);
  const coverCap = typeof maxCoverableExecutions === 'number'
    ? Math.max(maxCoverableExecutions, 0)
    : null;
  const effectiveAdditional = coverCap === null
    ? requestedAdditional
    : Math.min(requestedAdditional, coverCap);

  let coverageHint = 'This completion will only apply to this execution.';
  if (effectiveAdditional > 0) {
    const plural = effectiveAdditional === 1 ? '' : 's';
    if (coverCap !== null && requestedAdditional > coverCap) {
      coverageHint = `This completion will cover ${effectiveAdditional} additional execution${plural}; all remaining executions for this task will be marked as covered.`;
    } else {
      coverageHint = `This completion will cover ${effectiveAdditional} additional execution${plural}.`;
    }
  } else if (requestedAdditional > 0 && coverCap === 0) {
    coverageHint = 'No additional executions remain to cover for this task.';
  }

  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
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
    setIsProcessing(false);
  }, [open, execution, form]);

  const beforeUpload = (file) => {
    if (submitting || isProcessing) {
      return Upload.LIST_IGNORE;
    }

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
    if (submitting || isProcessing) {
      return;
    }

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
      setIsProcessing(true);
      await onSubmit({
        actualCost: values.actual_cost,
        notes: values.notes,
        file: selectedFile,
        quantity: values.quantity ? Number(values.quantity) : 1,
      });
      form.resetFields();
      setUploadList([]);
      setSelectedFile(null);
    } catch (err) {
      if (!err?.errorFields) {
        console.error(err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleCancel = () => {
    if (submitting || isProcessing) return;
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
      confirmLoading={submitting || isProcessing}
      destroyOnClose
      okButtonProps={{ disabled: submitting || isProcessing }}
      cancelButtonProps={{ disabled: submitting || isProcessing }}
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
                disabled={submitting || isProcessing}
              />
            </Form.Item>
            <div style={{ marginTop: -8, marginBottom: 16 }}>
              <Typography.Text type="secondary">{coverageHint}</Typography.Text>
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
              disabled={submitting || isProcessing}
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
              disabled={submitting || isProcessing}
            />
          </Form.Item>
        )}

        <Form.Item
          name="notes"
          label="Notes"
          rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
        >
          <Input.TextArea
            rows={3}
            showCount
            maxLength={500}
            placeholder="Optional notes about this execution"
            disabled={submitting || isProcessing}
          />
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
              if (submitting || isProcessing) {
                return false;
              }
              setUploadList([]);
              setSelectedFile(null);
              return true;
            }}
            onChange={handleUploadChange}
            fileList={uploadList}
            accept="image/*"
            disabled={submitting || isProcessing}
            showUploadList={{ showRemoveIcon: !(submitting || isProcessing) }}
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
