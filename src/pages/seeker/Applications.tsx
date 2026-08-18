import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, EmptyState, ErrorState, LoadingSpinner, Button } from '@/components/ui';
import { useSeekerApplications } from '@/hooks/queries/useApplicationQueries';
import { formatRelativeTime } from '@/utils/date';
import { formatStatus, getApplicationStatusVariant } from '@/utils/format';
import styles from './Applications.module.css';

export default function Applications() {
  const navigate = useNavigate();
  const { data: applications, isLoading, isError, refetch } = useSeekerApplications();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError) {
    return <ErrorState message="Failed to load applications." onRetry={refetch} />;
  }

  if (!applications || applications.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>My Applications</h1>
        </header>
        <EmptyState 
          title="No applications yet" 
          description="Start by browsing open positions"
          action={<Button variant="secondary" onClick={() => navigate('/jobs')}>Browse Jobs</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Applications</h1>
      </header>

      <div className={styles.list}>
        {applications.map((app: any) => (
          <Card 
            key={app.id} 
            clickable 
            onClick={() => navigate(`/seeker/applications/${app.id}`)}
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.jobTitle}>{app.job.title}</h3>
                <div className={styles.companyName}>{app.job.employer.company_name}</div>
              </div>
              <Tag variant={getApplicationStatusVariant(app.status)}>
                {formatStatus(app.status)}
              </Tag>
            </div>
            <div className={styles.meta}>
              <span className={styles.date}>Applied {formatRelativeTime(app.created_at)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
