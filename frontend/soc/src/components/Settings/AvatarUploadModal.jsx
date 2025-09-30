import React, { useState } from 'react';
import { Modal, Upload, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { showSuccessMessage, showErrorMessage, CLIENT_PROFILE_MESSAGES } from '../../utils/messageConfig';

const OBJECT_STORAGE_BASE_URL = import.meta.env.VITE_OBJECT_STORAGE_BASE_URL;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const AvatarUploadModal = ({ visible, onCancel, currentAvatarUrl, onSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Reset state when modal closes
  const handleCancel = () => {
    if (!uploading) {
      setFileList([]);
      setSelectedFile(null);
      setUploading(false);
      onCancel();
    }
  };

  // Validate file before upload
  const beforeUpload = (file) => {
    // Check file type
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type);
    if (!isValidType) {
      showErrorMessage('Only image files (JPG, PNG, GIF, WEBP) are allowed!');
      return Upload.LIST_IGNORE;
    }

    // Check file size
    const isValidSize = file.size <= MAX_FILE_SIZE;
    if (!isValidSize) {
      showErrorMessage('Image must be smaller than 10MB!');
      return Upload.LIST_IGNORE;
    }

    // Store the file for manual upload
    setSelectedFile(file);

    return false; // Prevent auto upload
  };

  // Handle file list change
  const handleChange = ({ fileList: newFileList }) => {
    // Only keep the last file
    setFileList(newFileList.slice(-1));
  };

  // Handle confirm button click - triggers manual upload
  const handleConfirm = () => {
    if (!selectedFile || fileList.length === 0) {
      showErrorMessage('Please select an image first');
      return;
    }

    // Trigger upload by updating fileList with uploading status
    const file = fileList[0];
    if (file.originFileObj) {
      uploadFile(file.originFileObj);
    }
  };

  // Perform the actual upload
  const uploadFile = async (file) => {
    setUploading(true);

    // Update file status to uploading
    setFileList((prev) =>
      prev.map((f) => ({
        ...f,
        status: 'uploading',
        percent: 0,
      }))
    );

    try {
      const formData = new FormData();
      formData.append('image', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setFileList((prev) =>
            prev.map((f) => ({
              ...f,
              percent,
            }))
          );
        }
      });

      // Handle upload completion
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);

            // Extract the location URL from response
            const imageUrl = response.file?.location;

            if (!imageUrl) {
              throw new Error('No image URL in response');
            }

            // Update file status to done
            setFileList((prev) =>
              prev.map((f) => ({
                ...f,
                status: 'done',
                percent: 100,
              }))
            );

            // Call the parent success handler with the image URL
            await handleUploadSuccess(imageUrl);
          } catch (error) {
            console.error('Error parsing upload response:', error);
            showErrorMessage(CLIENT_PROFILE_MESSAGES.ERROR.AVATAR_UPLOAD);
            setFileList((prev) =>
              prev.map((f) => ({
                ...f,
                status: 'error',
              }))
            );
            setUploading(false);
          }
        } else {
          console.error('Upload error:', xhr.responseText);
          showErrorMessage(CLIENT_PROFILE_MESSAGES.ERROR.AVATAR_UPLOAD);
          setFileList((prev) =>
            prev.map((f) => ({
              ...f,
              status: 'error',
            }))
          );
          setUploading(false);
        }
      });

      // Handle upload error
      xhr.addEventListener('error', () => {
        console.error('Network error during upload');
        showErrorMessage(CLIENT_PROFILE_MESSAGES.ERROR.AVATAR_UPLOAD);
        setFileList((prev) =>
          prev.map((f) => ({
            ...f,
            status: 'error',
          }))
        );
        setUploading(false);
      });

      // Open connection and send request
      xhr.open('POST', `${OBJECT_STORAGE_BASE_URL}/upload`);
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      showErrorMessage(CLIENT_PROFILE_MESSAGES.ERROR.AVATAR_UPLOAD);
      setFileList((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error',
        }))
      );
      setUploading(false);
    }
  };

  // Handle successful upload and update user profile
  const handleUploadSuccess = async (imageUrl) => {
    try {
      // Call the parent component's success handler with the new avatar URL
      await onSuccess(imageUrl);

      // Close modal and reset state
      setFileList([]);
      setSelectedFile(null);
      setUploading(false);
      onCancel();
    } catch (error) {
      console.error('Error updating avatar in profile:', error);
      showErrorMessage(CLIENT_PROFILE_MESSAGES.ERROR.AVATAR_UPDATE);
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Update Avatar"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={uploading}>
          Cancel
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleConfirm}
          disabled={!selectedFile || uploading}
          loading={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>,
      ]}
      width={500}
      destroyOnClose
      maskClosable={!uploading}
      closable={!uploading}
    >
      <div style={{ padding: '20px 0' }}>
        {/* Upload Component */}
        <Upload
          listType="picture-card"
          fileList={fileList}
          beforeUpload={beforeUpload}
          onChange={handleChange}
          accept="image/*"
          maxCount={1}
          disabled={uploading}
          showUploadList={{
            showPreviewIcon: false,
            showRemoveIcon: !uploading,
          }}
          onRemove={() => {
            setSelectedFile(null);
          }}
        >
          {fileList.length === 0 && (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Select Image</div>
            </div>
          )}
        </Upload>

        {/* Upload Instructions */}
        <div style={{ marginTop: '16px', color: '#8c8c8c', fontSize: '13px' }}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Supported formats: JPG, PNG, GIF, WEBP</li>
            <li>Maximum file size: 10MB</li>
            <li>Select an image and click "Upload" to update your avatar</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default AvatarUploadModal;