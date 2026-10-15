import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, FiSearch, FiExternalLink, FiUsers, FiBriefcase, 
  FiClock, FiCheckCircle, FiXCircle, FiEye, FiCheck, FiX, 
  FiRefreshCw, FiTrendingUp, FiAlertCircle, FiGlobe, FiMapPin,
  FiCopy, FiArrowRight, FiCheckSquare, FiLayers, FiActivity
} from 'react-icons/fi';
import { 
  LoadingSpinner, EmptyState, Tag, Button, Modal, 
  ConfirmModal, CompanyAvatar 
} from '@/components/ui';
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Feedback alert state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Sorting state
  const [employerSort, setEmployerSort] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [jobSort, setJobSort] = useState<'newest' | 'salary' | 'title'>('newest');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('');

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

  // Global Keyboard Shortcut: '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== searchInputRef.current) {
        const tagName = (document.activeElement as HTMLElement)?.tagName;
        if (!['INPUT', 'TEXTAREA'].includes(tagName)) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filtered & Sorted Employers
  const filteredEmployers = useMemo(() => {
    let result = employers;
    if (employerSearch.trim()) {
      const query = employerSearch.toLowerCase();
      result = result.filter(emp => 
        (emp.company_name && emp.company_name.toLowerCase().includes(query)) ||
        (emp.user_email && emp.user_email.toLowerCase().includes(query)) ||
        (emp.website && emp.website.toLowerCase().includes(query)) ||
        (emp.headquarters && emp.headquarters.toLowerCase().includes(query)) ||
        (emp.company_size && emp.company_size.toLowerCase().includes(query)) ||
        (emp.user_name && emp.user_name.toLowerCase().includes(query))
      );
    }

    return [...result].sort((a, b) => {
      if (employerSort === 'name') {
        const nameA = a.company_name || a.user_name || a.user_email;
        const nameB = b.company_name || b.user_name || b.user_email;
        return nameA.localeCompare(nameB);
      }
      if (employerSort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [employers, employerSearch, employerSort]);

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const matchesStatus = !jobStatusFilter || job.status === jobStatusFilter;
      const matchesType = !jobTypeFilter || job.employment_type === jobTypeFilter || job.workplace_type === jobTypeFilter;
      const query = jobSearch.toLowerCase();
      const matchesSearch = !jobSearch.trim() || 
        job.title.toLowerCase().includes(query) ||
        (job.employer?.company_name && job.employer.company_name.toLowerCase().includes(query)) ||
        (job.department && job.department.toLowerCase().includes(query)) ||
        (job.employment_type && job.employment_type.toLowerCase().includes(query)) ||
        (job.location && job.location.toLowerCase().includes(query));
      return matchesStatus && matchesType && matchesSearch;
    });

    return [...result].sort((a, b) => {
      if (jobSort === 'salary') {
        const salaryA = Number(a.salary_max || a.salary_min || 0);
        const salaryB = Number(b.salary_max || b.salary_min || 0);
        return salaryB - salaryA;
      }
      if (jobSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [jobs, jobStatusFilter, jobTypeFilter, jobSearch, jobSort]);

  const handleRefresh = () => {
    refetchEmployers();
    refetchJobs();
  };

  const handleCopyEmail = (e: React.MouseEvent, emp: AdminEmployer) => {
    e.stopPropagation();
    navigator.clipboard.writeText(emp.user_email);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = (emp: AdminEmployer) => {
    approveMutation.mutate(emp.id, {
      onSuccess: () => {
        setConfirmAction(null);
        setFeedback({
          type: 'success',
          message: `Successfully verified and approved "${emp.company_name || emp.user_email}". They can now post jobs.`,
        });
        if (selectedEmployer?.id === emp.id) {
          setSelectedEmployer(prev => prev ? { ...prev, verification_status: 'APPROVED' } : null);
        }
      },
      onError: (err: any) => {
        setFeedback({
          type: 'error',
          message: err?.response?.data?.detail || 'Failed to approve employer. Please try again.',
        });
      },
    });
  };

  const handleReject = (emp: AdminEmployer) => {
    rejectMutation.mutate(emp.id, {
      onSuccess: () => {
        setConfirmAction(null);
        setFeedback({
          type: 'success',
          message: `Rejected verification for "${emp.company_name || emp.user_email}".`,
        });
        if (selectedEmployer?.id === emp.id) {
          setSelectedEmployer(prev => prev ? { ...prev, verification_status: 'REJECTED' } : null);
        }
      },
      onError: (err: any) => {
        setFeedback({
          type: 'error',
          message: err?.response?.data?.detail || 'Failed to reject employer. Please try again.',
        });
      },
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
          <p className={styles.loadingText}>Connecting to platform administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Dashboard Top Header */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTopRow}>
            <div className={styles.headerBadge}>
              <FiShield className={styles.headerBadgeIcon} />
              <span>Platform Operations</span>
            </div>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              <span>Live Synced</span>
            </div>
          </div>
          <h1 className={styles.headerTitle}>Admin Console</h1>
          <p className={styles.headerSubtitle}>
            Oversee employer verification requests, monitor platform jobs, and audit platform health.
          </p>
        </div>
        <div className={styles.headerActions}>
          <a
            href="http://localhost:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.djangoAdminBtn}
            title="Open Django Admin portal in a new tab"
          >
            <FiExternalLink size={13} />
            <span>Django Admin</span>
          </a>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isEmployersFetching || isJobsFetching}
            className={styles.refreshBtn}
          >
            <FiRefreshCw className={isEmployersFetching || isJobsFetching ? styles.spinIcon : ''} />
            <span>{isEmployersFetching || isJobsFetching ? 'Syncing...' : 'Refresh'}</span>
          </Button>
        </div>
      </section>

      {/* Action Feedback Banner */}
      {feedback && (
        <div className={`${styles.feedbackBanner} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
          {feedback.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span className={styles.feedbackMessage}>{feedback.message}</span>
          <button className={styles.feedbackClose} onClick={() => setFeedback(null)} aria-label="Close notification">
            <FiX size={14} />
          </button>
        </div>
      )}

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
            <div className={styles.kpiTopRow}>
              <p className={styles.kpiNumber}>{employers.length}</p>
              <span className={`${styles.kpiBadge} ${styles.kpiBadgeClear}`}>
                {approvedCount} active
              </span>
            </div>
            <p className={styles.kpiLabel}>Total Employers</p>
            <span className={styles.kpiMeta}>Registered recruiter base</span>
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
            <div className={styles.kpiTopRow}>
              <p className={styles.kpiNumber}>{pendingCount}</p>
              <span className={`${styles.kpiBadge} ${pendingCount > 0 ? styles.kpiBadgeAlert : styles.kpiBadgeClear}`}>
                {pendingCount > 0 ? 'Requires Action' : 'Queue Clear'}
              </span>
            </div>
            <p className={styles.kpiLabel}>Pending Review</p>
            <span className={styles.kpiMeta}>
              {pendingCount > 0 ? `${pendingCount} awaiting approval` : 'All requests processed'}
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
            <div className={styles.kpiTopRow}>
              <p className={styles.kpiNumber}>{jobs.length}</p>
              <span className={`${styles.kpiBadge} ${styles.kpiBadgeClear}`}>
                {openJobsCount} live
              </span>
            </div>
            <p className={styles.kpiLabel}>Platform Jobs</p>
            <span className={styles.kpiMeta}>{openJobsCount} published & public</span>
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
            <div className={styles.kpiTopRow}>
              <p className={styles.kpiNumber}>{approvalRate}%</p>
              <span className={`${styles.kpiBadge} ${styles.kpiBadgeClear}`}>
                {rejectedCount} rejected
              </span>
            </div>
            <p className={styles.kpiLabel}>Verification Rate</p>
            <span className={styles.kpiMeta}>Decided applications</span>
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
          {/* Controls Bar: Search & Status Chips & Sorting */}
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search company, email, location, size (Press '/' to focus)..."
                value={employerSearch}
                onChange={(e) => setEmployerSearch(e.target.value)}
                className={styles.searchInput}
              />
              <span className={styles.searchShortcut}>/</span>
              {employerSearch && (
                <button className={styles.clearSearch} onClick={() => setEmployerSearch('')} title="Clear search">
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className={styles.controlsRight}>
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
                  <span className={`${styles.chipDot} ${styles.chipDotPending}`}></span>
                  Pending <span className={styles.chipCount}>{pendingCount}</span>
                </button>
                <button
                  className={`${styles.chip} ${employerStatusFilter === 'APPROVED' ? styles.chipActive : ''}`}
                  onClick={() => setEmployerStatusFilter('APPROVED')}
                >
                  <span className={`${styles.chipDot} ${styles.chipDotApproved}`}></span>
                  Approved <span className={styles.chipCount}>{approvedCount}</span>
                </button>
                <button
                  className={`${styles.chip} ${employerStatusFilter === 'REJECTED' ? styles.chipActive : ''}`}
                  onClick={() => setEmployerStatusFilter('REJECTED')}
                >
                  <span className={`${styles.chipDot} ${styles.chipDotRejected}`}></span>
                  Rejected <span className={styles.chipCount}>{rejectedCount}</span>
                </button>
              </div>

              <select
                value={employerSort}
                onChange={(e) => setEmployerSort(e.target.value as any)}
                className={styles.sortSelect}
                aria-label="Sort employers by"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name">Sort: Company Name A-Z</option>
              </select>
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
                <span>Active filter: {employerStatusFilter || 'All'}</span>
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
                      const isApproving = approveMutation.isPending && approveMutation.variables === emp.id;
                      const isRejecting = rejectMutation.isPending && rejectMutation.variables === emp.id;
                      const isCopied = copiedId === emp.id;

                      return (
                        <tr key={emp.id} className={styles.tableRow}>
                          <td>
                            <div className={styles.companyCell}>
                              <CompanyAvatar 
                                name={emp.company_name || emp.user_name || emp.user_email} 
                                size={40} 
                              />
                              <div className={styles.companyMeta}>
                                <div className={styles.companyName}>
                                  {emp.company_name || 'Unnamed Company'}
                                </div>
                                <div className={styles.companyEmailRow}>
                                  <span className={styles.companyEmail}>{emp.user_email}</span>
                                  <button
                                    className={`${styles.copyBtn} ${isCopied ? styles.copySuccess : ''}`}
                                    onClick={(e) => handleCopyEmail(e, emp)}
                                    title="Copy email to clipboard"
                                  >
                                    {isCopied ? <FiCheck size={11} /> : <FiCopy size={11} />}
                                    <span>{isCopied ? 'Copied' : ''}</span>
                                  </button>
                                </div>
                                {(emp.headquarters || emp.company_size) && (
                                  <div className={styles.companySubMeta}>
                                    {emp.headquarters && <span>📍 {emp.headquarters}</span>}
                                    {emp.headquarters && emp.company_size && <span>•</span>}
                                    {emp.company_size && <span>👥 {emp.company_size}</span>}
                                  </div>
                                )}
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
                                title="Inspect company profile and details"
                              >
                                <FiEye size={13} />
                                <span>Inspect</span>
                              </button>

                              {emp.verification_status !== 'APPROVED' && (
                                <button
                                  className={styles.approveBtn}
                                  onClick={() => setConfirmAction({ type: 'approve', employer: emp })}
                                  disabled={isApproving || isRejecting}
                                  title="Approve employer to publish jobs"
                                >
                                  {isApproving ? <LoadingSpinner size="sm" /> : <FiCheck size={13} />}
                                  <span>Approve</span>
                                </button>
                              )}

                              {emp.verification_status !== 'REJECTED' && (
                                <button
                                  className={styles.rejectBtn}
                                  onClick={() => setConfirmAction({ type: 'reject', employer: emp })}
                                  disabled={isApproving || isRejecting}
                                  title="Reject employer verification"
                                >
                                  {isRejecting ? <LoadingSpinner size="sm" /> : <FiX size={13} />}
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
                placeholder="Search job title, company, location, department..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className={styles.searchInput}
              />
              {jobSearch && (
                <button className={styles.clearSearch} onClick={() => setJobSearch('')} title="Clear search">
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className={styles.controlsRight}>
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

              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className={styles.sortSelect}
                aria-label="Filter workplace or employment type"
              >
                <option value="">All Workplace Types</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-site</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="CONTRACT">Contract</option>
              </select>

              <select
                value={jobSort}
                onChange={(e) => setJobSort(e.target.value as any)}
                className={styles.sortSelect}
                aria-label="Sort jobs by"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="salary">Sort: Highest Salary</option>
                <option value="title">Sort: Title A-Z</option>
              </select>
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
              {(jobSearch || jobStatusFilter || jobTypeFilter) && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setJobSearch(''); setJobStatusFilter(''); setJobTypeFilter(''); }}
                  className={styles.resetFiltersBtn}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableHeaderInfo}>
                <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
                <span>Sorted by: {jobSort}</span>
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
                      <th className={styles.actionsHeader}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className={styles.tableRow}>
                        <td>
                          <div>
                            <div className={styles.jobTitle}>{job.title}</div>
                            <div className={styles.jobMetaRow}>
                              <span>{job.location || 'Remote / Unspecified'}</span>
                              {job.department && <span>• {job.department}</span>}
                            </div>
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
                            title="View public posting page in a new tab"
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
                  <span className={styles.breakdownLabel}>Approved & Live</span>
                  <span className={styles.breakdownValue}>{approvedCount}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotWarning}></span>
                  <span className={styles.breakdownLabel}>Pending Review Queue</span>
                  <span className={styles.breakdownValue}>{pendingCount}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.dotDanger}></span>
                  <span className={styles.breakdownLabel}>Rejected Applications</span>
                  <span className={styles.breakdownValue}>{rejectedCount}</span>
                </div>
              </div>
              {pendingCount > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setActiveTab('employers'); setEmployerStatusFilter('PENDING'); }}
                  className={styles.analyticsActionBtn}
                >
                  <FiClock size={14} />
                  <span>Review {pendingCount} Pending Employers</span>
                </Button>
              )}
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
                  <span className={styles.breakdownLabel}>Draft Postings</span>
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

            <div className={styles.analyticsCard}>
              <h3 className={styles.analyticsTitle}>
                <FiActivity className={styles.cardHeaderIcon} />
                <span>Backend Platform Infrastructure</span>
              </h3>
              <div className={styles.servicesGrid}>
                <div className={styles.serviceItem}>
                  <span className={styles.serviceName}>Auth & JWT</span>
                  <span className={styles.serviceStatus}>● Active</span>
                </div>
                <div className={styles.serviceItem}>
                  <span className={styles.serviceName}>Email Verification</span>
                  <span className={styles.serviceStatus}>● Enforced</span>
                </div>
                <div className={styles.serviceItem}>
                  <span className={styles.serviceName}>AI Resume Screening</span>
                  <span className={styles.serviceStatus}>● Operational</span>
                </div>
                <div className={styles.serviceItem}>
                  <span className={styles.serviceName}>Mailpit / SMTP</span>
                  <span className={styles.serviceStatus}>● Connected</span>
                </div>
              </div>
            </div>

            <div className={styles.analyticsCard}>
              <h3 className={styles.analyticsTitle}>
                <FiAlertCircle className={styles.cardHeaderIcon} />
                <span>Operational Guidelines</span>
              </h3>
              <div className={styles.guidelinesList}>
                <div className={styles.guidelineItem}>
                  <strong>Verification Gate:</strong>
                  <p>Employers must have verified emails and APPROVED admin status before publishing jobs.</p>
                </div>
                <div className={styles.guidelineItem}>
                  <strong>Applicant Privacy:</strong>
                  <p>Seeker resumes and vector embeddings are scoped strictly to the respective job openings.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* REDESIGNED INSPECT EMPLOYER MODAL */}
      {selectedEmployer && (
        <Modal
          open={!!selectedEmployer}
          onClose={() => setSelectedEmployer(null)}
          title="Employer Verification Dossier"
          maxWidth="620px"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalProfileHeader}>
              <CompanyAvatar
                name={selectedEmployer.company_name || selectedEmployer.user_name || selectedEmployer.user_email}
                size={54}
              />
              <div className={styles.modalProfileDetails}>
                <h3 className={styles.modalCompanyName}>
                  {selectedEmployer.company_name || 'Unnamed Company'}
                </h3>
                <div className={styles.modalEmailRow}>
                  <span className={styles.modalEmail}>{selectedEmployer.user_email}</span>
                  <button
                    className={`${styles.copyBtn} ${copiedId === selectedEmployer.id ? styles.copySuccess : ''}`}
                    onClick={(e) => handleCopyEmail(e, selectedEmployer)}
                  >
                    {copiedId === selectedEmployer.id ? <FiCheck size={11} /> : <FiCopy size={11} />}
                    <span>{copiedId === selectedEmployer.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <Tag variant={getStatusVariant(selectedEmployer.verification_status)}>
                {selectedEmployer.verification_status}
              </Tag>
            </div>

            <div className={styles.modalCardsGrid}>
              <div className={styles.modalStatCard}>
                <span className={styles.modalStatLabel}>
                  <FiGlobe size={12} />
                  <span>Company Website</span>
                </span>
                {selectedEmployer.website ? (
                  <a
                    href={selectedEmployer.website.startsWith('http') ? selectedEmployer.website : `https://${selectedEmployer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.modalStatLink}
                    title={selectedEmployer.website}
                  >
                    <span>{selectedEmployer.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    <FiExternalLink size={11} />
                  </a>
                ) : (
                  <span className={styles.mutedText}>Not provided</span>
                )}
              </div>

              <div className={styles.modalStatCard}>
                <span className={styles.modalStatLabel}>
                  <FiMapPin size={12} />
                  <span>Headquarters</span>
                </span>
                <span className={styles.modalStatValue}>
                  {selectedEmployer.headquarters || 'Not specified'}
                </span>
              </div>

              <div className={styles.modalStatCard}>
                <span className={styles.modalStatLabel}>
                  <FiUsers size={12} />
                  <span>Company Size</span>
                </span>
                <span className={styles.modalStatValue}>
                  {selectedEmployer.company_size || 'Not specified'}
                </span>
              </div>

              <div className={styles.modalStatCard}>
                <span className={styles.modalStatLabel}>
                  <FiClock size={12} />
                  <span>Registration</span>
                </span>
                <span className={styles.modalStatValue} title={formatDate(selectedEmployer.created_at)}>
                  {formatRelativeTime(selectedEmployer.created_at)}
                </span>
              </div>
            </div>

            <div className={styles.descriptionBox}>
              <h4 className={styles.descriptionTitle}>Company Overview</h4>
              <p className={styles.descriptionText}>
                {selectedEmployer.description || 'No description provided during registration.'}
              </p>
            </div>

            <div className={styles.modalChecklist}>
              <div className={styles.modalChecklistItem}>
                <FiCheckSquare className={styles.modalChecklistIcon} size={14} />
                <span>Email address verified via signed token</span>
              </div>
              <div className={styles.modalChecklistItem}>
                <FiCheckSquare className={styles.modalChecklistIcon} size={14} />
                <span>Company information submitted for review</span>
              </div>
              <div className={styles.modalChecklistItem}>
                <FiCheckSquare className={styles.modalChecklistIcon} size={14} />
                <span>Approval grants immediate access to publish open vacancies</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              {selectedEmployer.verification_status !== 'APPROVED' && (
                <Button
                  variant="primary"
                  onClick={() => handleApprove(selectedEmployer)}
                  loading={approveMutation.isPending}
                >
                  <FiCheck size={14} />
                  <span>Verify & Approve</span>
                </Button>
              )}
              {selectedEmployer.verification_status !== 'REJECTED' && (
                <Button
                  variant="danger"
                  onClick={() => handleReject(selectedEmployer)}
                  loading={rejectMutation.isPending}
                >
                  <FiX size={14} />
                  <span>Reject</span>
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
              ? `Are you sure you want to verify and approve "${confirmAction.employer.company_name || confirmAction.employer.user_email}"? They will immediately receive permissions to publish vacancies and review applicant resumes.`
              : `Are you sure you want to reject verification for "${confirmAction.employer.company_name || confirmAction.employer.user_email}"? They will not be permitted to publish jobs.`
          }
          confirmText={confirmAction.type === 'approve' ? 'Approve Employer' : 'Reject Employer'}
          variant={confirmAction.type === 'approve' ? 'primary' : 'danger'}
          loading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </div>
  );
}
