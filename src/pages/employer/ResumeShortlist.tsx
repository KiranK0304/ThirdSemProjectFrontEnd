import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiCpu, FiDownload, FiUsers, FiExternalLink, 
  FiCheckCircle, FiXCircle, FiAward, FiMessageSquare,
  FiFilter
} from 'react-icons/fi';
import { Button, LoadingSpinner, EmptyState } from '@/components/ui';
import { useEmployerJobs } from '@/hooks/queries/useJobQueries';
import { 
  useEmployerJobApplicants, 
  useUpdateApplicationStatus 
} from '@/hooks/queries/useApplicationQueries';
import { exportApplicationsToCsv } from '@/utils/exportCsv';
import { getMediaUrl } from '@/utils/format';
import CopilotDrawer from '@/components/screening/CopilotDrawer';
import { Application } from '@/api/types';
import styles from './ResumeShortlist.module.css';

export const ResumeShortlist: React.FC = () => {
  const { data: jobs, isLoading: isLoadingJobs } = useEmployerJobs();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STRONG_FIT' | 'SHORTLISTED'>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

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

  // Handle status update
  const handleUpdateStatus = async (applicationId: number, newStatus: 'SHORTLISTED' | 'REJECTED', candidateName?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: applicationId,
        status: newStatus,
      });
      setActionSuccessMessage(
        candidateName
          ? `${candidateName} status updated to ${newStatus === 'SHORTLISTED' ? 'Shortlisted' : 'Rejected'}.`
          : `Applicant #${applicationId} updated.`
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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}><FiCpu /></span>
            AI Candidate Shortlisting
          </h1>
          <p className={styles.subtitle}>
            Screen and shortlist candidates objectively using automated AI resume analysis.
          </p>
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}><FiCpu /></span>
              AI Candidate Shortlisting & Copilot
            </h1>
            <p className={styles.subtitle}>
              Automated AI resume evaluation, candidate leaderboard, and conversational recruiter copilot.
            </p>
          </div>

          <button
            type="button"
            className={`${styles.copilotToggleBtn} ${isCopilotOpen ? styles.copilotToggleBtnActive : ''}`}
            onClick={() => setIsCopilotOpen((prev) => !prev)}
            title="Open AI Recruiter Copilot"
          >
            <FiCpu className={styles.copilotIcon} />
            <span>AI Recruiter Copilot</span>
            <span className={styles.copilotPulseDot} />
            {applicants && applicants.length > 0 && (
              <span className={styles.copilotBadge}>{applicants.length} candidates</span>
            )}
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
          fontWeight: 500
        }}>
          <FiCheckCircle /> {actionSuccessMessage}
        </div>
      )}

      {/* Controls Card */}
      <div className={styles.controlCard}>
        <div className={styles.selectorRow}>
          <div className={styles.jobSelectWrapper}>
            <label className={styles.jobSelectLabel} htmlFor="job-select">
              Select Job Posting
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

          <div className={styles.jobStats}>
            <div className={styles.statBadge}>
              <FiUsers />
              <span>Total Applicants:</span>
              <span className={styles.statValue}>{applicants?.length ?? 0}</span>
            </div>
            <div className={styles.statBadge}>
              <FiAward />
              <span>Strong AI Fit:</span>
              <span className={styles.statValue}>{strongFitCount}</span>
            </div>
            <div className={styles.statBadge}>
              <FiCheckCircle />
              <span>Shortlisted:</span>
              <span className={styles.statValue}>{shortlistedIds.size}</span>
            </div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-border, #e5e7eb)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`${styles.presetChip} ${activeFilter === 'ALL' ? styles.presetChipActive : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All Applicants ({applicants?.length ?? 0})
            </button>
            <button
              type="button"
              className={`${styles.presetChip} ${activeFilter === 'STRONG_FIT' ? styles.presetChipActive : ''}`}
              onClick={() => setActiveFilter('STRONG_FIT')}
            >
              🌟 Strong Fit ({strongFitCount})
            </button>
            <button
              type="button"
              className={`${styles.presetChip} ${activeFilter === 'SHORTLISTED' ? styles.presetChipActive : ''}`}
              onClick={() => setActiveFilter('SHORTLISTED')}
            >
              ✅ Shortlisted ({shortlistedIds.size})
            </button>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={handleExportCsv}
              disabled={!applicants || applicants.length === 0}
            >
              <FiDownload /> Export to CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section / Table */}
      <div className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div className={styles.resultsTitleArea}>
            <h2 className={styles.resultsHeading}>Candidate Leaderboard</h2>
            <span className={styles.resultsCount}>
              {filteredApplicants.length} showing
            </span>
          </div>
        </div>

        {isLoadingApplicants ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <LoadingSpinner size="md" />
            <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>
              Loading candidate applications...
            </p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div style={{ padding: '32px' }}>
            <EmptyState
              title={activeFilter === 'ALL' ? "No applicants yet" : "No matching candidates"}
              description={activeFilter === 'ALL' ? "Candidates who apply will be analyzed and scored automatically." : "Try switching to the 'All Applicants' filter."}
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
                  if (rec.includes('STRONG') || (score ?? 0) >= 75) badgeClass = styles.badgeStrong;
                  else if (rec.includes('MODERATE') || (score ?? 0) >= 50) badgeClass = styles.badgeModerate;

                  return (
                    <tr key={app.id}>
                      {/* Candidate Column */}
                      <td>
                        <div className={styles.candidateCol}>
                          <span className={styles.rankNum}>#{index + 1}</span>
                          <div>
                            <div className={styles.candidateName}>{name}</div>
                            <div className={styles.candidateEmail}>
                              {email}
                              {analysis?.total_years_experience != null && (
                                <span style={{ marginLeft: '6px', color: 'var(--color-text-muted)' }}>
                                  • {analysis.total_years_experience} yrs exp
                                </span>
                              )}
                            </div>
                            {app.resume && (
                              <a
                                href={getMediaUrl(app.resume.file_url || app.resume.file)}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.resumeLink}
                              >
                                <FiExternalLink /> View Resume PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* AI Fit Score Column */}
                      <td>
                        {score != null ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {score.toFixed(1)}%
                              </span>
                              <span className={`${styles.cardFitBadge} ${badgeClass}`}>
                                {analysis?.recommendation || 'Analyzed'}
                              </span>
                            </div>
                            <div style={{
                              width: '100px',
                              height: '5px',
                              backgroundColor: 'var(--color-surface-muted, #e5e7eb)',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(100, Math.max(0, score))}%`,
                                height: '100%',
                                backgroundColor: score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#9ca3af',
                                borderRadius: '3px'
                              }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            {analysis?.status === 'PROCESSING' ? 'Analyzing...' : 'Ready'}
                          </span>
                        )}
                      </td>

                      {/* Skills Column */}
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                          {(analysis?.skills || []).slice(0, 5).map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-surface-muted, #f3f4f6)',
                                border: '1px solid var(--color-border, #e5e7eb)',
                                color: 'var(--color-text-primary, #374151)'
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {(!analysis?.skills || analysis.skills.length === 0) && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td>
                        <span className={`${styles.statusBadge} ${
                          isShortlisted ? styles.statusShortlisted : isRejected ? styles.statusRejected : styles.statusPending
                        }`}>
                          {app.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            className={styles.rowCopilotBtn}
                            onClick={() => setIsCopilotOpen(true)}
                            title="Chat with AI Copilot about this candidate"
                          >
                            <FiMessageSquare /> Copilot
                          </button>

                          {!isShortlisted && (
                            <button
                              type="button"
                              className={styles.actionBtnShortlist}
                              onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED', name)}
                              disabled={updateStatusMutation.isPending}
                              title="Shortlist Candidate"
                            >
                              <FiCheckCircle /> Shortlist
                            </button>
                          )}

                          {!isRejected && (
                            <button
                              type="button"
                              className={styles.actionBtnReject}
                              onClick={() => handleUpdateStatus(app.id, 'REJECTED', name)}
                              disabled={updateStatusMutation.isPending}
                              title="Reject Candidate"
                            >
                              <FiXCircle />
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
      </div>

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
              onShortlistCandidate={(appId, name) => handleUpdateStatus(appId, 'SHORTLISTED', name)}
              shortlistedIds={shortlistedIds}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeShortlist;
