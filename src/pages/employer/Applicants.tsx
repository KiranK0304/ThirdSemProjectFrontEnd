import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, Avatar, Modal, Button, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui';
import { useEmployerJob } from '@/hooks/queries/useJobQueries';
import { useEmployerJobApplicants, useUpdateApplicationStatus } from '@/hooks/queries/useApplicationQueries';
import { formatDate } from '@/utils/date';
import { getApplicationStatusVariant, getMediaUrl } from '@/utils/format';
import { Application } from '@/api/types';
import { FiArrowLeft, FiFileText, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import styles from './Applicants.module.css';

const STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const Applicants: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);

  const { data: job, isLoading: isLoadingJob } = useEmployerJob(jobId);
  const { data: applicants, isLoading: isLoadingApplicants, error, refetch } = useEmployerJobApplicants(jobId);
  const updateStatus = useUpdateApplicationStatus();

  const [activeLetterApp, setActiveLetterApp] = useState<Application | null>(null);

  if (isLoadingJob || isLoadingApplicants) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load applicants for this job." onRetry={refetch} />;
  }

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: applicationId, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/employer/jobs" className={styles.backLink}>
        <FiArrowLeft /> Back to Job Postings
      </Link>

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Applicants for {job?.title || 'Job'}</h1>
          <p className={styles.subtitle}>
            Review applications, view candidate resumes, and update hiring pipeline statuses
          </p>
        </div>
      </div>

      {!applicants || applicants.length === 0 ? (
        <EmptyState
          title="No applicants yet"
          description="This job posting hasn't received any applications yet. Make sure your job details and requirements are up to date."
        />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applied Date</th>
                  <th>Resume</th>
                  <th>Cover Letter</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'right' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((app) => {
                  const applicantName = app.seeker?.user_name || app.seeker?.user_email || 'Applicant';
                  const applicantEmail = app.seeker?.user_email || '';
                  const hasResume = !!app.resume?.file_url;
                  const hasCoverLetter = !!app.cover_letter && app.cover_letter.trim().length > 0;
                  const isUpdating = updateStatus.isPending && updateStatus.variables?.id === app.id;

                  return (
                    <tr key={app.id}>
                      <td>
                        <div className={styles.candidateCell}>
                          <Avatar name={applicantName} size={36} round />
                          <div className={styles.candidateInfo}>
                            <span className={styles.candidateName}>{applicantName}</span>
                            <span className={styles.candidateEmail}>{applicantEmail}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.dateText}>{formatDate(app.created_at)}</span>
                      </td>

                      <td>
                        {hasResume ? (
                          <a
                            href={getMediaUrl(app.resume!.file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.resumeBtn}
                            title="Open candidate resume in new tab"
                          >
                            <FiFileText size={13} />
                            <span>{app.resume!.title || 'Resume'}</span>
                            <FiExternalLink size={11} style={{ opacity: 0.7 }} />
                          </a>
                        ) : (
                          <span className={styles.noResumeText}>None attached</span>
                        )}
                      </td>

                      <td>
                        {hasCoverLetter ? (
                          <button
                            type="button"
                            className={styles.letterBtn}
                            onClick={() => setActiveLetterApp(app)}
                            title="Read candidate's full cover letter"
                          >
                            <FiMessageSquare size={13} />
                            <span>Read Letter</span>
                          </button>
                        ) : (
                          <span className={styles.noLetterText}>None provided</span>
                        )}
                      </td>

                      <td>
                        <Tag variant={getApplicationStatusVariant(app.status)}>{app.status}</Tag>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <select
                          className={styles.statusSelect}
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          disabled={isUpdating}
                          aria-label={`Update status for ${applicantName}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>
            Showing {applicants.length} {applicants.length === 1 ? 'applicant' : 'total applicants'}
          </div>
        </div>
      )}

      {/* Cover Letter Modal Dialog */}
      <Modal
        open={!!activeLetterApp}
        onClose={() => setActiveLetterApp(null)}
        title="Candidate Cover Letter"
        maxWidth="600px"
        actions={
          <Button variant="secondary" onClick={() => setActiveLetterApp(null)}>
            Close
          </Button>
        }
      >
        {activeLetterApp && (
          <div>
            <div className={styles.applicantMetaHeader}>
              <Avatar
                name={activeLetterApp.seeker?.user_name || activeLetterApp.seeker?.user_email || 'Applicant'}
                size={34}
                round
              />
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {activeLetterApp.seeker?.user_name || 'Applicant'}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {activeLetterApp.seeker?.user_email} • Applied {formatDate(activeLetterApp.created_at)}
                </span>
              </div>
            </div>
            <div className={styles.coverLetterModal}>
              {activeLetterApp.cover_letter}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Applicants;
