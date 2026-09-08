import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiDownload, FiExternalLink, 
  FiCheckCircle, FiXCircle, FiCheck
} from 'react-icons/fi';
import { Tag, Avatar, LoadingSpinner, EmptyState, ConfirmModal } from '@/components/ui';
import { useEmployerJobs } from '@/hooks/queries/useJobQueries';
import { 
  useEmployerJobApplicants, 
  useUpdateApplicationStatus 
} from '@/hooks/queries/useApplicationQueries';
import { exportApplicationsToCsv } from '@/utils/exportCsv';
import { getMediaUrl, getApplicationStatusVariant } from '@/utils/format';
import CopilotDrawer from '@/components/screening/CopilotDrawer';
import { Application } from '@/api/types';
import styles from './ResumeShortlist.module.css';

export const ResumeShortlist: React.FC = () => {
  const { data: jobs, isLoading: isLoadingJobs } = useEmployerJobs();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STRONG_FIT' | 'SHORTLISTED'>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Confirmation modal state for Shortlist / Reject
  const [confirmModalState, setConfirmModalState] = useState<{
    open: boolean;
    type: 'SHORTLIST' | 'REJECT';
    applicationId: number | null;
    candidateName: string;
  }>({
    open: false,
    type: 'SHORTLIST',
    applicationId: null,
    candidateName: '',
  });

  // Auto-select first job if available
  useEffect(() => {
    if (jobs && jobs.length > 0 && selectedJobId === null) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const currentJob = jobs?.find((j) => j.id === selectedJobId);

  // Fetch applicants for the selected job
  const { 
    data: applicants, 
    isLoading: isLoadingApplicants, 
    refetch: refetchApplicants 
  } = useEmployerJobApplicants(selectedJobId ?? 0);

  const updateStatusMutation = useUpdateApplicationStatus();

  // Shortlisted application IDs set
  const shortlistedIds = useMemo(() => {
    const set = new Set<number>();
    if (applicants) {
      for (const app of applicants) {
        if (app.status === 'SHORTLISTED') {
          set.add(app.id);
        }
      }
    }
    return set;
  }, [applicants]);

  // Prompt confirmation for status updates
  const handlePromptAction = (
    applicationId: number, 
    type: 'SHORTLIST' | 'REJECT', 
    candidateName?: string
  ) => {
    setConfirmModalState({
      open: true,
      type,
      applicationId,
      candidateName: candidateName || `Applicant #${applicationId}`,
    });
  };

  // Execute status update after confirmation
  const handleConfirmAction = async () => {
    if (!confirmModalState.applicationId) return;

    const { applicationId, type, candidateName } = confirmModalState;
    const newStatus = type === 'SHORTLIST' ? 'SHORTLISTED' : 'REJECTED';

    try {
      await updateStatusMutation.mutateAsync({
        id: applicationId,
        status: newStatus,
      });
      setConfirmModalState((prev) => ({ ...prev, open: false }));
      setActionSuccessMessage(
        candidateName
          ? `${candidateName} has been ${newStatus === 'SHORTLISTED' ? 'shortlisted' : 'marked as rejected'}.`
          : `Applicant status updated.`
      );
      setTimeout(() => setActionSuccessMessage(null), 3000);
      refetchApplicants();
    } catch (err) {
      console.error('Failed to update candidate status:', err);
    }
  };

  const handleExportCsv = () => {
    if (!applicants || !currentJob) return;
    exportApplicationsToCsv(currentJob.title, applicants);
  };

  // Filter & sort applicants (Strongest AI fit first)
  const filteredApplicants = useMemo(() => {
    if (!applicants) return [];
    
    // Sort by overall_score descending (nulls last)
    const sorted = [...applicants].sort((a, b) => {
      const scoreA = a.analysis?.overall_score ?? -1;
      const scoreB = b.analysis?.overall_score ?? -1;
      return scoreB - scoreA;
    });

    if (activeFilter === 'STRONG_FIT') {
      return sorted.filter((app) => 
        (app.analysis?.recommendation || '').toUpperCase().includes('STRONG') || 
        (app.analysis?.overall_score ?? 0) >= 75
      );
    }
    if (activeFilter === 'SHORTLISTED') {
      return sorted.filter((app) => app.status === 'SHORTLISTED');
    }
    return sorted;
  }, [applicants, activeFilter]);

  const strongFitCount = useMemo(() => {
    if (!applicants) return 0;
    return applicants.filter((app) => 
      (app.analysis?.recommendation || '').toUpperCase().includes('STRONG') || 
      (app.analysis?.overall_score ?? 0) >= 75
    ).length;
  }, [applicants]);

  if (isLoadingJobs) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>AI Candidate Shortlisting</h1>
            <p className={styles.subtitle}>
              Screen and shortlist candidates objectively using automated AI resume analysis.
            </p>
          </div>
        </div>
        <EmptyState 
          title="No jobs posted yet" 
          description="You need to post a job before you can screen and shortlist candidates."
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header — clean title with NO icon */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>AI Candidate Shortlisting</h1>
            <p className={styles.subtitle}>
              Autonomous AI resume evaluation, candidate leaderboard, and conversational recruiter copilot.
            </p>
          </div>

          <button
            type="button"
            className={`${styles.copilotToggleBtn} ${isCopilotOpen ? styles.copilotToggleBtnActive : ''}`}
            onClick={() => setIsCopilotOpen((prev) => !prev)}
            title="Open AI Recruiter"
          >
            AI Recruiter
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div style={{
          backgroundColor: 'var(--color-success-subtle, #ecfdf5)',
          color: 'var(--color-success, #10b981)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm, 8px)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <FiCheckCircle /> {actionSuccessMessage}
        </div>
      )}

      {/* Unified Command Card */}
      <div className={styles.commandCard}>
        <div className={styles.commandRow}>
          <div className={styles.jobSelectWrapper}>
            <label className={styles.jobSelectLabel} htmlFor="job-select">
              Job Posting:
            </label>
            <select
              id="job-select"
              className={styles.jobSelect}
              value={selectedJobId ?? ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.status})
                </option>
              ))}
            </select>
          </div>

          {/* High-density KPI Metrics Strip */}
          <div className={styles.kpiStrip}>
            <div className={styles.kpiItem}>
              <span className={styles.kpiLabel}>Total Candidates</span>
              <span className={styles.kpiValue}>{applicants?.length ?? 0}</span>
            </div>
            <div className={styles.kpiItem}>
              <span className={styles.kpiLabel}>Strong AI Fit</span>
              <span className={`${styles.kpiValue} ${styles.kpiHighlight}`}>{strongFitCount}</span>
            </div>
            <div className={styles.kpiItem}>
              <span className={styles.kpiLabel}>Shortlisted</span>
              <span className={styles.kpiValue}>{shortlistedIds.size}</span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Utilities */}
        <div className={styles.filterRow}>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${activeFilter === 'ALL' ? styles.segmentBtnActive : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All Candidates ({applicants?.length ?? 0})
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${activeFilter === 'STRONG_FIT' ? styles.segmentBtnActive : ''}`}
              onClick={() => setActiveFilter('STRONG_FIT')}
            >
              Strong Fit ({strongFitCount})
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${activeFilter === 'SHORTLISTED' ? styles.segmentBtnActive : ''}`}
              onClick={() => setActiveFilter('SHORTLISTED')}
            >
              Shortlisted ({shortlistedIds.size})
            </button>
          </div>

          <div>
            <button
              type="button"
              className={styles.exportBtn}
              onClick={handleExportCsv}
              disabled={!applicants || applicants.length === 0}
              title="Download CSV report of current candidate evaluations"
            >
              <FiDownload size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Results Section / Table */}
      <div className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsHeading}>Candidate Leaderboard</h2>
          <span className={styles.resultsCount}>
            Showing {filteredApplicants.length} of {applicants?.length ?? 0} candidates
          </span>
        </div>

        {isLoadingApplicants ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <LoadingSpinner size="md" />
            <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Evaluating candidate resumes...
            </p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div style={{ padding: '32px' }}>
            <EmptyState
              title={activeFilter === 'ALL' ? "No applicants yet" : "No matching candidates"}
              description={activeFilter === 'ALL' ? "Candidates who apply will be analyzed and scored automatically." : "Try switching to the 'All Candidates' filter."}
            />
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rank & Candidate</th>
                  <th>AI Fit Score</th>
                  <th>Key Skills</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((app: Application, index: number) => {
                  const name = app.seeker?.user_name || app.seeker?.user_email || `Applicant #${app.id}`;
                  const email = app.seeker?.user_email || '';
                  const analysis = app.analysis;
                  const score = analysis?.overall_score != null ? analysis.overall_score : null;
                  const rec = (analysis?.recommendation || '').toUpperCase();
                  const isShortlisted = app.status === 'SHORTLISTED';
                  const isRejected = app.status === 'REJECTED';

                  let badgeClass = styles.badgeWeak;
                  let meterClass = styles.meterWeak;
                  let recommendationLabel = 'Review Needed';

                  if (rec.includes('STRONG') || (score ?? 0) >= 75) {
                    badgeClass = styles.badgeStrong;
                    meterClass = styles.meterStrong;
                    recommendationLabel = 'Strong Fit';
                  } else if (rec.includes('MODERATE') || (score ?? 0) >= 50) {
                    badgeClass = styles.badgeModerate;
                    meterClass = styles.meterModerate;
                    recommendationLabel = 'Moderate Fit';
                  }

                  return (
                    <tr key={app.id}>
                      {/* Candidate Column */}
                      <td>
                        <div className={styles.candidateCol}>
                          <span className={`${styles.rankBadge} ${index === 0 ? styles.topRank1 : ''}`}>
                            #{index + 1}
                          </span>
                          <Avatar name={name} size={36} round />
                          <div className={styles.candidateDetails}>
                            <span className={styles.candidateName}>{name}</span>
                            <span className={styles.candidateMeta}>
                              {email}
                              {analysis?.total_years_experience != null && (
                                <span> • {analysis.total_years_experience} yrs exp</span>
                              )}
                            </span>
                            {app.resume && (
                              <a
                                href={getMediaUrl(app.resume.file_url || app.resume.file)}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.resumeLink}
                              >
                                <FiExternalLink size={11} /> View Resume PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* AI Fit Score Column */}
                      <td>
                        {score != null ? (
                          <div className={styles.scoreContainer}>
                            <div className={styles.scoreTopRow}>
                              <span className={styles.scoreNumber}>
                                {score.toFixed(1)}%
                              </span>
                              <span className={`${styles.fitBadge} ${badgeClass}`}>
                                {recommendationLabel}
                              </span>
                            </div>
                            <div className={styles.microMeter}>
                              <div 
                                className={`${styles.microMeterFill} ${meterClass}`} 
                                style={{ width: `${Math.min(100, Math.max(0, score))}%` }} 
                              />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            {analysis?.status === 'PROCESSING' ? 'Analyzing...' : 'Ready'}
                          </span>
                        )}
                      </td>

                      {/* Skills Column */}
                      <td>
                        <div className={styles.skillsContainer}>
                          {(analysis?.skills || []).slice(0, 5).map((skill: string, idx: number) => (
                            <span key={idx} className={styles.skillChip}>
                              {skill}
                            </span>
                          ))}
                          {(!analysis?.skills || analysis.skills.length === 0) && (
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td>
                        <Tag variant={getApplicationStatusVariant(app.status)}>
                          {app.status}
                        </Tag>
                      </td>

                      {/* Actions Column */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionsRow}>
                          {isShortlisted ? (
                            <span className={styles.shortlistedDoneBadge}>
                              <FiCheck size={12} /> Shortlisted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={styles.shortlistActionBtn}
                              onClick={() => handlePromptAction(app.id, 'SHORTLIST', name)}
                              disabled={updateStatusMutation.isPending}
                              title="Shortlist this candidate"
                            >
                              <FiCheckCircle size={13} />
                              <span>Shortlist</span>
                            </button>
                          )}

                          {!isRejected && (
                            <button
                              type="button"
                              className={styles.rejectActionBtn}
                              onClick={() => handlePromptAction(app.id, 'REJECT', name)}
                              disabled={updateStatusMutation.isPending}
                              title="Reject candidate application"
                            >
                              <FiXCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.tableFooter}>
          Ranked using dense semantic resume matching and automated requirement verification.
        </div>
      </div>

      {/* Confirmation Modal for Shortlist / Reject */}
      <ConfirmModal
        open={confirmModalState.open}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
        title={
          confirmModalState.type === 'SHORTLIST'
            ? 'Shortlist Candidate'
            : 'Reject Application'
        }
        description={
          confirmModalState.type === 'SHORTLIST' ? (
            <span>
              Are you sure you want to shortlist <strong>{confirmModalState.candidateName}</strong>?
              They will be moved to the shortlisted stage in your hiring pipeline.
            </span>
          ) : (
            <span>
              Are you sure you want to reject the application for{' '}
              <strong>{confirmModalState.candidateName}</strong>?
            </span>
          )
        }
        confirmText={
          confirmModalState.type === 'SHORTLIST' ? 'Shortlist Candidate' : 'Reject Candidate'
        }
        cancelText="Cancel"
        variant={confirmModalState.type === 'SHORTLIST' ? 'primary' : 'danger'}
        loading={updateStatusMutation.isPending}
      />

      {/* Slide-Over Drawer Overlay & Panel */}
      {isCopilotOpen && currentJob && (
        <div className={styles.drawerOverlay} onClick={() => setIsCopilotOpen(false)}>
          <div className={styles.drawerWrapper} onClick={(e) => e.stopPropagation()}>
            <CopilotDrawer
              jobId={currentJob.id}
              jobTitle={currentJob.title}
              totalCandidates={applicants?.length ?? 0}
              isOpen={isCopilotOpen}
              onClose={() => setIsCopilotOpen(false)}
              onShortlistCandidate={(appId, name) => handlePromptAction(appId, 'SHORTLIST', name)}
              shortlistedIds={shortlistedIds}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeShortlist;
