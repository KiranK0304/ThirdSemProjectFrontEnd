import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Tag, ErrorState, LoadingSpinner } from '@/components/ui';
import { useEmployerJob, useJob } from '@/hooks/queries/useJobQueries';
import { formatDate, formatSalary } from '@/utils/date';
import { formatEmploymentType, getJobStatusVariant } from '@/utils/format';
import { 
  FiArrowLeft, FiEdit2, FiUsers, FiCpu, 
  FiMapPin, FiBriefcase, FiDollarSign, FiCalendar 
} from 'react-icons/fi';
import styles from './JobDetail.module.css';

export const EmployerJobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const jobId = Number(id);

  // Try employer-specific endpoint first, fallback to standard job query
  const employerQuery = useEmployerJob(jobId);
  const publicQuery = useJob(jobId);

  const isLoading = employerQuery.isLoading && publicQuery.isLoading;
  const job = employerQuery.data || publicQuery.data;
  const error = employerQuery.error || publicQuery.error;
  const refetch = () => {
    employerQuery.refetch();
    publicQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={styles.container}>
        <button 
          type="button" 
          className={styles.backButton}
          onClick={() => navigate('/employer/jobs')}
        >
          <FiArrowLeft /> Back to Job Postings
        </button>
        <ErrorState 
          message="Failed to load job details. The job may not exist or you may not have permission to view it." 
          onRetry={refetch} 
        />
      </div>
    );
  }

  const salaryDisplay = (job.salary_min || job.salary_max) 
    ? formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')
    : 'Not specified';

  return (
    <div className={styles.container}>
      {/* Back navigation */}
      <button 
        type="button" 
        className={styles.backButton}
        onClick={() => navigate('/employer/jobs')}
      >
        <FiArrowLeft /> Back to Job Postings
      </button>

      {/* Main Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>{job.title}</h1>
          <Tag variant={getJobStatusVariant(job.status)}>{job.status}</Tag>
        </div>

        {/* Metadata Grid */}
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <FiMapPin className={styles.metaIcon} />
            <div>
              <span className={styles.metaLabel}>Location:</span> {job.location || 'Remote'}
            </div>
          </div>
          <div className={styles.metaItem}>
            <FiBriefcase className={styles.metaIcon} />
            <div>
              <span className={styles.metaLabel}>Type:</span> {formatEmploymentType(job.employment_type)}
            </div>
          </div>
          <div className={styles.metaItem}>
            <FiDollarSign className={styles.metaIcon} />
            <div>
              <span className={styles.metaLabel}>Salary:</span> {salaryDisplay}
            </div>
          </div>
          <div className={styles.metaItem}>
            <FiCalendar className={styles.metaIcon} />
            <div>
              <span className={styles.metaLabel}>Posted:</span> {formatDate(job.created_at)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsBar}>
          <Button 
            variant="primary" 
            onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
          >
            <FiEdit2 style={{ marginRight: '6px' }} /> Edit Job
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}
          >
            <FiUsers style={{ marginRight: '6px' }} /> View Applicants
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/employer/shortlist')}
          >
            <FiCpu style={{ marginRight: '6px' }} /> AI Shortlist / Copilot
          </Button>
        </div>
      </div>

      {/* Job Description Card */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Full Job Description</h2>
        <div className={styles.descriptionContent}>
          {job.description || 'No detailed description provided.'}
        </div>
      </div>

      {/* Company Overview Card */}
      {job.employer && (
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Company Information</h2>
          <div className={styles.companyCard}>
            <h3 className={styles.companyName}>{job.employer.company_name}</h3>
            {job.employer.website && (
              <a 
                href={job.employer.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.companyWebsite}
              >
                {job.employer.website}
              </a>
            )}
            {job.employer.description && (
              <div className={styles.companyDescription}>
                {job.employer.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <Button 
          variant="ghost" 
          onClick={() => navigate('/employer/jobs')}
        >
          <FiArrowLeft style={{ marginRight: '6px' }} /> Back to Jobs
        </Button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button 
            variant="primary" 
            onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
          >
            <FiEdit2 style={{ marginRight: '6px' }} /> Edit Job
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}
          >
            <FiUsers style={{ marginRight: '6px' }} /> View Applicants
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobDetail;
