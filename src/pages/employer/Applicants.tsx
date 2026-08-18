import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Tag, Avatar, Select, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui';
import { useEmployerJob } from '@/hooks/queries/useJobQueries';
import { useEmployerJobApplicants, useUpdateApplicationStatus } from '@/hooks/queries/useApplicationQueries';
import { getApplicationStatusVariant } from '@/utils/format';
import styles from './Applicants.module.css';

const STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REJECTED', label: 'Rejected' }
];

export const Applicants: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);
  const { data: job, isLoading: isLoadingJob } = useEmployerJob(jobId);
  const { data: applicants, isLoading: isLoadingApplicants, error, refetch } = useEmployerJobApplicants(jobId);
  const updateStatus = useUpdateApplicationStatus();

  const [expandedCoverLetters, setExpandedCoverLetters] = useState<Record<number, boolean>>({});

  if (isLoadingJob || isLoadingApplicants) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return <ErrorState message="Failed to load applicants." onRetry={refetch} />;
  }

  const toggleCoverLetter = (id: number) => {
    setExpandedCoverLetters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: applicationId, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/employer/jobs" className={styles.backLink}>← Back to Jobs</Link>
      <h1 className={styles.title}>Applicants for {job?.title || 'Job'}</h1>

      {!applicants || applicants.length === 0 ? (
        <EmptyState title="No applicants yet" description="This job posting hasn't received any applications." />
      ) : (
        <div className={styles.applicantsGrid}>
          {applicants.map((app) => {
            const isExpanded = expandedCoverLetters[app.id];
            const coverLetter = app.cover_letter || '';
            const isTruncated = coverLetter.length > 150;
            const displayCoverLetter = isExpanded || !isTruncated 
              ? coverLetter 
              : coverLetter.substring(0, 150) + '...';

            const applicantName = app.seeker?.user_name || app.seeker?.user_email || 'Applicant';
            const applicantEmail = app.seeker?.user_email || '';

            return (
              <Card key={app.id} className={styles.applicantCard}>
                <div className={styles.cardHeader}>
                  <Avatar name={applicantName} round />
                  <div className={styles.applicantInfo}>
                    <h3 className={styles.applicantName}>{applicantName}</h3>
                    <div className={styles.applicantEmail}>{applicantEmail}</div>
                  </div>
                  <Tag variant={getApplicationStatusVariant(app.status)}>{app.status}</Tag>
                </div>

                {coverLetter && (
                  <div className={styles.coverLetter}>
                    {displayCoverLetter}
                    {isTruncated && (
                      <button className={styles.readMoreBtn} onClick={() => toggleCoverLetter(app.id)}>
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}

                {app.resume && (
                  <div className={styles.resumeSection}>
                    Resume: <a href={app.resume.file_url} target="_blank" rel="noopener noreferrer" className={styles.resumeLink}>{app.resume.title || 'Download Resume'}</a>
                  </div>
                )}

                <div className={styles.statusUpdate}>
                  <Select 
                    label="Update Status"
                    options={STATUS_OPTIONS}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    disabled={updateStatus.isPending && updateStatus.variables?.id === app.id}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applicants;

