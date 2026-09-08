import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, TextArea, Select } from '@/components/ui';
import { useCreateJob, useUpdateJob } from '@/hooks/queries/useJobQueries';
import { Job } from '@/api/types';
import { extractApiError } from '@/api/utils';
import styles from './JobModal.module.css';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
];

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open (Active)' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'AUD', label: 'AUD ($)' },
];

export interface JobModalProps {
  open: boolean;
  onClose: () => void;
  job?: Job | null;
  onSuccess?: (job: Job) => void;
}

export const JobModal: React.FC<JobModalProps> = ({ open, onClose, job, onSuccess }) => {
  const isEditMode = !!job;
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    employment_type: 'FULL_TIME',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    status: 'OPEN',
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    if (open) {
      setApiError(null);
      setFormErrors({});
      if (job) {
        setFormData({
          title: job.title || '',
          description: job.description || '',
          location: job.location || '',
          employment_type: job.employment_type || 'FULL_TIME',
          salary_min: job.salary_min != null ? String(job.salary_min) : '',
          salary_max: job.salary_max != null ? String(job.salary_max) : '',
          salary_currency: job.salary_currency || 'USD',
          status: job.status || 'OPEN',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          location: '',
          employment_type: 'FULL_TIME',
          salary_min: '',
          salary_max: '',
          salary_currency: 'USD',
          status: 'OPEN',
        });
      }
    }
  }, [open, job]);

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'title' || field === 'description') {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const errors: { title?: string; description?: string } = {};
    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Job description is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload: Partial<Job> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      employment_type: formData.employment_type,
      salary_min: formData.salary_min ? formData.salary_min : null,
      salary_max: formData.salary_max ? formData.salary_max : null,
      salary_currency: formData.salary_currency || 'USD',
    };

    if (isEditMode) {
      payload.status = formData.status as Job['status'];
    }

    try {
      if (isEditMode && job) {
        const updated = await updateJob.mutateAsync({ id: job.id, data: payload });
        onSuccess?.(updated);
      } else {
        const created = await createJob.mutateAsync(payload);
        onSuccess?.(created);
      }
      onClose();
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  const isPending = createJob.isPending || updateJob.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
      maxWidth="680px"
    >
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {apiError && <div className={styles.errorMessage}>{apiError}</div>}

          <div className={styles.formGroup}>
            <Input
              label="Job Title *"
              value={formData.title}
              onChange={handleChange('title')}
              placeholder="e.g. Senior Frontend Engineer"
              error={formErrors.title}
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className={styles.row}>
            <Input
              label="Location"
              value={formData.location}
              onChange={handleChange('location')}
              placeholder="e.g. San Francisco, CA or Remote"
              disabled={isPending}
            />
            <Select
              label="Employment Type"
              options={EMPLOYMENT_TYPES}
              value={formData.employment_type}
              onChange={handleChange('employment_type')}
              disabled={isPending}
            />
          </div>

          <div className={styles.rowThree}>
            <Input
              label="Min Salary"
              type="number"
              value={formData.salary_min}
              onChange={handleChange('salary_min')}
              placeholder="e.g. 80000"
              disabled={isPending}
            />
            <Input
              label="Max Salary"
              type="number"
              value={formData.salary_max}
              onChange={handleChange('salary_max')}
              placeholder="e.g. 120000"
              disabled={isPending}
            />
            <Select
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={formData.salary_currency}
              onChange={handleChange('salary_currency')}
              disabled={isPending}
            />
          </div>

          {isEditMode && (
            <div className={styles.formGroup}>
              <Select
                label="Job Status"
                options={STATUS_OPTIONS}
                value={formData.status}
                onChange={handleChange('status')}
                disabled={isPending}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <TextArea
              label="Job Description *"
              rows={6}
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Provide a clear description of the role, responsibilities, and requirements..."
              error={formErrors.description}
              disabled={isPending}
            />
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {isEditMode ? 'Save Changes' : 'Publish Job'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default JobModal;
