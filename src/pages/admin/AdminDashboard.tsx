import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, FiSearch, FiExternalLink, FiUsers, FiBriefcase, 
  FiClock, FiCheckCircle, FiXCircle, FiEye, FiCheck, FiX, 
  FiRefreshCw, FiTrendingUp, FiAlertCircle, FiGlobe
} from 'react-icons/fi';
import { LoadingSpinner, EmptyState, Tag, Button, Modal, ConfirmModal } from '@/components/ui';
import { useAdminEmployers, useApproveEmployer, useRejectEmployer } from '@/hooks/queries/useAdminQueries';
import { useJobs } from '@/hooks/queries/useJobQueries';
import { formatRelativeTime, formatDate, formatSalary } from '@/utils/date';
import { AdminEmployer } from '@/api/admin';
import { Job } from '@/api/types';
import styles from './AdminDashboard.module.css';

type ActiveTab = 'employers' | 'jobs' | 'analytics';
type EmployerStatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED';
type JobStatusFilter = '' | 'OPEN' | 'DRAFT' | 'CLOSED' | 'ARCHIVED';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('employers');
  
  // Employer state
  const [employerStatusFilter, setEmployerStatusFilter] = useState<EmployerStatusFilter>('');
  const [employerSearch, setEmployerSearch] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState<AdminEmployer | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    employer: AdminEmployer;
  } | null>(null);

  // Job state
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatusFilter>('');
  const [jobSearch, setJobSearch] = useState('');

  // Queries
  const { 
    data: employers = [], 
    isLoading: isEmployersLoading, 
    refetch: refetchEmployers, 
    isFetching: isEmployersFetching 
  } = useAdminEmployers(employerStatusFilter || undefined);
  
  const { 
    data: jobs = [], 
    isLoading: isJobsLoading, 
    refetch: refetchJobs, 
    isFetching: isJobsFetching 
  } = useJobs();

  const approveMutation = useApproveEmployer();
  const rejectMutation = useRejectEmployer();

  // Metrics
  const pendingCount = useMemo(() => employers.filter(e => e.verification_status === 'PENDING').length, [employers]);
  const approvedCount = useMemo(() => employers.filter(e => e.verification_status === 'APPROVED').length, [employers]);
  const rejectedCount = useMemo(() => employers.filter(e => e.verification_status === 'REJECTED').length, [employers]);
  const openJobsCount = useMemo(() => jobs.filter(j => j.status === 'OPEN').length, [jobs]);
  const approvalRate = useMemo(() => {
    const totalDecided = approvedCount + rejectedCount;
    if (totalDecided === 0) return 0;
    return Math.round((approvedCount / totalDecided) * 100);
  }, [approvedCount, rejectedCount]);

  // Filtered Employers
  const filteredEmployers = useMemo(() => {
    if (!employerSearch.trim()) return employers;
    const query = employerSearch.toLowerCase();
    return employers.filter(emp => 
      (emp.company_name && emp.company_name.toLowerCase().includes(query)) ||
      (emp.user_email && emp.user_email.toLowerCase().includes(query)) ||
      (emp.website && emp.website.toLowerCase().includes(query))
    );
  }, [employers, employerSearch]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesStatus = !jobStatusFilter || job.status === jobStatusFilter;
      const query = jobSearch.toLowerCase();
      const matchesSearch = !jobSearch.trim() || 
        job.title.toLowerCase().includes(query) ||
        (job.employer?.company_name && job.employer.company_name.toLowerCase().includes(query)) ||
        (job.location && job.location.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [jobs, jobStatusFilter, jobSearch]);

  const handleRefresh = () => {
    refetchEmployers();
    refetchJobs();
  };

  const handleApprove = (emp: AdminEmployer) => {
    approveMutation.mutate(emp.id, {
      onSuccess: () => {
        setConfirmAction(null);
        if (selectedEmployer?.id === emp.id) {
          setSelectedEmployer(prev => prev ? { ...prev, verification_status: 'APPROVED' } : null);
        }
      }
    });
  };

  const handleReject = (emp: AdminEmployer) => {
    rejectMutation.mutate(emp.id, {
      onSuccess: () => {
        setConfirmAction(null);
        if (selectedEmployer?.id === emp.id) {
          setSelectedEmployer(prev => prev ? { ...prev, verification_status: 'REJECTED' } : null);
        }
      }
    });
  };

  const getStatusVariant = (status: string): 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'OPEN': return 'success';
      case 'CLOSED': return 'danger';
      case 'DRAFT': return 'neutral';
      case 'ARCHIVED': return 'neutral';
      default: return 'neutral';
    }
  };

  if (isEmployersLoading && employers.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <LoadingSpinner size="lg" />
          <p className={styles.loadingText}>Loading platform administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Dashboard Top Header */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerBadge}>
            <FiShield className={styles.headerBadgeIcon} />
            <span>Platform Operations</span>
          </div>
          <h1 className={styles.headerTitle}>Admin Console</h1>
          <p className={styles.headerSubtitle}>
            Oversee employer verification requests, monitor platform jobs, and audit platform health.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isEmployersFetching || isJobsFetching}
            className={styles.refreshBtn}
          >
            <FiRefreshCw className={isEmployersFetching || isJobsFetching ? styles.spinIcon : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </section>

      {/* KPI Overview Cards */}
      <section className={styles.kpiGrid}>
        <div 
          className={`${styles.kpiCard} ${activeTab === 'employers' && employerStatusFilter === '' ? styles.kpiActive : ''}`}
          onClick={() => { setActiveTab('employers'); setEmployerStatusFilter(''); }}
          role="button"
          tabIndex={0}
        >
          <div className={styles.kpiIconWrapper}>
            <FiUsers className={styles.kpiIcon} />
          </div>
          <div className={styles.kpiDetails}>
            <p className={styles.kpiNumber}>{employers.length}</p>
            <p className={styles.kpiLabel}>Total Employers</p>
            <span className={styles.kpiMeta}>{approvedCount} approved active</span>
          </div>
        </div>

        <div 
          className={`${styles.kpiCard} ${pendingCount > 0 ? styles.kpiWarning : ''} ${activeTab === 'employers' && employerStatusFilter === 'PENDING' ? styles.kpiActive : ''}`}
          onClick={() => { setActiveTab('employers'); setEmployerStatusFilter('PENDING'); }}
          role="button"
          tabIndex={0}
        >
          <div className={`${styles.kpiIconWrapper} ${styles.warningIconBg}`}>
            <FiClock className={styles.warningIcon} />
          </div>
          <div className={styles.kpiDetails}>
            <p className={styles.kpiNumber}>{pendingCount}</p>
            <p className={styles.kpiLabel}>Pending Review</p>
            <span className={styles.kpiMeta}>
              {pendingCount > 0 ? 'Requires attention' : 'Queue cleared'}
            </span>
          </div>
        </div>

        <div 
          className={`${styles.kpiCard} ${activeTab === 'jobs' ? styles.kpiActive : ''}`}
          onClick={() => { setActiveTab('jobs'); }}
          role="button"
          tabIndex={0}
        >
          <div className={styles.kpiIconWrapper}>
            <FiBriefcase className={styles.kpiIcon} />
          </div>
          <div className={styles.kpiDetails}>
            <p className={styles.kpiNumber}>{jobs.length}</p>
            <p className={styles.kpiLabel}>Platform Jobs</p>
            <span className={styles.kpiMeta}>{openJobsCount} published & open</span>
          </div>
        </div>

        <div 
          className={`${styles.kpiCard} ${activeTab === 'analytics' ? styles.kpiActive : ''}`}
          onClick={() => { setActiveTab('analytics'); }}
          role="button"
          tabIndex={0}
        >
          <div className={styles.kpiIconWrapper}>
            <FiTrendingUp className={styles.kpiIcon} />
          </div>
          <div className={styles.kpiDetails}>
            <p className={styles.kpiNumber}>{approvalRate}%</p>
            <p className={styles.kpiLabel}>Verification Rate</p>
            <span className={styles.kpiMeta}>{rejectedCount} rejected total</span>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'employers' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('employers')}
        >
          <FiUsers />
          <span>Employer Verifications</span>
          {pendingCount > 0 && <span className={styles.tabBadge}>{pendingCount}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'jobs' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <FiBriefcase />
          <span>Job Directory</span>
          <span className={styles.tabCount}>{jobs.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'analytics' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FiTrendingUp />
          <span>Platform Health</span>
        </button>
      </nav>

      {/* TAB 1: EMPLOYER VERIFICATIONS */}
      {activeTab === 'employers' && (
        <section className={styles.tabSection}>
          {/* Controls Bar: Search & Status Chips */}
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search company name, email, or domain..."
                value={employerSearch}
                onChange={(e) => setEmployerSearch(e.target.value)}
                className={styles.searchInput}
              />
              {employerSearch && (
                <button className={styles.clearSearch} onClick={() => setEmployerSearch('')}>
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className={styles.filterChips}>
              <button
                className={`${styles.chip} ${employerStatusFilter === '' ? styles.chipActive : ''}`}
                onClick={() => setEmployerStatusFilter('')}
              >
                All <span className={styles.chipCount}>{employers.length}</span>
              </button>
              <button
                className={`${styles.chip} ${employerStatusFilter === 'PENDING' ? styles.chipActive : ''}`}
                onClick={() => setEmployerStatusFilter('PENDING')}
              >
                Pending <span className={styles.chipCount}>{pendingCount}</span>
              </button>
              <button
                className={`${styles.chip} ${employerStatusFilter === 'APPROVED' ? styles.chipActive : ''}`}
                onClick={() => setEmployerStatusFilter('APPROVED')}
              >
                Approved <span className={styles.chipCount}>{approvedCount}</span>
              </button>
              <button
                className={`${styles.chip} ${employerStatusFilter === 'REJECTED' ? styles.chipActive : ''}`}
                onClick={() => setEmployerStatusFilter('REJECTED')}
              >
                Rejected <span className={styles.chipCount}>{rejectedCount}</span>
              </button>
            </div>
          </div>

          {/* Employers Table */}
          {filteredEmployers.length === 0 ? (
            <div className={styles.emptyCard}>
              <EmptyState
                title="No employers found"
                description={
                  employerSearch
                    ? `No employers matching "${employerSearch}"`
                    : employerStatusFilter
                    ? `No employers with status "${employerStatusFilter}".`
                    : 'No employers registered yet.'
                }
              />
              {(employerSearch || employerStatusFilter) && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setEmployerSearch(''); setEmployerStatusFilter(''); }}
                  className={styles.resetFiltersBtn}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableHeaderInfo}>
                <span>Showing {filteredEmployers.length} of {employers.length} employers</span>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Website</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th className={styles.actionsHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployers.map((emp) => {
                      const initials = (emp.company_name || emp.user_name || emp.user_email)
                        .slice(0, 2)
                        .toUpperCase();
                      const isApproving = approveMutation.isPending && approveMutation.variables === emp.id;
                      const isRejecting = rejectMutation.isPending && rejectMutation.variables === emp.id;

                      return (
                        <tr key={emp.id} className={styles.tableRow}>
                          <td>
                            <div className={styles.companyCell}>
                              <div className={styles.companyAvatar}>{initials}</div>
                              <div className={styles.companyMeta}>
                                <div className={styles.companyName}>
                                  {emp.company_name || 'Unnamed Company'}
                                </div>
                                <div className={styles.companyEmail}>{emp.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {emp.website ? (
                              <a
                                href={emp.website.startsWith('http') ? emp.website : `https://${emp.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.websiteLink}
                                title={emp.website}
                              >
                                <span>{emp.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                <FiExternalLink size={12} />
                              </a>
                            ) : (
                              <span className={styles.mutedText}>—</span>
                            )}
                          </td>
                          <td>
                            <Tag variant={getStatusVariant(emp.verification_status)}>
                              {emp.verification_status}
                            </Tag>
                          </td>
                          <td>
                            <span className={styles.dateText} title={formatDate(emp.created_at)}>
                              {formatRelativeTime(emp.created_at)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionRow}>
                              <button
                                className={styles.inspectBtn}
                                onClick={() => setSelectedEmployer(emp)}
                                title="Inspect company profile"
                              >
                                <FiEye size={14} />
                                <span>Inspect</span>
                              </button>

                              {emp.verification_status !== 'APPROVED' && (
                                <button
                                  className={styles.approveBtn}
                                  onClick={() => setConfirmAction({ type: 'approve', employer: emp })}
                                  disabled={isApproving || isRejecting}
                                  title="Approve employer"
                                >
                                  {isApproving ? <LoadingSpinner size="sm" /> : <FiCheck size={14} />}
                                  <span>Approve</span>
                                </button>
                              )}

                              {emp.verification_status !== 'REJECTED' && (
                                <button
                                  className={styles.rejectBtn}
                                  onClick={() => setConfirmAction({ type: 'reject', employer: emp })}
                                  disabled={isApproving || isRejecting}
                                  title="Reject employer"
                                >
                                  {isRejecting ? <LoadingSpinner size="sm" /> : <FiX size={14} />}
                                  <span>Reject</span>
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
            </div>
          )}
        </section>
      )}

      {/* TAB 2: PLATFORM JOB DIRECTORY */}
      {activeTab === 'jobs' && (
        <section className={styles.tabSection}>
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search job title, company, location..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className={styles.searchInput}
              />
              {jobSearch && (
                <button className={styles.clearSearch} onClick={() => setJobSearch('')}>
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className={styles.filterChips}>
              <button
                className={`${styles.chip} ${jobStatusFilter === '' ? styles.chipActive : ''}`}
                onClick={() => setJobStatusFilter('')}
              >
                All <span className={styles.chipCount}>{jobs.length}</span>
              </button>
              <button
                className={`${styles.chip} ${jobStatusFilter === 'OPEN' ? styles.chipActive : ''}`}
                onClick={() => setJobStatusFilter('OPEN')}
              >
                Open <span className={styles.chipCount}>{jobs.filter(j => j.status === 'OPEN').length}</span>
              </button>
              <button
                className={`${styles.chip} ${jobStatusFilter === 'DRAFT' ? styles.chipActive : ''}`}
                onClick={() => setJobStatusFilter('DRAFT')}
              >
                Draft <span className={styles.chipCount}>{jobs.filter(j => j.status === 'DRAFT').length}</span>
              </button>
              <button
                className={`${styles.chip} ${jobStatusFilter === 'CLOSED' ? styles.chipActive : ''}`}
                onClick={() => setJobStatusFilter('CLOSED')}
              >
                Closed <span className={styles.chipCount}>{jobs.filter(j => j.status === 'CLOSED').length}</span>
              </button>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className={styles.emptyCard}>
              <EmptyState
                title="No jobs found"
                description={
                  jobSearch
                    ? `No jobs matching "${jobSearch}"`
                    : jobStatusFilter
                    ? `No jobs with status "${jobStatusFilter}".`
                    : 'No job postings on platform yet.'
                }
              />
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableHeaderInfo}>
                <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Job Title & Location</th>
                      <th>Employer</th>
                      <th>Type</th>
                      <th>Compensation</th>
                      <th>Status</th>
                      <th>Posted</th>
                      <th className={styles.actionsHeader}>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className={styles.tableRow}>
                        <td>
                          <div>
                            <div className={styles.jobTitle}>{job.title}</div>
                            <div className={styles.jobLocation}>{job.location || 'Remote / Unspecified'}</div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.employerName}>
                            {job.employer?.company_name || 'Unnamed Company'}
                          </span>
                        </td>
                        <td>
                          <span className={styles.typeBadge}>
                            {job.employment_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={styles.salaryText}>
                            {formatSalary(job.salary_min, job.salary_max, job.salary_currency) || 'Not disclosed'}
                          </span>
                        </td>
                        <td>
                          <Tag variant={getStatusVariant(job.status)}>
                            {job.status}
                          </Tag>
                        </td>
                        <td>
                          <span className={styles.dateText}>{formatRelativeTime(job.created_at)}</span>
                        </td>
                        <td>
                          <Link
                            to={`/jobs/${job.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewJobLink}
                            title="View public posting"
                          >
                            <span>View</span>
                            <FiExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PLATFORM HEALTH & METRICS */}
      {activeTab === 'analytics' && (
        <section className={styles.tabSection}>
          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsCard}>
              <h3 className={styles.analyticsTitle}>
                <FiUsers className={styles.cardHeaderIcon} />
                <span>Employer Verification Breakdown</span>
              </h3>
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span>Approved Rate</span>
                  <span className={styles.progressValue}>{approvalRate}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${approvalRate}%` }} />
                </div>
              </div>
              <div className={styles.statBreakdown}>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotSuccess}></span>
                  <span className={styles.breakdownLabel}>Approved</span>
                  <span className={styles.breakdownValue}>{approvedCount}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotWarning}></span>
                  <span className={styles.breakdownLabel}>Pending Review</span>
                  <span className={styles.breakdownValue}>{pendingCount}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotDanger}></span>
                  <span className={styles.breakdownLabel}>Rejected</span>
                  <span className={styles.breakdownValue}>{rejectedCount}</span>
                </div>
              </div>
            </div>

            <div className={styles.analyticsCard}>
              <h3 className={styles.analyticsTitle}>
                <FiBriefcase className={styles.cardHeaderIcon} />
                <span>Job Marketplace Distribution</span>
              </h3>
              <div className={styles.statBreakdown}>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotSuccess}></span>
                  <span className={styles.breakdownLabel}>Live & Open Jobs</span>
                  <span className={styles.breakdownValue}>{openJobsCount}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotNeutral}></span>
                  <span className={styles.breakdownLabel}>Draft Jobs</span>
                  <span className={styles.breakdownValue}>{jobs.filter(j => j.status === 'DRAFT').length}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotDanger}></span>
                  <span className={styles.breakdownLabel}>Closed / Archived</span>
                  <span className={styles.breakdownValue}>{jobs.filter(j => j.status === 'CLOSED' || j.status === 'ARCHIVED').length}</span>
                </div>
              </div>
              <div className={styles.ratioBanner}>
                <span className={styles.ratioLabel}>Jobs per Employer Ratio:</span>
                <span className={styles.ratioValue}>
                  {employers.length > 0 ? (jobs.length / employers.length).toFixed(1) : 0} avg
                </span>
              </div>
            </div>

            <div className={`${styles.analyticsCard} ${styles.fullWidthCard}`}>
              <h3 className={styles.analyticsTitle}>
                <FiAlertCircle className={styles.cardHeaderIcon} />
                <span>Platform Operational Guidelines</span>
              </h3>
              <div className={styles.guidelinesList}>
                <div className={styles.guidelineItem}>
                  <strong>Employer Verification Policy:</strong>
                  <p>Employers must be in APPROVED status before their posted job openings appear in search results or receive applicant applications.</p>
                </div>
                <div className={styles.guidelineItem}>
                  <strong>Automated Candidate AI Screening:</strong>
                  <p>When applicants submit their resume, the LLM scoring engine evaluates candidates automatically against job requirements.</p>
                </div>
                <div className={styles.guidelineItem}>
                  <strong>Recruiter Copilot Context:</strong>
                  <p>Copilot sessions are scoped per job and employer, referencing vector embeddings of applicant resumes in candidate RAG.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* INSPECT EMPLOYER MODAL */}
      {selectedEmployer && (
        <Modal
          open={!!selectedEmployer}
          onClose={() => setSelectedEmployer(null)}
          title="Employer Verification Details"
          maxWidth="560px"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderInfo}>
              <div className={styles.modalAvatar}>
                {(selectedEmployer.company_name || selectedEmployer.user_email).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className={styles.modalCompanyName}>
                  {selectedEmployer.company_name || 'Unnamed Company'}
                </h3>
                <p className={styles.modalEmail}>{selectedEmployer.user_email}</p>
              </div>
              <Tag variant={getStatusVariant(selectedEmployer.verification_status)}>
                {selectedEmployer.verification_status}
              </Tag>
            </div>

            <div className={styles.modalDetailsGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Website:</span>
                {selectedEmployer.website ? (
                  <a
                    href={selectedEmployer.website.startsWith('http') ? selectedEmployer.website : `https://${selectedEmployer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.websiteLink}
                  >
                    <span>{selectedEmployer.website}</span>
                    <FiExternalLink size={12} />
                  </a>
                ) : (
                  <span className={styles.mutedText}>Not provided</span>
                )}
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Registration:</span>
                <span>{formatDate(selectedEmployer.created_at)} ({formatRelativeTime(selectedEmployer.created_at)})</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Contact Name:</span>
                <span>{selectedEmployer.user_name || 'Not provided'}</span>
              </div>
            </div>

            <div className={styles.descriptionBox}>
              <h4 className={styles.descriptionTitle}>Company Description</h4>
              <p className={styles.descriptionText}>
                {selectedEmployer.description || 'No description provided by this employer.'}
              </p>
            </div>

            <div className={styles.modalActions}>
              {selectedEmployer.verification_status !== 'APPROVED' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleApprove(selectedEmployer);
                  }}
                  loading={approveMutation.isPending}
                >
                  Approve Employer
                </Button>
              )}
              {selectedEmployer.verification_status !== 'REJECTED' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    handleReject(selectedEmployer);
                  }}
                  loading={rejectMutation.isPending}
                >
                  Reject Employer
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedEmployer(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM ACTION MODAL */}
      {confirmAction && (
        <ConfirmModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.type === 'approve') {
              handleApprove(confirmAction.employer);
            } else {
              handleReject(confirmAction.employer);
            }
          }}
          title={confirmAction.type === 'approve' ? 'Approve Employer?' : 'Reject Employer?'}
          description={
            confirmAction.type === 'approve'
              ? `Are you sure you want to verify and approve "${confirmAction.employer.company_name || confirmAction.employer.user_email}"? They will be granted full access to publish jobs on the platform.`
              : `Are you sure you want to reject verification for "${confirmAction.employer.company_name || confirmAction.employer.user_email}"? They will not be able to publish public jobs.`
          }
          confirmText={confirmAction.type === 'approve' ? 'Approve' : 'Reject'}
          variant={confirmAction.type === 'approve' ? 'primary' : 'danger'}
          loading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </div>
  );
}
