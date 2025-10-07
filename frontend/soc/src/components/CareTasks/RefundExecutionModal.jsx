import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Modal, Form, InputNumber, DatePicker, Input, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const OBJECT_STORAGE_BASE_URL = import.meta.env.VITE_OBJECT_STORAGE_BASE_URL;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

const RefundExecutionModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  execution,
  maxAmount = null
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const resetAndClose = useCallback(() => {
    form.resetFields();
    setFileList([]);
    setUploading(false);
    onClose?.();
  }, [form, onClose]);

  useEffect(() => {
    if (!open) {
      setFileList([]);
      setUploading(false);
      return;
    }

    const defaults = {
      refund_amount: undefined,
      refund_date: dayjs(),
      refund_reason: '',
      refund_evidence_url: ''
    };

    const nextValues = { ...defaults };
    let initialFileList = [];

    if (execution?.refund) {
      const { refund } = execution;
      nextValues.refund_amount = refund.refund_amount || undefined;
      nextValues.refund_reason = refund.refund_reason || '';
      nextValues.refund_evidence_url = refund.refund_evidence_url || '';
      if (refund.refund_date) {
        nextValues.refund_date = dayjs(refund.refund_date);
      }

      if (refund.refund_evidence_url) {
        initialFileList = [
          {
            uid: '-1',
            name: 'evidence',
            status: 'done',
            url: refund.refund_evidence_url
          }
        ];
      }
    }

    form.setFieldsValue(nextValues);
    setFileList(initialFileList);
    setUploading(false);
  }, [open, execution, form]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        refund_amount: Number(values.refund_amount),
        refund_reason: values.refund_reason?.trim() || undefined,
        refund_evidence_url: values.refund_evidence_url?.trim() || undefined,
        refund_date: values.refund_date ? dayjs(values.refund_date).format('YYYY-MM-DD') : undefined
      };
      await onSubmit?.(payload);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // handled upstream in hooks
      }
    }
  }, [form, onSubmit, resetAndClose]);

  const beforeUpload = useCallback((file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error('Only image files (JPG, PNG, GIF, WEBP) are allowed');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_FILE_SIZE) {
      message.error('Image must be smaller than 10MB');
      return Upload.LIST_IGNORE;
    }

    if (!OBJECT_STORAGE_BASE_URL) {
      message.error('File storage is not configured');
      return Upload.LIST_IGNORE;
    }

    const uploadEvidence = async () => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${OBJECT_STORAGE_BASE_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const location = data?.file?.location;
        if (!location) {
          throw new Error('Upload response missing file location');
        }

        setFileList([
          {
            uid: file.uid,
            name: file.name,
            status: 'done',
            url: location
          }
        ]);
        form.setFieldsValue({ refund_evidence_url: location });
        message.success('Evidence uploaded');
      } catch (error) {
        console.error('Evidence upload failed:', error);
        message.error('Failed to upload evidence image');
      } finally {
        setUploading(false);
      }
    };

    uploadEvidence();
    return Upload.LIST_IGNORE;
  }, [form]);

  const handleRemove = useCallback(() => {
    if (uploading) {
      return false;
    }
    setFileList([]);
    form.setFieldsValue({ refund_evidence_url: null });
    return true;
  }, [form, uploading]);

  const uploadButton = useMemo(() => (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>{uploading ? 'Uploading...' : 'Upload'}</div>
    </div>
  ), [uploading]);

  return (
    <Modal
      open={open}
      title="Record refund"
      okText="Record refund"
      onCancel={resetAndClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting || uploading }}
      cancelButtonProps={{ disabled: submitting || uploading }}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="refund_amount"
          label="Refund amount"
          rules={[
            { required: true, message: 'Enter the refund amount' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value === undefined || value === null || value === '') {
                  return Promise.resolve();
                }
                const numeric = Number(value);
                if (Number.isNaN(numeric) || numeric <= 0) {
                  return Promise.reject(new Error('Refund amount must be greater than 0'));
                }
                if (maxAmount !== null && maxAmount !== undefined && numeric > maxAmount) {
                  return Promise.reject(new Error(`Refund cannot exceed $${Number(maxAmount).toFixed(2)}`));
                }
                return Promise.resolve();
              }
            })
          ]}
        >
          <InputNumber
            min={0}
            step={0.5}
            style={{ width: '100%' }}
            addonBefore="$"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="refund_date"
          label="Refund date"
          rules={[{ required: true, message: 'Select the refund date' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="refund_reason"
          label="Reason"
          rules={[{ max: 500, message: 'Reason cannot exceed 500 characters' }]}
        >
          <Input.TextArea rows={3} showCount maxLength={500} placeholder="Optional explanation for the refund" />
        </Form.Item>

        <Form.Item label="Evidence image">
          <Upload
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onRemove={handleRemove}
            maxCount={1}
            showUploadList={{ showPreviewIcon: false }}
            disabled={uploading || submitting}
          >
            {fileList.length >= 1 ? null : uploadButton}
          </Upload>
        </Form.Item>

        <Form.Item name="refund_evidence_url" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RefundExecutionModal;
