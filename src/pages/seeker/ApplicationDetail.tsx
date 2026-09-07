import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Card, Tag, LoadingSpinner, ErrorState, ConfirmModal, CompanyAvatar } from '@/components/ui'
import { useSeekerApplication, useWithdrawApplication } from '@/hooks/queries/useApplicationQueries'
import { formatDate, formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType, formatStatus, getApplicationStatusVariant, getMediaUrl } from '@/utils/format'
import { extractApiError } from '@/api/utils'
import { FiArrowLeft, FiMapPin, FiBriefcase, FiFileText, FiDownload, FiExternalLink, FiClock, FiAlertTriangle } from 'react-icons/fi'
import styles from './ApplicationDetail.module.css'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: application, isLoading, error, refetch } = useSeekerApplication(Number(id))
  const withdrawMutation = useWithdrawApplication()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')

  const handleWithdraw = async () => {
    setWithdrawError('')
    try {
      await withdrawMutation.mutateAsync(Number(id))
      setShowWithdrawModal(false)
      navigate('/seeker/applications')
    } catch (err) {
      setWithdrawError(extractApiError(err))
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className={styles.container}>
        <ErrorState
          message="Failed to load application details."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const job = application.job
  const companyName = job?.employer?.company_name || 'Hiring Company'
  const salary = formatSalary(job?.salary_min, job?.salary_max, job?.salary_currency)
  const canWithdraw = application.status !== 'WITHDRAWN' && application.status !== 'REJECTED' && application.status !== 'OFFERED'

  return (
    <div className={styles.container}>
      <Link to="/seeker/applications" className={styles.backLink}>
        <FiArrowLeft size={16} />
        <span>Back to Applications</span>
      </Link>

      <div className={styles.header}>
        <div className={styles.headerCompany}>
          <CompanyAvatar name={companyName} size={56} />
          <div>
            <h1 className={styles.jobTitle}>{job?.title}</h1>
            <div className={styles.companyMeta}>
              <span className={styles.companyName}>{companyName}</span>
              {job?.location && (
                <>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaLocation}>
                    <FiMapPin size={13} />
                    <span>{job.location}</span>
                  </span>
                </>
              )}
              {job?.employer?.website && (
                <>
                  <span className={styles.metaDot}>•</span>
                  <a
                    href={job.employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.companySiteLink}
                  >
                    <span>Website</span>
                    <FiExternalLink size={12} />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.statusBadgeWrapper}>
          <Tag variant={getApplicationStatusVariant(application.status)}>
            {formatStatus(application.status)}
          </Tag>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainCol}>
          {/* Status Timeline / Details Card */}
          <Card className={styles.card}>
            <h2 className={styles.sectionHeading}>Application Status</h2>
            <div className={styles.statusCardInner}>
              <div className={styles.currentStatusRow}>
                <div>
                  <div className={styles.currentStatusLabel}>Current State</div>
                  <div className={styles.currentStatusText}>{formatStatus(application.status)}</div>
                </div>
                <Tag variant={getApplicationStatusVariant(application.status)}>
                  {formatStatus(application.status)}
                </Tag>
              </div>

              <div className={styles.datesRow}>
                <div className={styles.dateBlock}>
                  <FiClock size={14} className={styles.dateIcon} />
                  <div>
                    <span className={styles.dateLabel}>Applied on</span>
                    <span className={styles.dateValue}>{formatDate(application.created_at)}</span>
                  </div>
                </div>
                <div className={styles.dateBlock}>
                  <FiClock size={14} className={styles.dateIcon} />
                  <div>
                    <span className={styles.dateLabel}>Last updated</span>
                    <span className={styles.dateValue}>{formatDate(application.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Cover Letter */}
          {application.cover_letter && (
            <Card className={styles.card}>
              <h2 className={styles.sectionHeading}>Cover Letter / Note</h2>
              <div className={styles.coverLetterBox}>
                <p className={styles.coverLetterText}>{application.cover_letter}</p>
              </div>
            </Card>
          )}

          {/* Attached Resume */}
          {application.resume && (
            <Card className={styles.card}>
              <h2 className={styles.sectionHeading}>Submitted Resume</h2>
              <div className={styles.resumeItem}>
                <div className={styles.resumeInfo}>
                  <div className={styles.resumeIcon}>
                    <FiFileText size={20} />
                  </div>
                  <div>
                    <div className={styles.resumeTitle}>{application.resume.title || 'Candidate Resume'}</div>
                    <div className={styles.resumeMeta}>
                      Uploaded {formatRelativeTime(application.resume.created_at)}
                    </div>
                  </div>
                </div>
                <a
                  href={getMediaUrl(application.resume.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadResumeBtn}
                >
                  <FiDownload size={14} />
                  <span>Download Resume</span>
                </a>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Info & Actions */}
        <div className={styles.sideCol}>
          <Card className={styles.card}>
            <h3 className={styles.sideCardTitle}>Role Details</h3>
            <div className={styles.sideDetailList}>
              <div className={styles.sideDetailItem}>
                <span className={styles.sideDetailLabel}>Employment Type</span>
                <span className={styles.sideDetailValue}>
                  {formatEmploymentType(job?.employment_type)}
                </span>
              </div>
              {salary && (
                <div className={styles.sideDetailItem}>
                  <span className={styles.sideDetailLabel}>Compensation</span>
                  <span className={styles.sideDetailValue}>{salary}</span>
                </div>
              )}
              {job?.location && (
                <div className={styles.sideDetailItem}>
                  <span className={styles.sideDetailLabel}>Location</span>
                  <span className={styles.sideDetailValue}>{job.location}</span>
                </div>
              )}
            </div>

            <div className={styles.sideActions}>
              <Link to={`/jobs/${job?.id}`} className={styles.fullWidthLink}>
                <Button variant="secondary" className={styles.fullWidthBtn}>
                  <span>View Full Job Posting</span>
                  <FiExternalLink size={14} />
                </Button>
              </Link>

              {canWithdraw && (
                <Button
                  variant="ghost"
                  className={`${styles.withdrawBtn} ${styles.fullWidthBtn}`}
                  onClick={() => setShowWithdrawModal(true)}
                >
                  Withdraw Application
                </Button>
              )}
            </div>

            {withdrawError && (
              <div className={styles.errorAlert}>
                <FiAlertTriangle size={14} />
                <span>{withdrawError}</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onConfirm={handleWithdraw}
        title="Withdraw Application?"
        description={`Are you sure you want to withdraw your application for "${job?.title}" at ${companyName}? This action cannot be reversed.`}
        confirmText="Withdraw Application"
        cancelText="Keep Application"
        variant="danger"
        loading={withdrawMutation.isPending}
      />
    </div>
  )
}

