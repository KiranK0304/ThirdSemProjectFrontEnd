import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Tag, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useEmployerJobs } from '@/hooks/queries/useJobQueries';
import { formatDate } from '@/utils/date';
import { formatEmploymentType, getJobStatusVariant } from '@/utils/format';
import styles from './Jobs.module.css';

export const Jobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: jobs, isLoading, error, refetch } = useEmployerJobs();

  const isPending = user?.employer_profile?.verification_status === 'PENDING';

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return <ErrorState message="Failed to load jobs." onRetry={refetch} />;
  }

  return (
    <div className={styles.container}>
      {isPending && (
        <div className={styles.pendingNotice}>
          Your employer account is pending verification. You'll be able to post jobs once an admin approves your profile.
        </div>
      )}
      <div className={styles.header}>
        <h1 className={styles.title}>My Job Postings</h1>
        <Button 
          variant="primary" 
          onClick={() => navigate('/employer/jobs/new')}
          disabled={isPending}
        >
          Post a Job
        </Button>
      </div>

      {!jobs || jobs.length === 0 ? (
        <EmptyState 
          title="No job postings yet" 
          description="Create your first job posting to start finding candidates."
          action={
            <Button variant="primary" onClick={() => navigate('/employer/jobs/new')} disabled={isPending}>
              Post a Job
            </Button>
          }
        />
      ) : (
        <div className={styles.jobsGrid}>
          {jobs.map((job: any) => (
            <Card key={job.id} className={styles.jobCard}>
              <div className={styles.jobHeader}>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <Tag variant={getJobStatusVariant(job.status)}>{job.status}</Tag>
              </div>
              <div className={styles.jobDetails}>
                <div>{job.location} • {formatEmploymentType(job.employment_type)}</div>
                <div style={{ marginTop: '4px' }}>Posted: {formatDate(job.created_at)}</div>
              </div>
              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}>
                  Edit
                </Button>
                <Button variant="secondary" onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}>
                  View Applicants
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
