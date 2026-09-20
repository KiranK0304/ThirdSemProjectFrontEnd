import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Card, Tag, LoadingSpinner, ErrorState, ConfirmModal, CompanyAvatar } from '@/components/ui'
import { useSeekerApplication, useWithdrawApplication, useDecideOffer } from '@/hooks/queries/useApplicationQueries'
import { formatDate, formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType, formatStatus, getApplicationStatusVariant, getMediaUrl } from '@/utils/format'
import { extractApiError } from '@/api/utils'
import { FiArrowLeft, FiMapPin, FiBriefcase, FiFileText, FiDownload, FiExternalLink, FiClock, FiAlertTriangle, FiCheckCircle, FiAward } from 'react-icons/fi'
import styles from './ApplicationDetail.module.css'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: application, isLoading, error, refetch } = useSeekerApplication(Number(id))
  const withdrawMutation = useWithdrawApplication()
  const decideMutation = useDecideOffer()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [decisionFeedback, setDecisionFeedback] = useState('')

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

  const handleAcceptOffer = async () => {
    setDecisionFeedback('')
    try {
      await decideMutation.mutateAsync({
        applicationId: Number(id),
        decision: 'ACCEPTED',
      })
      setDecisionFeedback('Congratulations! You have accepted the job offer.')
      refetch()
    } catch (err) {
      setDecisionFeedback(extractApiError(err))
    }
  }

  const handleDeclineOffer = async () => {
    setDecisionFeedback('')
    try {
      await decideMutation.mutateAsync({
        applicationId: Number(id),
        decision: 'DECLINED',
        decline_reason: declineReason.trim() || undefined,
      })
      setShowDeclineModal(false)
      refetch()
    } catch (err) {
      setDecisionFeedback(extractApiError(err))
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
          {/* Official Job Offer Card */}
          {application.offer && (
            <Card
              className={styles.card}
              style={{
                border: '1.5px solid var(--color-accent, #d97706)',
                background: 'rgba(217, 119, 6, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent, #d97706)', fontWeight: 700 }}>
                    Official Employment Offer
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 2px', color: 'var(--color-text-primary)' }}>
                    {application.offer.job_title || job?.title}
                  </h2>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Offered by <strong>{companyName}</strong> on {formatDate(application.offer.created_at)}
                  </span>
                </div>
                <Tag
                  variant={
                    application.offer.status === 'ACCEPTED'
                      ? 'success'
                      : application.offer.status === 'DECLINED'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {application.offer.status === 'PENDING' ? 'Action Required' : `Offer ${application.offer.status}`}
                </Tag>
              </div>

              {/* Offer Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface, #141414)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>Base Compensation</span>
                  <strong style={{ fontSize: '16px', color: 'var(--color-accent, #d97706)' }}>{application.offer.base_salary}</strong>
                </div>

                {application.offer.bonus && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface, #141414)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>Bonus / Incentive</span>
                    <strong style={{ fontSize: '14.5px', color: 'var(--color-text-primary)' }}>{application.offer.bonus}</strong>
                  </div>
                )}

                {application.offer.equity && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface, #141414)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>Stock / Equity</span>
                    <strong style={{ fontSize: '14.5px', color: 'var(--color-text-primary)' }}>{application.offer.equity}</strong>
                  </div>
                )}

                {application.offer.start_date && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface, #141414)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>Anticipated Start Date</span>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{formatDate(application.offer.start_date)}</strong>
                  </div>
                )}

                {application.offer.expiration_date && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface, #141414)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '4px' }}>Offer Expiration</span>
                    <strong style={{ fontSize: '14px', color: '#f87171' }}>{formatDate(application.offer.expiration_date)}</strong>
                  </div>
                )}
              </div>

              {application.offer.additional_terms && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                    Benefits & Special Terms
                  </h4>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface, #141414)', border: '1px solid var(--color-border, rgba(255,255,255,0.06))', fontSize: '13px', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {application.offer.additional_terms}
                  </div>
                </div>
              )}

              {/* Offer Decision Actions */}
              {application.offer.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.08))' }}>
                  <Button
                    variant="primary"
                    onClick={handleAcceptOffer}
                    loading={decideMutation.isPending}
                    style={{ background: '#059669', borderColor: '#059669' }}
                  >
                    <FiCheckCircle size={14} />
                    <span>Accept Job Offer</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeclineModal(true)}
                    disabled={decideMutation.isPending}
                    style={{ color: 'var(--color-danger, #f87171)' }}
                  >
                    Decline Offer
                  </Button>
                </div>
              )}

              {application.offer.status === 'ACCEPTED' && (
                <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.3)', color: '#10b981', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCheckCircle size={16} />
                  <span>You accepted this offer on {application.offer.responded_at ? formatDate(application.offer.responded_at) : 'recently'}. Congratulations on your new role!</span>
                </div>
              )}

              {application.offer.status === 'DECLINED' && (
                <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', fontSize: '13px' }}>
                  You declined this offer on {application.offer.responded_at ? formatDate(application.offer.responded_at) : 'recently'}.
                  {application.offer.decline_reason && ` Reason: "${application.offer.decline_reason}"`}
                </div>
              )}

              {decisionFeedback && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-accent, #d97706)' }}>
                  {decisionFeedback}
                </div>
              )}
            </Card>
          )}

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

          {/* Rejection Note / Employer Feedback */}
          {application.status === 'REJECTED' && application.rejection_note && (
            <Card className={styles.card}>
              <h2 className={styles.sectionHeading}>Feedback from Employer</h2>
              <div className={styles.coverLetterBox}>
                <p className={styles.coverLetterText}>{application.rejection_note}</p>
              </div>
            </Card>
          )}

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

      <ConfirmModal
        open={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onConfirm={handleDeclineOffer}
        title="Decline Employment Offer"
        description={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span>Are you sure you wish to decline this employment offer from <strong>{companyName}</strong>?</span>
            <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Optional Reason / Feedback:
            </label>
            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Accepted another position, compensation expectations, etc."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border, #333)', background: 'var(--color-surface, #1e1e1e)', color: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>
        }
        confirmText="Decline Offer"
        cancelText="Keep Reviewing"
        variant="danger"
        loading={decideMutation.isPending}
      />
    </div>
  )
}

