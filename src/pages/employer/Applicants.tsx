import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, Avatar, Modal, ConfirmModal, Button, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui';
import { useEmployerJob } from '@/hooks/queries/useJobQueries';
import { useEmployerJobApplicants, useUpdateApplicationStatus } from '@/hooks/queries/useApplicationQueries';
import { formatDate } from '@/utils/date';
import { getApplicationStatusVariant, getMediaUrl } from '@/utils/format';
import { Application } from '@/api/types';
import {
  FiArrowLeft,
  FiFileText,
  FiMessageSquare,
  FiExternalLink,
  FiColumns,
  FiList,
  FiSearch,
} from 'react-icons/fi';
import styles from './Applicants.module.css';

const STATUS_COLUMNS = [
  { id: 'SUBMITTED', label: 'Applied', color: '#6b7280', bg: '#f3f4f6' },
  { id: 'UNDER_REVIEW', label: 'Reviewing', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'SHORTLISTED', label: 'Shortlisted', color: '#3b82f6', bg: '#dbeafe' },
  { id: 'OFFERED', label: 'Offered', color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'REJECTED', label: 'Rejected', color: '#ef4444', bg: '#fee2e2' },
];

const STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Applied' },
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

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchFilter, setSearchFilter] = useState('');
  const [draggedApp, setDraggedApp] = useState<Application | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const [activeLetterApp, setActiveLetterApp] = useState<Application | null>(null);
  const [rejectModalState, setRejectModalState] = useState<{
    open: boolean;
    applicationId: number | null;
    candidateName: string;
  }>({
    open: false,
    applicationId: null,
    candidateName: '',
  });
  const [rejectionNote, setRejectionNote] = useState<string>('');

  // Filtered applicants by search
  const filteredApplicants = useMemo(() => {
    if (!applicants) return [];
    if (!searchFilter.trim()) return applicants;
    const q = searchFilter.toLowerCase();
    return applicants.filter((app) => {
      const name = (app.seeker?.user_name || '').toLowerCase();
      const email = (app.seeker?.user_email || '').toLowerCase();
      const resume = (app.resume?.title || '').toLowerCase();
      return name.includes(q) || email.includes(q) || resume.includes(q);
    });
  }, [applicants, searchFilter]);

  // Group applicants by status for Kanban columns
  const columnApplicants = useMemo(() => {
    const grouped: Record<string, Application[]> = {
      SUBMITTED: [],
      UNDER_REVIEW: [],
      SHORTLISTED: [],
      OFFERED: [],
      REJECTED: [],
    };
    filteredApplicants.forEach((app) => {
      if (grouped[app.status]) {
        grouped[app.status].push(app);
      } else {
        // Fallback or WITHDRAWN
        grouped.SUBMITTED.push(app);
      }
    });
    return grouped;
  }, [filteredApplicants]);

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

  const handleStatusChange = async (app: Application, newStatus: string) => {
    if (app.status === newStatus) return;

    if (newStatus === 'REJECTED') {
      const candidateName = app.seeker?.user_name || app.seeker?.user_email || `Applicant #${app.id}`;
      setRejectionNote('');
      setRejectModalState({
        open: true,
        applicationId: app.id,
        candidateName,
      });
      return;
    }

    try {
      await updateStatus.mutateAsync({ id: app.id, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectModalState.applicationId) return;
    try {
      await updateStatus.mutateAsync({
        id: rejectModalState.applicationId,
        status: 'REJECTED',
        rejection_note: rejectionNote.trim(),
      });
      setRejectModalState({ open: false, applicationId: null, candidateName: '' });
    } catch (err) {
      console.error('Failed to reject candidate', err);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, app: Application) => {
    setDraggedApp(app);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(app.id));
  };

  const handleDragOver = (e: React.DragEvent, statusColId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== statusColId) {
      setDragOverCol(statusColId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, statusColId: string) => {
    // Only reset if moving outside column element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverCol === statusColId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, statusColId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedApp) return;

    if (draggedApp.status !== statusColId) {
      handleStatusChange(draggedApp, statusColId);
    }
    setDraggedApp(null);
  };

  const handleDragEnd = () => {
    setDraggedApp(null);
    setDragOverCol(null);
  };

  return (
    <div className={styles.container}>
      <Link to="/employer/jobs" className={styles.backLink}>
        <FiArrowLeft /> Back to Job Postings
      </Link>

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Hiring Pipeline: {job?.title || 'Job'}</h1>
          <p className={styles.subtitle}>
            Drag and drop candidates across stages, review resumes, and manage applicant statuses.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search Filter & View Mode Toggle */}
      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search applicants by name or email..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.viewToggleGroup}>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'kanban' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Kanban Pipeline View"
          >
            <FiColumns size={14} />
            <span>Kanban Board</span>
          </button>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewMode('table')}
            title="Table List View"
          >
            <FiList size={14} />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {!applicants || applicants.length === 0 ? (
        <EmptyState
          title="No applicants yet"
          description="This job posting hasn't received any applications yet. Make sure your job details and requirements are up to date."
        />
      ) : viewMode === 'kanban' ? (
        /* ── KANBAN PIPELINE VIEW ── */
        <div className={styles.kanbanBoard}>
          {STATUS_COLUMNS.map((col) => {
            const colApps = columnApplicants[col.id] || [];
            const isTargetCol = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className={`${styles.kanbanColumn} ${isTargetCol ? styles.dragOverColumn : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitle}>
                    <span className={styles.columnDot} style={{ backgroundColor: col.color }} />
                    <span>{col.label}</span>
                  </div>
                  <span className={styles.columnBadge}>{colApps.length}</span>
                </div>

                <div className={styles.columnCards}>
                  {colApps.length === 0 ? (
                    <div className={styles.emptyColumnMsg}>
                      {isTargetCol ? 'Drop here to move' : 'No applicants'}
                    </div>
                  ) : (
                    colApps.map((app) => {
                      const applicantName = app.seeker?.user_name || app.seeker?.user_email || 'Applicant';
                      const applicantEmail = app.seeker?.user_email || '';
                      const hasResume = !!app.resume?.file_url;
                      const hasCoverLetter = !!app.cover_letter && app.cover_letter.trim().length > 0;
                      const isDraggingThis = draggedApp?.id === app.id;
                      const fitScore = app.analysis?.overall_score;

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app)}
                          onDragEnd={handleDragEnd}
                          className={`${styles.kanbanCard} ${isDraggingThis ? styles.kanbanCardDragging : ''}`}
                        >
                          <div className={styles.cardHeader}>
                            <Avatar name={applicantName} size={32} round />
                            <div className={styles.cardNameBlock}>
                              <span className={styles.cardName} title={applicantName}>
                                {applicantName}
                              </span>
                              <span className={styles.cardEmail} title={applicantEmail}>
                                {applicantEmail}
                              </span>
                            </div>
                          </div>

                          {fitScore != null && (
                            <div
                              className={styles.cardFitBadge}
                              style={{
                                backgroundColor: fitScore >= 80 ? '#d1fae5' : fitScore >= 60 ? '#fef3c7' : '#fee2e2',
                                color: fitScore >= 80 ? '#065f46' : fitScore >= 60 ? '#92400e' : '#991b1b',
                              }}
                            >
                              ★ {fitScore}% Match Fit
                            </div>
                          )}

                          <div className={styles.cardMetaRow}>
                            <span>{formatDate(app.created_at)}</span>
                            <div className={styles.cardBtnGroup}>
                              {hasResume && (
                                <a
                                  href={getMediaUrl(app.resume!.file_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.cardIconBtn}
                                  title="View Resume"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FiFileText size={12} />
                                  <span>Resume</span>
                                </a>
                              )}
                              {hasCoverLetter && (
                                <button
                                  type="button"
                                  className={styles.cardIconBtn}
                                  onClick={() => setActiveLetterApp(app)}
                                  title="Read Cover Letter"
                                >
                                  <FiMessageSquare size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick stage selector for touch / keyboard users */}
                          <select
                            className={styles.cardAdvanceSelect}
                            value={app.status}
                            onChange={(e) => handleStatusChange(app, e.target.value)}
                            aria-label={`Move ${applicantName} to stage`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                Move: {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
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
                {filteredApplicants.map((app) => {
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
                          onChange={(e) => handleStatusChange(app, e.target.value)}
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
            Showing {filteredApplicants.length} of {applicants.length} total applicants
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

      {/* Rejection with Note Confirmation Modal */}
      <ConfirmModal
        open={rejectModalState.open}
        onClose={() => setRejectModalState((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmRejection}
        title="Reject Application"
        description={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span>
              Are you sure you want to reject the application for{' '}
              <strong>{rejectModalState.candidateName}</strong>? A rejection email will be sent to the candidate.
            </span>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', opacity: 0.85 }}>
                Optional Rejection Note / Feedback:
              </label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Enter feedback or reason for rejection (will be included in the rejection email)..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #444)',
                  background: 'var(--bg-secondary, #1e1e1e)',
                  color: 'inherit',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        }
        confirmText="Reject & Send Email"
        cancelText="Cancel"
        variant="danger"
        loading={updateStatus.isPending}
      />
    </div>
  );
};

export default Applicants;
