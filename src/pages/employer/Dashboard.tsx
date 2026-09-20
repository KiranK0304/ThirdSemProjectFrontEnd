import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Tag, Avatar, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useEmployerJobs } from '@/hooks/queries/useJobQueries';
import { useEmployerApplications, useRecruitmentAnalytics } from '@/hooks/queries/useApplicationQueries';
import { downloadApplicantsCsvApi, triggerCsvDownload } from '@/api/applications';
import { FunnelStage, JobAnalyticsBreakdown } from '@/api/types';
import { formatRelativeTime } from '@/utils/date';
import { formatStatus, getJobStatusVariant, getApplicationStatusVariant } from '@/utils/format';
import {
  FiDownload,
  FiTrendingUp,
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiFilter,
  FiExternalLink,
  FiPlus,
} from 'react-icons/fi';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportingJobId, setExportingJobId] = useState<number | null>(null);

  const { data: jobs, isLoading: isLoadingJobs } = useEmployerJobs();
  const { data: applications, isLoading: isLoadingApplications } = useEmployerApplications();
  const { data: analytics, isLoading: isLoadingAnalytics } = useRecruitmentAnalytics();

  const handleExportAllCsv = async () => {
    try {
      setIsExportingAll(true);
      const blob = await downloadApplicantsCsvApi();
      const dateStr = new Date().toISOString().slice(0, 10);
      triggerCsvDownload(blob, `talentwright_all_candidates_${dateStr}.csv`);
    } catch (err) {
      console.error('Failed to export candidates CSV', err);
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleExportJobCsv = async (jobId: number, jobTitle: string) => {
    try {
      setExportingJobId(jobId);
      const blob = await downloadApplicantsCsvApi(jobId);
      const safeTitle = jobTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
      triggerCsvDownload(blob, `candidates_${safeTitle}_${jobId}.csv`);
    } catch (err) {
      console.error('Failed to export job candidates CSV', err);
    } finally {
      setExportingJobId(null);
    }
  };

  if (isLoadingJobs || isLoadingApplications) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Summary Metrics fallback
  const activeJobs = analytics?.summary.active_jobs ?? (jobs?.filter((j) => j.status === 'OPEN').length || 0);
  const totalApplicants = analytics?.summary.total_applicants ?? (applications?.length || 0);
  const shortlistRate = analytics?.summary.shortlist_rate ?? 0;
  const acceptanceRate = analytics?.summary.acceptance_rate ?? 0;
  const offerRate = analytics?.summary.offer_rate ?? 0;

  const funnelStages: FunnelStage[] = analytics?.funnel || [
    { stage: 'Applications Received', count: totalApplicants, percentage: 100 },
    { stage: 'Reviewed / Evaluated', count: 0, percentage: 0 },
    { stage: 'Shortlisted', count: 0, percentage: 0 },
    { stage: 'Offers Extended', count: 0, percentage: 0 },
    { stage: 'Offers Accepted', count: 0, percentage: 0 },
  ];

  const recentJobs = jobs?.slice(0, 5) || [];
  const recentApplicants = applications?.slice(0, 5) || [];

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <section className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.headerTitle}>Welcome back, {user?.name?.split(' ')[0] || 'Employer'}</h1>
            <p className={styles.headerSubtitle}>
              Managing talent acquisition for {user?.employer_profile?.company_name || 'your organization'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.csvExportBtn}
              onClick={handleExportAllCsv}
              disabled={isExportingAll || totalApplicants === 0}
              title="Download full candidate list across all postings as CSV"
            >
              <FiDownload />
              <span>{isExportingAll ? 'Exporting...' : 'Export All Candidates (CSV)'}</span>
            </button>
            <Button variant="primary" onClick={() => navigate('/employer/jobs')}>
              <FiPlus /> Manage Jobs
            </Button>
          </div>
        </div>

        {user?.employer_profile?.verification_status === 'PENDING' && (
          <div className={styles.warningCard}>
            <p className={styles.warningText}>
              Your company account is currently pending verification. You can post jobs, but they won't be visible to
              candidates until verified.
            </p>
          </div>
        )}
      </section>

      {/* STATS ROW (KPIs) */}
      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <FiBriefcase className={styles.statIcon} />
          </div>
          <p className={styles.statNumber}>{activeJobs}</p>
          <p className={styles.statLabel}>Active Job Openings</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <FiUsers className={styles.statIcon} />
          </div>
          <p className={styles.statNumber}>{totalApplicants}</p>
          <p className={styles.statLabel}>Total Applicants</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <FiFilter className={styles.statIcon} />
          </div>
          <p className={styles.statNumber}>{shortlistRate}%</p>
          <p className={styles.statLabel}>Shortlist Conversion Rate</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <FiCheckCircle className={styles.statIcon} />
          </div>
          <p className={styles.statNumber}>{acceptanceRate}%</p>
          <p className={styles.statLabel}>Offer Acceptance Rate</p>
        </div>
      </section>

      {/* RECRUITMENT FUNNEL SECTION */}
      <section className={styles.funnelCard}>
        <div className={styles.funnelHeader}>
          <div>
            <div className={styles.funnelBadge}>
              <FiTrendingUp /> Pipeline Conversion Funnel
            </div>
            <h2 className={styles.funnelTitle}>Recruitment Velocity & Hiring Funnel</h2>
            <p className={styles.funnelSubtitle}>
              Live tracking of candidate conversion ratios from first application to offer acceptance
            </p>
          </div>
          <div className={styles.funnelSummaryPills}>
            <div className={styles.pillStat}>
              <span className={styles.pillLabel}>Offer Extension Rate:</span>
              <span className={styles.pillValue}>{offerRate}%</span>
            </div>
            <div className={styles.pillStat}>
              <span className={styles.pillLabel}>Total Offers Accepted:</span>
              <span className={styles.pillValue}>
                {analytics?.summary.offers_accepted_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.funnelStages}>
          {funnelStages.map((stage: FunnelStage, idx: number) => {
            const barWidth = Math.max(stage.percentage, 4);
            const colorClass =
              idx === 0
                ? styles.stageColor_APPLIED
                : idx === 1
                ? styles.stageColor_REVIEWED
                : idx === 2
                ? styles.stageColor_SHORTLISTED
                : idx === 3
                ? styles.stageColor_OFFERED
                : styles.stageColor_ACCEPTED;

            return (
              <div key={stage.stage} className={styles.funnelStageRow}>
                <div className={styles.funnelStageInfo}>
                  <div className={styles.funnelStageNumber}>{idx + 1}</div>
                  <div className={styles.funnelStageText}>
                    <span className={styles.funnelStageName}>{stage.stage}</span>
                    <span className={styles.funnelStageCount}>
                      {stage.count} {stage.count === 1 ? 'candidate' : 'candidates'}
                    </span>
                  </div>
                </div>

                <div className={styles.funnelBarContainer}>
                  <div
                    className={`${styles.funnelBarFill} ${colorClass}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className={styles.funnelStageRate}>
                  <span className={styles.ratePercent}>{stage.percentage}%</span>
                  <span className={styles.rateLabel}>of applicants</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* JOB BREAKDOWN / PERFORMANCE SECTION */}
      {analytics?.jobs_breakdown && analytics.jobs_breakdown.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Job Performance & Candidate Export</h2>
              <p className={styles.sectionSubtitle}>
                Per-job applicant volumes, shortlist counts, and quick CSV data export
              </p>
            </div>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.jobTable}>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Shortlisted</th>
                  <th>Offered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.jobs_breakdown.map((jb: JobAnalyticsBreakdown) => (
                  <tr key={jb.job_id}>
                    <td>
                      <Link to={`/employer/jobs/${jb.job_id}/applicants`} className={styles.tableJobTitle}>
                        {jb.title}
                      </Link>
                    </td>
                    <td>
                      <Tag variant={getJobStatusVariant(jb.status)}>{formatStatus(jb.status)}</Tag>
                    </td>
                    <td>
                      <strong>{jb.applicant_count}</strong>
                    </td>
                    <td>{jb.shortlisted_count}</td>
                    <td>
                      <span className={styles.acceptedCount}>{jb.offered_count}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={styles.smallExportBtn}
                          onClick={() => handleExportJobCsv(jb.job_id, jb.title)}
                          disabled={exportingJobId === jb.job_id || jb.applicant_count === 0}
                          title="Export candidate roster for this position to CSV"
                        >
                          <FiDownload size={13} />
                          <span>{exportingJobId === jb.job_id ? 'Exporting...' : 'CSV'}</span>
                        </button>
                        <Link to={`/employer/jobs/${jb.job_id}/applicants`} className={styles.actionLink}>
                          Pipeline <FiExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* RECENT APPLICANTS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest Applicants</h2>
        </div>

        <div className={styles.applicantsList}>
          {recentApplicants.length > 0 ? (
            recentApplicants.map((app) => (
              <div key={app.id} className={styles.applicantCard}>
                <div className={styles.applicantInfo}>
                  <Avatar name={app.seeker?.user_name || app.seeker?.user_email || 'Applicant'} size={40} />
                  <div className={styles.applicantDetails}>
                    <h3 className={styles.applicantName}>
                      {app.seeker?.user_name || app.seeker?.user_email || 'Applicant'}
                    </h3>
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

