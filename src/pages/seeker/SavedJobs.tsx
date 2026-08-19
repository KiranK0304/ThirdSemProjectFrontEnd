import { useNavigate } from 'react-router-dom'
import { Card, EmptyState, ErrorState, LoadingSpinner, Tag } from '@/components/ui'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { useSavedJobs } from '@/hooks/queries/useJobQueries'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType } from '@/utils/format'
import styles from './SavedJobs.module.css'

export default function SavedJobs() {
  const navigate = useNavigate()
  const { data: savedJobs = [], isLoading, isError, error, refetch } = useSavedJobs()

  if (isLoading) return <div className={styles.container}><LoadingSpinner /></div>

  if (isError) {
    return (
      <div className={styles.container}>
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load saved jobs'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.heading}>
        <div>
          <h1>Saved Jobs</h1>
          <p>Keep roles here so you can return and apply when you are ready.</p>
        </div>
      </div>

      {savedJobs.length === 0 ? (
        <EmptyState
          title="No saved jobs yet"
          description="Browse open roles and save the ones you want to revisit."
        />
      ) : (
        <div className={styles.list}>
          {savedJobs.map((savedJob) => {
            const { job } = savedJob
            return (
              <Card
                key={savedJob.id}
                clickable
                className={styles.jobCard}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <h2>{job.title}</h2>
                    <p>{job.employer?.company_name}</p>
                  </div>
                  <SaveJobButton jobId={job.id} stopPropagation />
                </div>
                <div className={styles.tags}>
                  <Tag variant="neutral">{formatEmploymentType(job.employment_type)}</Tag>
                  {job.location && <Tag variant="neutral">{job.location}</Tag>}
                  {(job.salary_min || job.salary_max) && (
                    <Tag variant="amber">
                      {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </Tag>
                  )}
                </div>
                <span className={styles.meta}>
                  Saved {formatRelativeTime(savedJob.created_at)}
                </span>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
