import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Avatar, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useEmployerJobs } from '@/hooks/queries/useJobQueries';
import { useEmployerApplications } from '@/hooks/queries/useApplicationQueries';
import { formatRelativeTime } from '@/utils/date';
import { formatStatus, getJobStatusVariant, getApplicationStatusVariant } from '@/utils/format';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: jobs, isLoading: isLoadingJobs } = useEmployerJobs();
  const { data: applications, isLoading: isLoadingApplications } = useEmployerApplications();

  if (isLoadingJobs || isLoadingApplications) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate stats
  const activeJobs = jobs?.filter(job => job.status === 'OPEN').length || 0;
  const totalApplicants = applications?.length || 0;
  const underReview = applications?.filter(app => app.status === 'UNDER_REVIEW').length || 0;
  const shortlisted = applications?.filter(app => app.status === 'SHORTLISTED').length || 0;

  const recentJobs = jobs?.slice(0, 5) || [];
  const recentApplicants = applications?.slice(0, 5) || [];

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <section className={styles.header}>
        <h1 className={styles.headerTitle}>Welcome back, {user?.name?.split(' ')[0] || 'Employer'}</h1>
        <p className={styles.headerSubtitle}>Managing jobs for {user?.employer_profile?.company_name}</p>
        
        {user?.employer_profile?.verification_status === 'PENDING' && (
          <div className={styles.warningCard}>
            <p className={styles.warningText}>Your company account is currently pending verification. You can post jobs, but they won't be visible to candidates until verified.</p>
          </div>
        )}
      </section>

      {/* STATS ROW */}
      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{activeJobs}</p>
          <p className={styles.statLabel}>Active Jobs</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{totalApplicants}</p>
          <p className={styles.statLabel}>Total Applicants</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{underReview}</p>
          <p className={styles.statLabel}>Under Review</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{shortlisted}</p>
          <p className={styles.statLabel}>Shortlisted</p>
        </div>
      </section>

      {/* RECENT JOBS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Job Postings</h2>
          <Button 
            variant="primary" 
            onClick={() => navigate('/employer/jobs/new')}
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Post a Job
          </Button>
        </div>
        
        <div className={styles.jobsList}>
          {recentJobs.length > 0 ? (
            recentJobs.map(job => (
              <div key={job.id} className={styles.jobCardRow}>
                <div className={styles.jobInfo}>
                  <h3 className={styles.jobTitle}>{job.title}</h3>
                  <div className={styles.jobMeta}>
                    <Tag variant={getJobStatusVariant(job.status)}>{formatStatus(job.status)}</Tag>
                    <span className={styles.jobDate}>Posted {formatRelativeTime(job.created_at)}</span>
                  </div>
                </div>
                <div className={styles.jobActions}>
                  <Link to={`/employer/jobs/${job.id}/applicants`} className={styles.actionLink}>View Applicants</Link>
                  <Link to={`/employer/jobs/${job.id}/edit`} className={styles.actionLink}>Edit</Link>
                </div>
              </div>
            ))
          ) : (
            <EmptyState 
              title="No jobs posted yet" 
              description="Create your first job posting to start attracting candidates." 
            />
          )}
        </div>
      </section>

      {/* RECENT APPLICANTS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest Applicants</h2>
        </div>
        
        <div className={styles.applicantsList}>
          {recentApplicants.length > 0 ? (
            recentApplicants.map(app => (
              <div key={app.id} className={styles.applicantCard}>
                <div className={styles.applicantInfo}>
                  <Avatar name={app.seeker?.user_name || app.seeker?.user_email || 'Applicant'} size={40} />
                  <div className={styles.applicantDetails}>
                    <h3 className={styles.applicantName}>{app.seeker?.user_name || app.seeker?.user_email || 'Applicant'}</h3>
                    <p className={styles.applicantJob}>Applied for: {app.job?.title || 'Unknown Job'}</p>
                  </div>
                </div>
                <div className={styles.applicantMeta}>
                  <Tag variant={getApplicationStatusVariant(app.status)}>{formatStatus(app.status)}</Tag>
                  <span className={styles.applicantTime}>{formatRelativeTime(app.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState 
              title="No applicants yet" 
              description="Applications will appear here once candidates start applying." 
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
