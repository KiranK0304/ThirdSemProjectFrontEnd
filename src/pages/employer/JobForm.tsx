import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Input, TextArea, Select, Modal, LoadingSpinner } from '@/components/ui';
import { useEmployerJob, useCreateJob, useUpdateJob, useDeleteJob } from '@/hooks/queries/useJobQueries';
import { Job } from '@/api/types';
import { extractApiError } from '@/api/utils';
import styles from './JobForm.module.css';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' }
];

export const JobForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const jobId = Number(id);
  const navigate = useNavigate();

  const { data: job, isLoading: isLoadingJob } = useEmployerJob(jobId);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    employment_type: 'FULL_TIME',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD'
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (job && isEditMode) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        location: job.location || '',
        employment_type: job.employment_type || 'FULL_TIME',
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        salary_currency: job.salary_currency || 'USD'
      });
    }
  }, [job, isEditMode]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    try {
      const payload: Partial<Job> = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        employment_type: formData.employment_type,
        salary_min: formData.salary_min || null,
        salary_max: formData.salary_max || null,
        salary_currency: formData.salary_currency || 'USD',
      };

      if (isEditMode) {
        await updateJob.mutateAsync({ id: jobId, data: payload });
      } else {
        await createJob.mutateAsync(payload);
      }
      navigate('/employer/jobs');
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob.mutateAsync(jobId);
      setIsDeleteModalOpen(false);
      navigate('/employer/jobs');
    } catch (err) {
      setApiError(extractApiError(err));
      setIsDeleteModalOpen(false);
    }
  };

  if (isEditMode && isLoadingJob) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEditMode ? 'Edit Job Posting' : 'Post a New Job'}</h1>
        {isEditMode && (
          <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
            Delete Job
          </Button>
        )}
      </div>

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {apiError && <div className={styles.errorMessage}>{apiError}</div>}
          
          <div style={{ marginBottom: '16px' }}>
            <Input 
              label="Title" 
              required 
              value={formData.title} 
              onChange={handleChange('title')} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <TextArea 
              label="Description" 
              required 
              rows={6} 
              value={formData.description} 
              onChange={handleChange('description')} 
            />
          </div>

          <div className={styles.row} style={{ marginBottom: '16px' }}>
            <Input 
              label="Location" 
              value={formData.location} 
              onChange={handleChange('location')} 
            />
            <Select 
              label="Employment Type" 
              options={EMPLOYMENT_TYPES} 
              value={formData.employment_type} 
              onChange={handleChange('employment_type')} 
            />
          </div>

          <div className={styles.row}>
            <Input 
              label="Minimum Salary" 
              type="number" 
              value={formData.salary_min} 
              onChange={handleChange('salary_min')} 
            />
            <Input 
              label="Maximum Salary" 
              type="number" 
              value={formData.salary_max} 
              onChange={handleChange('salary_max')} 
            />
            <Input 
              label="Currency" 
              value={formData.salary_currency} 
              onChange={handleChange('salary_currency')} 
            />
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={isEditMode ? updateJob.isPending : createJob.isPending}
            >
              {isEditMode ? 'Save Changes' : 'Publish'}
            </Button>
          </div>
        </form>
      </Card>

      <Modal 
        open={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Job"
        actions={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deleteJob.isPending} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this job? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default JobForm;
