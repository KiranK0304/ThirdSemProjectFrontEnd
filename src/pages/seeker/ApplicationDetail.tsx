import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Card, Tag, Modal, LoadingSpinner, ErrorState } from '@/components/ui'
import { useSeekerApplication, useWithdrawApplication } from '@/hooks/queries/useApplicationQueries'
import { formatDate, formatSalary } from '@/utils/date'
import { formatEmploymentType, formatStatus, getApplicationStatusVariant } from '@/utils/format'
import { extractApiError } from '@/api/utils'
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
      navigate('/seeker/applications')
    } catch (err) {
      setWithdrawError(extractApiError(err))
    }
  }

  if (isLoading) {
    return (
      <div className={styles.center}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !application) {
    return <ErrorState message="Failed to load application" onRetry={refetch} />
  }

  const job = application.job
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency)

  return (
    <div className={styles.page}>
      <Link to="/seeker/applications" className={styles.backLink}>← Back to applications</Link>

      <h1>{job.title}</h1>

      <Card>
        <div className={styles.statusRow}>
          <Tag variant={getApplicationStatusVariant(application.status)}>
            {formatStatus(application.status)}
          </Tag>
        </div>

        <div className={styles.meta}>
          <p className={styles.company}>
            {job.employer.company_name}
            {job.employer.website && (
              <> · <a href={job.employer.website} target="_blank" rel="noopener noreferrer" className={styles.link}>{job.employer.website}</a></>
            )}
          </p>
          <div className={styles.tags}>
            <Tag variant="neutral">{formatEmploymentType(job.employment_type)}</Tag>
            {job.location && <Tag variant="neutral">{job.location}</Tag>}
            {salary && <Tag variant="amber">{salary}</Tag>}
          </div>
        </div>

        {application.cover_letter && (
          <div className={styles.section}>
            <h3>Cover Letter</h3>
            <p className={styles.body}>{application.cover_letter}</p>
          </div>
        )}

        {application.resume && (
          <div className={styles.section}>
            <h3>Attached Resume</h3>
            <p className={styles.body}>
              {application.resume.title} ·{' '}
              <a href={application.resume.file_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Download
              </a>
            </p>
          </div>
        )}

        <div className={styles.dates}>
          <span>Applied on {formatDate(application.created_at)}</span>
          <span>Last updated {formatDate(application.updated_at)}</span>
        </div>
      </Card>

      <div className={styles.actions}>
        <Link to={`/jobs/${job.id}`}>
          <Button variant="secondary">View Job Posting</Button>
        </Link>
        <Button variant="ghost" onClick={() => setShowWithdrawModal(true)}>
          Withdraw Application
        </Button>
      </div>

      <Modal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw application?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleWithdraw}
              loading={withdrawMutation.isPending}
            >
              Withdraw
            </Button>
          </>
        }
      >
        <p>This will permanently withdraw your application for <strong>{job.title}</strong>. This cannot be undone.</p>
        {withdrawError && <p className={styles.error}>{withdrawError}</p>}
      </Modal>
    </div>
  )
}
