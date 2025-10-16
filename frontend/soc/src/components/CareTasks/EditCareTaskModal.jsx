import React, { useCallback, useEffect } from 'react';
import { Modal, Form, message } from 'antd';
import dayjs from 'dayjs';
import CareTaskForm from './CareTaskForm';
import { RECURRENCE_PRESETS } from './recurrencePresets';
import {
  clampDateToCurrentYear,
  getCurrentYearBounds,
} from '../../utils/careTaskDateUtils';

const resolveRecurrencePreset = (interval) => {
  const preset = RECURRENCE_PRESETS.find((item) => Number(item.interval) === Number(interval));
  if (preset && preset.value !== 'custom') {
    return preset.value;
  }
  return 'custom';
};

const EditCareTaskModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  task,
  categories = [],
  categoriesLoading = false,
  onCreateCategory,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (task && open) {
      const recurrencePreset = resolveRecurrencePreset(task.recurrence_interval_days);
      const categoryMatch = categories.find((category) => category.id === task.category_id);
      const categoryName = categoryMatch?.name || task.category_name || task.category_id || '';
      const clampedStart = clampDateToCurrentYear(task.start_date ? dayjs(task.start_date) : dayjs());
      const { end: yearEnd } = getCurrentYearBounds();
      const isOneOff = Number(task.recurrence_interval_days ?? 0) === 0;
      const baseEndSource = task.end_date ? dayjs(task.end_date) : clampedStart;
      const clampedEnd = isOneOff ? null : clampDateToCurrentYear(baseEndSource) ?? clampDateToCurrentYear(yearEnd);
      form.setFieldsValue({
        name: task.name,
        description: task.description || '',
        task_type: task.task_type,
        recurrencePreset,
        recurrence_interval_days: Number(task.recurrence_interval_days ?? 0),
        start_date: clampedStart,
        end_date: clampedEnd,
        category_input: categoryName,
        category_id: task.category_id || null,
        yearly_budget: task.yearly_budget ?? null,
      });
    } else {
      form.resetFields();
    }
  }, [form, task, open, categories]);

  const resetAndClose = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const trimmedCategoryInput = values.category_input ? values.category_input.trim() : '';
      let categoryId = values.category_id || task?.category_id || null;

      if (trimmedCategoryInput) {
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

      const rawYearlyBudget = values.yearly_budget;
      let yearlyBudget;
      if (rawYearlyBudget === undefined) {
        yearlyBudget = task?.yearly_budget ?? null;
      } else if (rawYearlyBudget === null || rawYearlyBudget === '') {
        yearlyBudget = null;
      } else {
        yearlyBudget = Number(rawYearlyBudget);
      }

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() ?? '',
        task_type: values.task_type,
        recurrence_interval_days: Number(values.recurrence_interval_days ?? 0),
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
        category_id: categoryId,
        yearly_budget: yearlyBudget,
      };

      await onSubmit(payload);
      resetAndClose();
    } catch (error) {
      if (!error?.errorFields) {
        // handled by mutation hook
      }
    }
  }, [categories, form, onCreateCategory, onSubmit, resetAndClose, task?.category_id, task?.yearly_budget]);

  return (
    <Modal
      open={open}
      title="Edit care task"
      okText="Save changes"
      onCancel={resetAndClose}
      onOk={handleOk}
      confirmLoading={submitting}
      destroyOnClose
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <CareTaskForm
        form={form}
        mode="edit"
        initialTask={task}
        categories={categories}
        categoriesLoading={categoriesLoading}
        isTaskTypeEditable={false}
        isFrequencyEditable={false}
        isStartDateEditable={false}
        defaultTaskType="PURCHASE"
        minimumEndDate={task?.end_date || null}
      />
    </Modal>
  );
};

export default EditCareTaskModal;
