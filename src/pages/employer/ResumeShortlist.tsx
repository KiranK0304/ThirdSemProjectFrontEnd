import React, { useState, useEffect } from 'react';
import { 
  FiCpu, FiDownload, FiSliders, FiUsers, FiExternalLink, 
  FiRefreshCw, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import { Button, Card, LoadingSpinner, EmptyState, Tag } from '@/components/ui';
import { useEmployerJobs } from '@/hooks/queries/useJobQueries';
import { useEmployerJobApplicants, useUpdateApplicationStatus } from '@/hooks/queries/useApplicationQueries';
import { 
  useJobCriteria, 
  useJobRanking, 
  useRunJobRanking 
} from '@/hooks/queries/useScreeningQueries';
import { exportShortlistToCsv } from '@/utils/exportCsv';
import { getMediaUrl } from '@/utils/format';
import CopilotDrawer from '@/components/screening/CopilotDrawer';
import styles from './ResumeShortlist.module.css';

const PRESETS = [
  {
    name: 'Balanced',
    weights: { experience: 40, skills: 30, projects: 20, education: 10 },
  },
  {
    name: 'Technical & Projects',
    weights: { experience: 10, skills: 40, projects: 40, education: 10 },
  },
  {
    name: 'Experience Heavy',
    weights: { experience: 50, skills: 30, projects: 10, education: 10 },
  },
];

export const ResumeShortlist: React.FC = () => {
  const { data: jobs, isLoading: isLoadingJobs } = useEmployerJobs();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Auto-select first job if available
  useEffect(() => {
    if (jobs && jobs.length > 0 && selectedJobId === null) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const currentJob = jobs?.find((j) => j.id === selectedJobId);

  // Criteria & Ranking Queries
  const { data: criteriaData } = useJobCriteria(selectedJobId ?? 0);
  const { 
    data: rankingData, 
    isLoading: isLoadingRanking, 
    refetch: refetchRanking 
  } = useJobRanking(selectedJobId ?? 0);
  const { data: applicants } = useEmployerJobApplicants(selectedJobId ?? 0);

  const runRankingMutation = useRunJobRanking();
  const updateStatusMutation = useUpdateApplicationStatus();

  // Criteria State (stored as integer percentages 0-100)
  const [weights, setWeights] = useState({
    experience: 40,
    skills: 30,
    projects: 20,
    education: 10,
  });

  const [activePreset, setActivePreset] = useState<string>('Balanced');
  const [expandedReasons, setExpandedReasons] = useState<Record<number, boolean>>({});
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [selectedCandidateAppId, setSelectedCandidateAppId] = useState<number | null>(null);

  // Sync criteria from backend when loaded
  useEffect(() => {
    if (criteriaData?.weights) {
      const backendWeights = criteriaData.weights;
      setWeights({
        experience: Math.round((backendWeights.experience ?? 0.4) * 100),
        skills: Math.round((backendWeights.skills ?? 0.3) * 100),
        projects: Math.round((backendWeights.projects ?? 0.2) * 100),
        education: Math.round((backendWeights.education ?? 0.1) * 100),
      });
    }
  }, [criteriaData]);

  // Map applicants for quick lookup (resume url, current status)
  const applicantsMap = React.useMemo(() => {
    const map = new Map<number, any>();
    if (applicants) {
      for (const app of applicants) {
        map.set(app.id, app);
      }
    }
    return map;
  }, [applicants]);

  // Set of shortlisted application IDs
  const shortlistedIds = React.useMemo(() => {
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

  const totalWeight = weights.experience + weights.skills + weights.projects + weights.education;

  const handleSliderChange = (criterion: keyof typeof weights, val: number) => {
    setActivePreset('Custom');
    setWeights((prev) => ({ ...prev, [criterion]: val }));
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.name);
    setWeights({ ...preset.weights });
  };

  const handleRunRanking = async () => {
    if (!selectedJobId) return;

    // Convert integer weights (e.g. 40) to decimals (0.4)
    const normalizedDecimalWeights = {
      experience: weights.experience / 100,
      skills: weights.skills / 100,
      projects: weights.projects / 100,
      education: weights.education / 100,
    };

    try {
      await runRankingMutation.mutateAsync({
        jobId: selectedJobId,
        weights: normalizedDecimalWeights,
      });
      setActionSuccessMessage('AI shortlisting and ranking completed successfully!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to run AI ranking:', err);
    }
  };

  const handleShortlistCandidate = async (applicationId: number, candidateName?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: applicationId,
        status: 'SHORTLISTED',
      });
      setActionSuccessMessage(
        candidateName
          ? `${candidateName} successfully marked as Shortlisted!`
          : 'Candidate successfully marked as Shortlisted!'
      );
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to shortlist candidate:', err);
    }
  };

  const handleExportCsv = () => {
    if (!rankingData || !currentJob) return;
    exportShortlistToCsv(currentJob.title, rankingData.ranked_candidates);
  };

  const toggleReasonExpand = (applicationId: number) => {
    setExpandedReasons((prev) => ({ ...prev, [applicationId]: !prev[applicationId] }));
  };

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
            AI Resume Shortlisting
          </h1>
          <p className={styles.subtitle}>
            Screen and shortlist candidates objectively using AI criteria weights.
          </p>
        </div>
        <EmptyState 
          title="No jobs posted yet" 
          description="You need to post a job before you can screen and shortlist candidates."
        />
      </div>
    );
  }

  const rankedCandidates = rankingData?.ranked_candidates || [];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}><FiCpu /></span>
              AI Resume Shortlisting Agent
            </h1>
            <p className={styles.subtitle}>
              Screen and rank applicants objectively using configurable AI evaluation criteria, 
              then export to spreadsheet, consult the AI Copilot, or shortlist with one click.
            </p>
          </div>

          <button
            type="button"
            className={`${styles.copilotToggleBtn} ${isCopilotOpen ? styles.copilotToggleBtnActive : ''}`}
            onClick={() => setIsCopilotOpen((prev) => !prev)}
            title="Toggle AI Recruiter Copilot"
          >
            <FiCpu className={styles.copilotIcon} />
            <span>AI Recruiter Copilot</span>
            <span className={styles.copilotPulseDot} />
            {rankedCandidates.length > 0 && (
              <span className={styles.copilotBadge}>{rankedCandidates.length} evaluated</span>
            )}
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div style={{
          backgroundColor: 'var(--color-success-subtle)',
          color: 'var(--color-success)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
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
            {rankingData && (
              <div className={styles.statBadge}>
                <FiCheckCircle />
                <span>Ranked Candidates:</span>
                <span className={styles.statValue}>{rankingData.total_candidates}</span>
              </div>
            )}
          </div>
        </div>

        {/* Criteria Tuning Section */}
        <div className={styles.criteriaSection}>
          <div className={styles.criteriaHeader}>
            <div className={styles.criteriaTitle}>
              <FiSliders />
              <span>Scoring Weights Configuration</span>
            </div>
            <div className={styles.presetChips}>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={`${styles.presetChip} ${activePreset === p.name ? styles.presetChipActive : ''}`}
                  onClick={() => handleApplyPreset(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.weightsGrid}>
            {(['experience', 'skills', 'projects', 'education'] as const).map((crit) => (
              <div key={crit} className={styles.weightItem}>
                <div className={styles.weightLabelRow}>
                  <span className={styles.weightLabel}>{crit}</span>
                  <span className={styles.weightPercent}>{weights[crit]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[crit]}
                  onChange={(e) => handleSliderChange(crit, Number(e.target.value))}
                  className={styles.weightSlider}
                />
              </div>
            ))}
          </div>

          <div className={styles.actionsRow}>
            <div className={styles.weightStatus}>
              Total Weights: <strong>{totalWeight}%</strong>
              {totalWeight !== 100 && (
                <span className={styles.weightWarning}>
                  {' '}(Will be automatically normalized to 100%)
                </span>
              )}
            </div>

            <div className={styles.ctaButtons}>
              {rankingData && (
                <Button
                  variant="secondary"
                  onClick={() => refetchRanking()}
                  disabled={isLoadingRanking}
                >
                  <FiRefreshCw /> Refresh Snapshot
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleRunRanking}
                disabled={runRankingMutation.isPending || !selectedJobId || (applicants?.length ?? 0) === 0}
              >
                {runRankingMutation.isPending ? (
                  <span className={styles.evaluatingSpinner}>
                    <LoadingSpinner size="sm" /> Evaluating Resumes...
                  </span>
                ) : (
                  <>⚡ Run AI Shortlisting</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section / Table */}
      <div className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div className={styles.resultsTitleArea}>
            <h2 className={styles.resultsHeading}>Ranked Candidate Shortlist</h2>
            <span className={styles.resultsCount}>
              {rankedCandidates.length} evaluated
            </span>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={handleExportCsv}
              disabled={rankedCandidates.length === 0}
            >
              <FiDownload /> Export to CSV
            </Button>
          </div>
        </div>

        {runRankingMutation.isPending ? (
          <div className={styles.emptyCard}>
            <LoadingSpinner size="lg" />
            <h3 className={styles.emptyTitle}>AI Agent Evaluating Resumes...</h3>
            <p className={styles.emptyDesc}>
              The AI recruiter is analyzing PDF resumes against job requirements, 
              evaluating individual criteria, and calculating composite scores.
            </p>
          </div>
        ) : rankedCandidates.length === 0 ? (
          <div className={styles.emptyCard}>
            <FiAlertCircle size={40} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No Ranking Snapshot Found</h3>
            <p className={styles.emptyDesc}>
              {(applicants?.length ?? 0) === 0
                ? 'There are currently no applicant submissions for this job posting.'
                : 'Click "Run AI Shortlisting" above to evaluate candidates and generate the leaderboard table.'}
            </p>
            {(applicants?.length ?? 0) > 0 && (
              <Button variant="primary" onClick={handleRunRanking}>
                ⚡ Run AI Shortlisting Now
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th style={{ minWidth: '200px' }}>Candidate</th>
                  <th style={{ minWidth: '150px' }}>Overall Match</th>
                  <th style={{ minWidth: '220px' }}>Criteria Breakdown</th>
                  <th style={{ minWidth: '280px' }}>AI Evidence & Notes</th>
                  <th style={{ width: '130px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rankedCandidates.map((candidate) => {
                  const applicantInfo = applicantsMap.get(candidate.application_id);
                  const isShortlisted = applicantInfo?.status === 'SHORTLISTED';
                  const isExpanded = expandedReasons[candidate.application_id];
                  const resumeUrl = applicantInfo?.resume?.file_url;

                  // Get color class for overall score
                  const scoreClass =
                    candidate.final_score >= 80
                      ? styles.scoreHigh
                      : candidate.final_score >= 60
                      ? styles.scoreMid
                      : styles.scoreLow;

                  // Aggregate reasons
                  const reasonsList = Object.entries(candidate.criteria_details || {});

                  return (
                    <tr key={candidate.application_id}>
                      {/* Rank */}
                      <td>
                        <span
                          className={`${styles.rankBadge} ${
                            candidate.rank === 1
                              ? styles.topRank1
                              : candidate.rank === 2
                              ? styles.topRank2
                              : candidate.rank === 3
                              ? styles.topRank3
                              : ''
                          }`}
                        >
                          {candidate.rank}
                        </span>
                      </td>

                      {/* Candidate */}
                      <td>
                        <div className={styles.candidateCell}>
                          <button
                            type="button"
                            className={styles.candidateNameButton}
                            onClick={() => {
                              setSelectedCandidateAppId(candidate.application_id);
                              setIsCopilotOpen(true);
                            }}
                            title={`Focus ${candidate.candidate_name} in AI Copilot`}
                          >
                            {candidate.candidate_name || 'Applicant'}
                          </button>
                          <span className={styles.candidateEmail}>
                            {candidate.candidate_email}
                          </span>
                          {resumeUrl && (
                            <a
                              href={getMediaUrl(resumeUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.resumeLink}
                            >
                              <FiExternalLink size={12} /> View Resume PDF
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Overall Match Score */}
                      <td>
                        <div className={styles.scoreCell}>
                          <div className={styles.scoreNumber}>
                            {candidate.final_score.toFixed(1)}%
                            <span className={styles.scoreMax}>match</span>
                          </div>
                          <div className={styles.scoreProgressBar}>
                            <div
                              className={`${styles.scoreProgressFill} ${scoreClass}`}
                              style={{ width: `${Math.min(100, Math.max(0, candidate.final_score))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Criteria Breakdown */}
                      <td>
                        <div className={styles.breakdownGrid}>
                          {Object.entries(candidate.criteria_scores || {}).map(([crit, score]) => (
                            <span key={crit} className={styles.breakdownBadge}>
                              {crit.substring(0, 4)}: <strong>{score}</strong>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* AI Recruiter Notes */}
                      <td>
                        <div className={styles.reasonCell}>
                          {reasonsList.length > 0 ? (
                            <div>
                              {isExpanded ? (
                                <div>
                                  {reasonsList.map(([crit, detail]) => (
                                    <div key={crit} style={{ marginBottom: '6px' }}>
                                      <strong style={{ textTransform: 'capitalize' }}>{crit}:</strong>{' '}
                                      {detail.reason}
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className={styles.reasonToggle}
                                    onClick={() => toggleReasonExpand(candidate.application_id)}
                                  >
                                    Show less
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <span>{reasonsList[0][1].reason}</span>
                                  {reasonsList.length > 1 && (
                                    <button
                                      type="button"
                                      className={styles.reasonToggle}
                                      onClick={() => toggleReasonExpand(candidate.application_id)}
                                    >
                                      + View {reasonsList.length - 1} more criteria notes
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              No detailed notes available.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionCell}>
                          {isShortlisted ? (
                            <span className={styles.shortlistedBadge}>
                              <FiCheckCircle /> Shortlisted
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              onClick={() => handleShortlistCandidate(candidate.application_id, candidate.candidate_name)}
                              disabled={updateStatusMutation.isPending}
                            >
                              Shortlist
                            </Button>
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

      {/* Unified AI Recruiter Copilot Single Slide-Over Drawer */}
      {isCopilotOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            onClick={() => setIsCopilotOpen(false)}
            aria-label="Close copilot overlay"
          />
          <div className={styles.drawerWrapper}>
            <CopilotDrawer
              jobId={selectedJobId ?? 0}
              jobTitle={currentJob?.title || 'Selected Job'}
              totalCandidates={rankedCandidates.length}
              candidates={rankedCandidates}
              selectedCandidateAppId={selectedCandidateAppId}
              onSelectCandidate={setSelectedCandidateAppId}
              isOpen={isCopilotOpen}
              onClose={() => setIsCopilotOpen(false)}
              onShortlistCandidate={handleShortlistCandidate}
              shortlistedIds={shortlistedIds}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeShortlist;
