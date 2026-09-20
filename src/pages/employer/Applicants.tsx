import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, Avatar, Modal, ConfirmModal, Button, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui';
import { useEmployerJob } from '@/hooks/queries/useJobQueries';
import { useEmployerJobApplicants, useUpdateApplicationStatus, useCreateOrUpdateOffer } from '@/hooks/queries/useApplicationQueries';
import { formatDate } from '@/utils/date';
import { getApplicationStatusVariant, getMediaUrl } from '@/utils/format';
import { extractApiError } from '@/api/utils';
import { Application } from '@/api/types';
import {
  FiArrowLeft,
  FiFileText,
  FiMessageSquare,
  FiExternalLink,
  FiColumns,
  FiList,
  FiSearch,
  FiUser,
  FiBriefcase,
  FiBookOpen,
  FiCode,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiDollarSign,
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
  const createOrUpdateOffer = useCreateOrUpdateOffer();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchFilter, setSearchFilter] = useState('');
  const [draggedApp, setDraggedApp] = useState<Application | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const [activeLetterApp, setActiveLetterApp] = useState<Application | null>(null);
  const [activeProfileApp, setActiveProfileApp] = useState<Application | null>(null);
  const [activeOfferApp, setActiveOfferApp] = useState<Application | null>(null);

  // Offer form fields
  const [offerJobTitle, setOfferJobTitle] = useState('');
  const [offerBaseSalary, setOfferBaseSalary] = useState('');
  const [offerBonus, setOfferBonus] = useState('');
  const [offerEquity, setOfferEquity] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [offerExpirationDate, setOfferExpirationDate] = useState('');
  const [offerTerms, setOfferTerms] = useState('');
  const [offerSuccessMsg, setOfferSuccessMsg] = useState('');
  const [offerErrorMsg, setOfferErrorMsg] = useState('');

  const openOfferModal = (app: Application) => {
    setActiveOfferApp(app);
    setOfferSuccessMsg('');
    setOfferErrorMsg('');
    const o = app.offer;
    setOfferJobTitle(o?.job_title || job?.title || '');
    setOfferBaseSalary(o?.base_salary || '');
    setOfferBonus(o?.bonus || '');
    setOfferEquity(o?.equity || '');
    setOfferStartDate(o?.start_date || '');
    setOfferExpirationDate(o?.expiration_date || '');
    setOfferTerms(o?.additional_terms || '');
  };

  const handleSaveOffer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeOfferApp) return;
    if (!offerBaseSalary.trim()) {
      setOfferErrorMsg('Please specify the base salary or compensation rate.');
      return;
    }
    setOfferErrorMsg('');
    try {
      await createOrUpdateOffer.mutateAsync({
        applicationId: activeOfferApp.id,
        data: {
          job_title: offerJobTitle.trim() || undefined,
          base_salary: offerBaseSalary.trim(),
          bonus: offerBonus.trim() || undefined,
          equity: offerEquity.trim() || undefined,
          start_date: offerStartDate || undefined,
          expiration_date: offerExpirationDate || undefined,
          additional_terms: offerTerms.trim() || undefined,
        },
      });
      setOfferSuccessMsg('Official job offer extended successfully!');
      setTimeout(() => {
        setActiveOfferApp(null);
        setOfferSuccessMsg('');
      }, 1800);
    } catch (err) {
      setOfferErrorMsg(extractApiError(err));
    }
  };

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
                          <div
                            className={styles.cardHeader}
                            onClick={() => setActiveProfileApp(app)}
                            style={{ cursor: 'pointer' }}
                            title="Click to inspect candidate portfolio"
                          >
                            <Avatar name={applicantName} size={32} round />
                            <div className={styles.cardNameBlock}>
                              <span className={styles.cardName} title={applicantName}>
                                {applicantName}
                              </span>
                              {app.seeker?.headline && (
                                <span style={{ fontSize: '11px', color: 'var(--color-accent, #d97706)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '170px' }}>
                                  {app.seeker.headline}
                                </span>
                              )}
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
                              <button
                                type="button"
                                className={styles.cardIconBtn}
                                onClick={() => setActiveProfileApp(app)}
                                title="Inspect Candidate Portfolio"
                              >
                                <FiUser size={12} />
                                <span>Profile</span>
                              </button>
                              <button
                                type="button"
                                className={styles.cardIconBtn}
                                onClick={() => openOfferModal(app)}
                                title={app.offer ? `Offer Status: ${app.offer.status}` : 'Extend Job Offer'}
                                style={
                                  app.offer?.status === 'ACCEPTED'
                                    ? { color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }
                                    : app.offer?.status === 'DECLINED'
                                    ? { color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.4)' }
                                    : app.offer
                                    ? { color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.4)' }
                                    : undefined
                                }
                              >
                                <FiDollarSign size={12} />
                                <span>{app.offer ? app.offer.status : 'Offer'}</span>
                              </button>
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
                  <th>Job Offer</th>
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
                        <div
                          className={styles.candidateCell}
                          onClick={() => setActiveProfileApp(app)}
                          style={{ cursor: 'pointer' }}
                          title="Click to inspect candidate portfolio"
                        >
                          <Avatar name={applicantName} size={36} round />
                          <div className={styles.candidateInfo}>
                            <span className={styles.candidateName}>{applicantName}</span>
                            {app.seeker?.headline && (
                              <span style={{ fontSize: '11px', color: 'var(--color-accent, #d97706)', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.seeker.headline}
                              </span>
                            )}
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
                        <Button
                          variant={app.offer ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => openOfferModal(app)}
                          title={app.offer ? `Offer: ${app.offer.status}` : 'Extend Job Offer'}
                          style={{
                            gap: '5px',
                            fontSize: '11.5px',
                            padding: '4px 10px',
                            color:
                              app.offer?.status === 'ACCEPTED'
                                ? '#10b981'
                                : app.offer?.status === 'DECLINED'
                                ? '#f87171'
                                : app.offer
                                ? '#a78bfa'
                                : undefined,
                          }}
                        >
                          <FiDollarSign size={12} />
                          <span>{app.offer ? app.offer.status : 'Extend Offer'}</span>
                        </Button>
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

      {/* Candidate Career Portfolio Modal */}
      <Modal
        open={!!activeProfileApp}
        onClose={() => setActiveProfileApp(null)}
        title="Candidate Career Portfolio"
        maxWidth="720px"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', width: '100%' }}>
            {activeProfileApp?.resume?.file_url ? (
              <a
                href={getMediaUrl(activeProfileApp.resume.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="secondary" size="sm">
                  <FiFileText size={13} />
                  <span>Open Attached Resume</span>
                </Button>
              </a>
            ) : <span />}
            <Button variant="primary" size="sm" onClick={() => setActiveProfileApp(null)}>
              Close Portfolio
            </Button>
          </div>
        }
      >
        {activeProfileApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            {/* Candidate Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.08))' }}>
              <Avatar
                name={activeProfileApp.seeker?.user_name || activeProfileApp.seeker?.user_email || 'Applicant'}
                size={52}
                round
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 3px', fontSize: '18px', color: 'var(--color-text-primary)' }}>
                  {activeProfileApp.seeker?.user_name || 'Candidate'}
                </h3>
                {activeProfileApp.seeker?.headline && (
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-accent, #d97706)', fontWeight: 500 }}>
                    {activeProfileApp.seeker.headline}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <span>{activeProfileApp.seeker?.user_email}</span>
                  {activeProfileApp.seeker?.phone && <span>• {activeProfileApp.seeker.phone}</span>}
                  {activeProfileApp.seeker?.location && <span>• {activeProfileApp.seeker.location}</span>}
                  {activeProfileApp.seeker?.years_of_experience != null && <span>• {activeProfileApp.seeker.years_of_experience} yrs exp</span>}
                </div>
              </div>
              {activeProfileApp.analysis?.overall_score != null && (
                <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.12)', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent, #d97706)' }}>
                    {activeProfileApp.analysis.overall_score}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Match Fit</div>
                </div>
              )}
            </div>

            {/* Social Links */}
            {activeProfileApp.seeker?.social_links && Object.values(activeProfileApp.seeker.social_links).some(Boolean) && (
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '13px' }}>
                {activeProfileApp.seeker.social_links.github && (
                  <a href={activeProfileApp.seeker.social_links.github} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent, #d97706)' }}>
                    <FiGithub size={14} /> GitHub
                  </a>
                )}
                {activeProfileApp.seeker.social_links.linkedin && (
                  <a href={activeProfileApp.seeker.social_links.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent, #d97706)' }}>
                    <FiLinkedin size={14} /> LinkedIn
                  </a>
                )}
                {activeProfileApp.seeker.social_links.portfolio && (
                  <a href={activeProfileApp.seeker.social_links.portfolio} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent, #d97706)' }}>
                    <FiGlobe size={14} /> Portfolio
                  </a>
                )}
                {activeProfileApp.seeker.social_links.twitter && (
                  <a href={activeProfileApp.seeker.social_links.twitter} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent, #d97706)' }}>
                    <FiTwitter size={14} /> Twitter/X
                  </a>
                )}
              </div>
            )}

            {/* Bio */}
            {activeProfileApp.seeker?.bio && (
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Professional Summary
                </h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
                  {activeProfileApp.seeker.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {activeProfileApp.seeker?.skills && activeProfileApp.seeker.skills.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Core Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {activeProfileApp.seeker.skills.map((skill) => (
                    <span key={skill} style={{ fontSize: '12px', background: 'rgba(217, 119, 6, 0.12)', border: '1px solid rgba(217, 119, 6, 0.25)', color: 'var(--color-accent, #d97706)', padding: '3px 10px', borderRadius: '16px' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {activeProfileApp.seeker?.experience && activeProfileApp.seeker.experience.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Work Experience
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeProfileApp.seeker.experience.map((exp, i) => (
                    <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-muted, #1a1a1a)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{exp.role}</strong>
                          <span style={{ fontSize: '13px', color: 'var(--color-accent, #d97706)', display: 'block' }}>{exp.company}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                          {exp.start_date} – {exp.current ? 'Present' : exp.end_date || 'Present'}
                        </span>
                      </div>
                      {exp.description && (
                        <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {activeProfileApp.seeker?.education && activeProfileApp.seeker.education.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Education
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeProfileApp.seeker.education.map((edu, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--color-surface-muted, #1a1a1a)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '13.5px', color: 'var(--color-text-primary)' }}>{edu.degree}</strong>
                          <span style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'block' }}>{edu.institution} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                          {edu.start_year} – {edu.end_year || 'Present'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Projects */}
            {activeProfileApp.seeker?.projects && activeProfileApp.seeker.projects.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Featured Projects
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeProfileApp.seeker.projects.map((proj, i) => (
                    <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-muted, #1a1a1a)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13.5px', color: 'var(--color-text-primary)' }}>{proj.title}</strong>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {proj.live_url && (
                            <a href={proj.live_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11.5px', color: 'var(--color-accent, #d97706)' }}>Demo</a>
                          )}
                          {proj.github_url && (
                            <a href={proj.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11.5px', color: 'var(--color-accent, #d97706)' }}>Code</a>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Letter */}
            {activeProfileApp.cover_letter && (
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Cover Letter
                </h4>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-muted, #1a1a1a)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))', fontSize: '13px', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                  {activeProfileApp.cover_letter}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Extend / Edit Job Offer Modal */}
      <Modal
        open={!!activeOfferApp}
        onClose={() => setActiveOfferApp(null)}
        title={activeOfferApp?.offer ? 'Manage Official Job Offer' : 'Extend Official Job Offer'}
        maxWidth="640px"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setActiveOfferApp(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveOffer}
              loading={createOrUpdateOffer.isPending}
            >
              {activeOfferApp?.offer ? 'Update Offer Terms' : 'Extend Offer to Candidate'}
            </Button>
          </div>
        }
      >
        {activeOfferApp && (
          <form onSubmit={handleSaveOffer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeOfferApp.offer && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background:
                    activeOfferApp.offer.status === 'ACCEPTED'
                      ? 'rgba(5, 150, 105, 0.12)'
                      : activeOfferApp.offer.status === 'DECLINED'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(124, 58, 237, 0.12)',
                  border: `1px solid ${
                    activeOfferApp.offer.status === 'ACCEPTED'
                      ? 'rgba(5, 150, 105, 0.3)'
                      : activeOfferApp.offer.status === 'DECLINED'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'rgba(124, 58, 237, 0.3)'
                  }`,
                  color:
                    activeOfferApp.offer.status === 'ACCEPTED'
                      ? '#10b981'
                      : activeOfferApp.offer.status === 'DECLINED'
                      ? '#f87171'
                      : '#a78bfa',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiAward size={16} />
                <span>
                  Offer Status: <strong>{activeOfferApp.offer.status}</strong>
                  {activeOfferApp.offer.responded_at && ` (Responded on ${formatDate(activeOfferApp.offer.responded_at)})`}
                  {activeOfferApp.offer.decline_reason && ` — Note: "${activeOfferApp.offer.decline_reason}"`}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.08))' }}>
              <Avatar name={activeOfferApp.seeker?.user_name || 'Applicant'} size={38} round />
              <div>
                <strong style={{ fontSize: '14.5px', color: 'var(--color-text-primary)' }}>
                  {activeOfferApp.seeker?.user_name}
                </strong>
                <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                  {activeOfferApp.seeker?.user_email}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                  Position Title *
                </label>
                <input
                  type="text"
                  value={offerJobTitle}
                  onChange={(e) => setOfferJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                  Base Salary / Compensation *
                </label>
                <input
                  type="text"
                  value={offerBaseSalary}
                  onChange={(e) => setOfferBaseSalary(e.target.value)}
                  placeholder="e.g. $145,000 / year or $75 / hr"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                  Signing / Performance Bonus
                </label>
                <input
                  type="text"
                  value={offerBonus}
                  onChange={(e) => setOfferBonus(e.target.value)}
                  placeholder="e.g. $10,000 Sign-on bonus"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                  Equity / Stock Options
                </label>
                <input
                  type="text"
                  value={offerEquity}
                  onChange={(e) => setOfferEquity(e.target.value)}
                  placeholder="e.g. 0.25% ISO options / 4 yr vesting"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                  Anticipated Start Date
                </label>
                <input
                  type="date"
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                  Offer Expiration Date
                </label>
                <input
                  type="date"
                  value={offerExpirationDate}
                  onChange={(e) => setOfferExpirationDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                Benefits, Relocation & Special Terms
              </label>
              <textarea
                rows={3}
                value={offerTerms}
                onChange={(e) => setOfferTerms(e.target.value)}
                placeholder="e.g. Full medical & dental, 401(k) 4% match, $2,000 home office stipend, flexible PTO..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {offerSuccessMsg && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', fontSize: '13px' }}>
                {offerSuccessMsg}
              </div>
            )}
            {offerErrorMsg && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px' }}>
                {offerErrorMsg}
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Applicants;
