import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Tag, EmptyState, ErrorState, LoadingSpinner, ConfirmModal } from '@/components/ui';
import { JobModal } from '@/components/jobs';
import { useAuth } from '@/context/AuthContext';
import { useEmployerJobs, useDeleteJob } from '@/hooks/queries/useJobQueries';
import { useEmployerApplications } from '@/hooks/queries/useApplicationQueries';
import { Job } from '@/api/types';
import { formatDate, formatSalary } from '@/utils/date';
import { formatEmploymentType, getJobStatusVariant } from '@/utils/format';
import { FiEye, FiEdit2, FiUsers, FiTrash2, FiPlus } from 'react-icons/fi';
import styles from './Jobs.module.css';

export const Jobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: jobs, isLoading, error, refetch } = useEmployerJobs();
  const { data: applications = [] } = useEmployerApplications();
  const deleteJob = useDeleteJob();

  // Modal states
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isPending = user?.employer_profile?.verification_status === 'PENDING';

  // Compute applicants count per job
  const applicantCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    applications.forEach((app) => {
      if (app.job?.id) {
        counts[app.job.id] = (counts[app.job.id] || 0) + 1;
      }
    });
    return counts;
  }, [applications]);

  // Handle URL query triggers (e.g. ?action=new or ?edit=123)
  useEffect(() => {
    const action = searchParams.get('action');
    const editId = searchParams.get('edit');

    if (action === 'new' && !isPending) {
      setEditingJob(null);
      setIsJobModalOpen(true);
      setSearchParams({}, { replace: true });
    } else if (editId && jobs && jobs.length > 0) {
      const targetJob = jobs.find((j) => j.id === Number(editId));
      if (targetJob) {
        setEditingJob(targetJob);
        setIsJobModalOpen(true);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, jobs, isPending, setSearchParams]);

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setIsJobModalOpen(true);
  };

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setIsJobModalOpen(true);
  };

  const handleCloseJobModal = () => {
    setIsJobModalOpen(false);
    setEditingJob(null);
  };

  const handlePromptDelete = (job: Job) => {
    setDeletingJob(job);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingJob) return;
    try {
      await deleteJob.mutateAsync(deletingJob.id);
      setIsDeleteModalOpen(false);
      setDeletingJob(null);
    } catch (err) {
      console.error('Failed to delete job', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load your job postings." onRetry={refetch} />;
  }

  return (
    <div className={styles.container}>
      {isPending && (
        <div className={styles.pendingNotice}>
          Your employer account is pending verification. You'll be able to publish active jobs once an admin approves your profile.
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>My Job Postings</h1>
          <p className={styles.subtitle}>
            Manage your job postings, view applicants, and track the status of your hiring pipeline.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          disabled={isPending}
        >
          <FiPlus style={{ marginRight: '6px' }} /> Post a Job
        </Button>
      </div>

      {!jobs || jobs.length === 0 ? (
        <EmptyState
          title="No job postings yet"
          description="Create your first job posting to start attracting top talent."
          action={
            <Button variant="primary" onClick={handleOpenCreateModal} disabled={isPending}>
              <FiPlus style={{ marginRight: '6px' }} /> Post a Job
            </Button>
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.jobTitleCol}>Job Title & Details</th>
                  <th>Status</th>
                  <th>Salary</th>
                  <th>Posted Date</th>
                  <th>Applicants</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: Job) => {
                  const applicantCount = applicantCounts[job.id] || 0;
                  const salaryDisplay =
                    job.salary_min || job.salary_max
                      ? formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')
                      : '—';

                  return (
                    <tr key={job.id}>
                      <td className={styles.jobTitleCol}>
                        <a
                          href={`/employer/jobs/${job.id}`}
                          className={styles.jobTitleLink}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/employer/jobs/${job.id}`);
                          }}
                        >
                          {job.title}
                        </a>
                        <div className={styles.jobMetaText}>
                          {job.location || 'Remote'} • {formatEmploymentType(job.employment_type)}
                        </div>
                      </td>

                      <td>
                        <Tag variant={getJobStatusVariant(job.status)}>{job.status}</Tag>
                      </td>

                      <td>
                        <span className={styles.salaryText}>{salaryDisplay}</span>
                      </td>

                      <td>
                        <span className={styles.dateText}>{formatDate(job.created_at)}</span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.applicantBadge}
                          onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}
                          title="View applicants for this job"
                        >
                          <FiUsers size={13} />
                          <span>{applicantCount} {applicantCount === 1 ? 'Applicant' : 'Applicants'}</span>
                        </button>
                      </td>

                      <td>
                        <div className={styles.actionsGroup} style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => navigate(`/employer/jobs/${job.id}`)}
                            title="View detailed job description"
                          >
                            <FiEye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenEditModal(job)}
                            title="Edit this job posting"
                          >
                            <FiEdit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}
                            title="View applicants"
                          >
                            <FiUsers size={13} />
                            <span>Applicants</span>
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtnDanger}
                            onClick={() => handlePromptDelete(job)}
                            title="Delete this job posting"
                          >
                            <FiTrash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>
            Showing {jobs.length} {jobs.length === 1 ? 'job posting' : 'job postings'}
          </div>
        </div>
      )}

      {/* Post / Edit Job Modal */}
      <JobModal
        open={isJobModalOpen}
        onClose={handleCloseJobModal}
        job={editingJob}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingJob(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Job Posting"
        description={
          deletingJob ? (
            <span>
              Are you sure you want to delete <strong>{deletingJob.title}</strong>? All associated
              applications will also be removed. This action cannot be undone.
            </span>
          ) : (
            'Are you sure you want to delete this job posting?'
          )
        }
        confirmText="Delete Job"
        cancelText="Cancel"
        variant="danger"
        loading={deleteJob.isPending}
      />
    </div>
  );
};

export default Jobs;
