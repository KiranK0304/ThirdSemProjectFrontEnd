import { useNavigate, Link } from 'react-router-dom'
import { Card, EmptyState, ErrorState, LoadingSpinner, Tag, CompanyAvatar, Button } from '@/components/ui'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { useAuth } from '@/context/AuthContext'
import { useSavedJobs } from '@/hooks/queries/useJobQueries'
import { useSeekerAppliedMap } from '@/hooks/queries/useApplicationQueries'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType } from '@/utils/format'
import { FiBookmark, FiMapPin, FiArrowRight } from 'react-icons/fi'
import styles from './SavedJobs.module.css'

export default function SavedJobs() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isApplied } = useSeekerAppliedMap(user?.account_type === 'SEEKER')
  const { data: savedJobs = [], isLoading, isError, error, refetch } = useSavedJobs()

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

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
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Saved Jobs</h1>
          <p className={styles.subtitle}>
            Keep track of roles you're interested in and apply when you're ready.
          </p>
        </div>
        {savedJobs.length > 0 && (
          <Link to="/jobs">
            <Button variant="secondary" size="sm">
              <span>Find More Roles</span>
              <FiArrowRight size={14} />
            </Button>
          </Link>
        )}
      </div>

      {savedJobs.length === 0 ? (
        <div className={styles.emptyCard}>
          <EmptyState
            title="No saved jobs yet"
            description="Explore open roles on Hirely and bookmark the ones you want to apply for later."
            action={
              <Button variant="primary" onClick={() => navigate('/jobs')}>
                <span>Browse Open Jobs</span>
                <FiArrowRight size={14} />
              </Button>
            }
          />
        </div>
      ) : (
        <div className={styles.list}>
          {savedJobs.map((savedJob) => {
            const { job } = savedJob
            const companyName = job.employer?.company_name || 'Hiring Company'
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')

            return (
              <Card
                key={savedJob.id}
                clickable
                className={styles.jobCard}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className={styles.cardTop}>
                  <CompanyAvatar name={companyName} size={48} />
                  <div className={styles.jobDetails}>
                    <div className={styles.titleRow}>
                      <h2 className={styles.jobTitle}>{job.title}</h2>
                      <SaveJobButton jobId={job.id} stopPropagation />
                    </div>
                    <div className={styles.companyMeta}>
                      <span className={styles.companyName}>{companyName}</span>
                      {job.location && (
                        <>
                          <span className={styles.metaDot}>•</span>
                          <span className={styles.location}>
                            <FiMapPin size={12} />
                            <span>{job.location}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.tags}>
                    {isApplied(job.id) && <Tag variant="success">Applied</Tag>}
                    <Tag variant="neutral">{formatEmploymentType(job.employment_type)}</Tag>
                    {salary && <Tag variant="neutral">{salary}</Tag>}
                  </div>
                  <span className={styles.savedDate}>
                    Saved {formatRelativeTime(savedJob.created_at)}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
