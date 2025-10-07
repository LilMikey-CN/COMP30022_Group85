import React, { useCallback } from 'react';
import { Modal, Form, message } from 'antd';
import dayjs from 'dayjs';
import CareTaskForm from './CareTaskForm';

const AddCareTaskModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  categories = [],
  categoriesLoading = false,
  onCreateCategory,
}) => {
  const [form] = Form.useForm();

  const resetAndClose = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const trimmedCategoryInput = values.category_input ? values.category_input.trim() : '';
      let categoryId = values.category_id || null;

      if (!categoryId && trimmedCategoryInput) {
        const existingMatch = categories.find(
          (category) => category.name.trim().toLowerCase() === trimmedCategoryInput.toLowerCase()
        );
        if (existingMatch) {
          categoryId = existingMatch.id;
        }
      }

      if (!categoryId && trimmedCategoryInput) {
        if (!onCreateCategory) {
          message.error('Unable to create category. Please select an existing option.');
          return;
        }
        const newCategory = await onCreateCategory({ name: trimmedCategoryInput });
        categoryId = newCategory?.id || null;
        if (categoryId) {
          form.setFieldsValue({ category_id: categoryId });
        }
      }

      if (!categoryId) {
        message.error('Please select or create a category before saving.');
        return;
      }

      const rawEstimatedCost = values.estimated_unit_cost;
      const estimatedUnitCost =
        rawEstimatedCost === null || rawEstimatedCost === undefined || rawEstimatedCost === ''
          ? null
          : Number(rawEstimatedCost);

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        task_type: values.task_type,
        recurrence_interval_days: Number(values.recurrence_interval_days ?? 0),
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
        category_id: categoryId,
        estimated_unit_cost: estimatedUnitCost,
      };

      await onSubmit(payload);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // error message handled by mutation hook
      }
    }
  }, [form, onSubmit, resetAndClose, categories, onCreateCategory]);

  return (
    <Modal
      open={open}
      title="Create care task"
      okText="Create"
      onCancel={resetAndClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <CareTaskForm
        form={form}
        mode="create"
        categories={categories}
        categoriesLoading={categoriesLoading}
      />
    </Modal>
  );
};

export default AddCareTaskModal;
