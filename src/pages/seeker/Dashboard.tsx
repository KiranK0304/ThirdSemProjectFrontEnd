import React from 'react'
import { Link } from 'react-router-dom'
import { Button, LoadingSpinner, CompanyAvatar, Tag } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useSeekerApplications, useSeekerAppliedMap } from '@/hooks/queries/useApplicationQueries'
import { useJobs, useSavedJobs, useSaveJob, useUnsaveJob } from '@/hooks/queries/useJobQueries'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType } from '@/utils/format'
import {
  FiBriefcase,
  FiMapPin,
  FiFileText,
  FiClock,
  FiCalendar,
  FiStar,
  FiBookmark,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi'
import type { Job } from '@/api/types'
import styles from './Dashboard.module.css'

export default function SeekerDashboard() {
  const { user } = useAuth()

  const { applications, isApplied, isLoading: isLoadingApps } = useSeekerAppliedMap()
  const { data: jobsData, isLoading: isLoadingJobs } = useJobs({ ordering: '-created_at' })
  const { data: savedJobs = [], isLoading: isLoadingSaved } = useSavedJobs()
  const saveJob = useSaveJob()
  const unsaveJob = useUnsaveJob()

  const latestJobs: Job[] = Array.isArray(jobsData)
    ? jobsData
    : (jobsData as any)?.results || []

  const isSaved = (jobId: number) => savedJobs.some((s) => s.job.id === jobId)

  const toggleSave = (e: React.MouseEvent, jobId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (isSaved(jobId)) {
      unsaveJob.mutate(jobId)
    } else {
      saveJob.mutate(jobId)
    }
  }

  if (isLoadingApps || isLoadingJobs || isLoadingSaved) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Calculate stats
  const totalApps = applications.length
  const inReview = applications.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').length
  const shortlisted = applications.filter((a) => a.status === 'SHORTLISTED').length
  const offers = applications.filter((a) => a.status === 'OFFERED').length

  const firstName = user?.name?.split(' ')[0] || 'there'

  // Check if a job was posted recently (within 2 days)
  const isNew = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    return diff < 2 * 24 * 60 * 60 * 1000
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* ── HERO WELCOME BANNER ── */}
      <div className={styles.heroCard}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Candidate Workspace</span>
          <h1 className={styles.heroGreeting}>
            Welcome back, <span className={styles.accent}>{firstName}</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Track your pipeline, monitor active applications, and explore the newest verified career opportunities.
          </p>
          <div className={styles.heroActions}>
            <Link to="/jobs">
              <Button variant="primary">
                <span>Browse All Jobs</span>
                <FiArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/seeker/applications">
              <Button variant="secondary">My Applications ({totalApps})</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN MAIN GRID ── */}
      <div className={styles.dashboardGrid}>
        {/* ── LEFT / MAIN COLUMN: LATEST JOBS ── */}
        <div className={styles.mainColumn}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Latest Open Roles</h2>
                <p className={styles.cardSubtitle}>
                  Freshly posted opportunities ready for your application.
                </p>
              </div>
              <Link to="/jobs" className={styles.viewAllLink}>
                <span>View all</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            <div className={styles.jobsList}>
              {latestJobs.length === 0 ? (
                <div className={styles.emptyStateBox}>
                  <FiBriefcase size={32} className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>No open jobs right now</p>
                  <p className={styles.emptySubtitle}>Check back soon for new postings.</p>
                </div>
              ) : (
                latestJobs.slice(0, 6).map((job) => {
                  const companyName = job.employer?.company_name || 'Hiring Company'
                  const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')
                  const saved = isSaved(job.id)
                  const applied = isApplied(job.id)

                  return (
                    <Link
                      to={`/jobs/${job.id}`}
                      key={job.id}
                      className={styles.jobRow}
                    >
                      <div className={styles.jobMain}>
                        <CompanyAvatar name={companyName} size={44} />
                        <div className={styles.jobInfo}>
                          <div className={styles.jobTitleRow}>
                            <h3 className={styles.jobTitle}>{job.title}</h3>
                            {applied && (
                              <span className={styles.appliedBadge}>
                                <FiCheckCircle size={11} />
                                <span>Applied</span>
                              </span>
                            )}
                            {!applied && isNew(job.created_at) && (
                              <span className={styles.newBadge}>NEW</span>
                            )}
                          </div>
                          <div className={styles.jobMetaRow}>
                            <span className={styles.companyText}>{companyName}</span>
                            <span className={styles.metaDot}>•</span>
                            <span className={styles.locationText}>
                              <FiMapPin size={12} />
                              <span>{job.location || 'Remote'}</span>
                            </span>
                          </div>
                          <div className={styles.jobPills}>
                            <Tag variant="neutral">
                              {formatEmploymentType(job.employment_type)}
                            </Tag>
                            {salaryText && (
                              <Tag variant="neutral">{salaryText}</Tag>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={styles.jobRight}>
                        <span className={styles.timeAgo}>
                          {formatRelativeTime(job.created_at)}
                        </span>
                        <button
                          className={`${styles.bookmarkBtn} ${saved ? styles.bookmarkBtnActive : ''}`}
                          onClick={(e) => toggleSave(e, job.id)}
                          title={saved ? 'Remove from saved' : 'Save role'}
                          type="button"
                          aria-label={saved ? 'Unsave job' : 'Save job'}
                        >
                          <FiBookmark fill={saved ? 'currentColor' : 'none'} size={17} />
                        </button>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT / SIDE COLUMN: STATS & SAVED JOBS ── */}
        <div className={styles.sideColumn}>
          {/* Application Overview Metrics */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Application Status</h2>
              <Link to="/seeker/applications" className={styles.viewAllLink}>
                <span>Manage</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={`${styles.statIconBox} ${styles.statApplications}`}>
                  <FiFileText size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>{totalApps}</span>
                  <span className={styles.statLabel}>Total Applied</span>
                </div>
              </div>

              <div className={styles.statBox}>
                <div className={`${styles.statIconBox} ${styles.statReview}`}>
                  <FiClock size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>{inReview}</span>
                  <span className={styles.statLabel}>In Review</span>
                </div>
              </div>

              <div className={styles.statBox}>
                <div className={`${styles.statIconBox} ${styles.statShortlisted}`}>
                  <FiCalendar size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>{shortlisted}</span>
                  <span className={styles.statLabel}>Shortlisted</span>
                </div>
              </div>

              <div className={styles.statBox}>
                <div className={`${styles.statIconBox} ${styles.statOffers}`}>
                  <FiStar size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>{offers}</span>
                  <span className={styles.statLabel}>Job Offers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Jobs Widget */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Saved Jobs ({savedJobs.length})</h2>
              <Link to="/seeker/saved-jobs" className={styles.viewAllLink}>
                <span>View all</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            {savedJobs.length === 0 ? (
              <div className={styles.emptySideBox}>
                <FiBookmark size={24} className={styles.emptyIcon} />
                <p className={styles.emptySideText}>No saved jobs yet.</p>
                <Link to="/jobs">
                  <Button variant="ghost" size="sm">Explore roles to save</Button>
                </Link>
              </div>
            ) : (
              <div className={styles.savedList}>
                {savedJobs.slice(0, 4).map((saved) => {
                  const companyName = saved.job.employer?.company_name || 'Hiring Company'
                  const applied = isApplied(saved.job.id)

                  return (
                    <Link
                      to={`/jobs/${saved.job.id}`}
                      key={saved.id}
                      className={styles.savedRow}
                    >
                      <CompanyAvatar name={companyName} size={36} />
                      <div className={styles.savedInfo}>
                        <div className={styles.savedTitleRow}>
                          <h4 className={styles.savedTitle}>{saved.job.title}</h4>
                          {applied && <span className={styles.savedAppliedBadge}>Applied</span>}
                        </div>
                        <span className={styles.savedMeta}>
                          {companyName} {saved.job.location ? `• ${saved.job.location}` : ''}
                        </span>
                      </div>
                      <span className={styles.savedActiveMark}>
                        <FiBookmark fill="currentColor" size={15} />
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

