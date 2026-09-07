import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Tag, EmptyState, ErrorState, LoadingSpinner, Button, CompanyAvatar } from '@/components/ui'
import { useSeekerApplications } from '@/hooks/queries/useApplicationQueries'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType, formatStatus, getApplicationStatusVariant } from '@/utils/format'
import { FiArrowRight, FiBriefcase, FiMapPin, FiClock } from 'react-icons/fi'
import styles from './Applications.module.css'

type FilterTab = 'ALL' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'OFFERED' | 'ARCHIVED'

export default function Applications() {
  const navigate = useNavigate()
  const { data: applications = [], isLoading, isError, error, refetch } = useSeekerApplications()
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')

  const filteredApplications = useMemo(() => {
    if (activeTab === 'ALL') return applications
    if (activeTab === 'UNDER_REVIEW') {
      return applications.filter((app: any) => app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW')
    }
    if (activeTab === 'ARCHIVED') {
      return applications.filter((app: any) => app.status === 'REJECTED' || app.status === 'WITHDRAWN')
    }
    return applications.filter((app: any) => app.status === activeTab)
  }, [applications, activeTab])

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
          message={error instanceof Error ? error.message : 'Failed to load applications.'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: applications.length },
    {
      id: 'UNDER_REVIEW',
      label: 'In Review',
      count: applications.filter((a: any) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length,
    },
    {
      id: 'SHORTLISTED',
      label: 'Shortlisted',
      count: applications.filter((a: any) => a.status === 'SHORTLISTED').length,
    },
    {
      id: 'OFFERED',
      label: 'Hired / Offer',
      count: applications.filter((a: any) => a.status === 'OFFERED').length,
    },
    {
      id: 'ARCHIVED',
      label: 'Archived',
      count: applications.filter((a: any) => a.status === 'REJECTED' || a.status === 'WITHDRAWN').length,
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Applications</h1>
          <p className={styles.subtitle}>
            Monitor your interview stages, review feedback, and track your active job submissions.
          </p>
        </div>
        <Link to="/jobs">
          <Button variant="secondary" size="sm">
            <span>Find New Roles</span>
            <FiArrowRight size={14} />
          </Button>
        </Link>
      </div>

      {applications.length > 0 && (
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTabBtn : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <span className={styles.tabBadge}>{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {filteredApplications.length === 0 ? (
        <div className={styles.emptyCard}>
          <EmptyState
            title={applications.length === 0 ? 'No applications submitted' : 'No matching applications'}
            description={
              applications.length === 0
                ? 'You have not submitted any applications yet. Discover open opportunities and apply today!'
                : `There are currently no applications under the "${activeTab}" filter.`
            }
            action={
              applications.length === 0 ? (
                <Button variant="primary" onClick={() => navigate('/jobs')}>
                  <span>Browse Jobs</span>
                  <FiArrowRight size={14} />
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setActiveTab('ALL')}>
                  Show All Applications
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className={styles.list}>
          {filteredApplications.map((app: any) => {
            const companyName = app.job?.employer?.company_name || 'Hiring Company'
            const salary = formatSalary(app.job?.salary_min, app.job?.salary_max, app.job?.salary_currency)

            return (
              <Card
                key={app.id}
                clickable
                onClick={() => navigate(`/seeker/applications/${app.id}`)}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <CompanyAvatar name={companyName} size={48} />
                  <div className={styles.mainInfo}>
                    <div className={styles.titleRow}>
                      <h2 className={styles.jobTitle}>{app.job?.title}</h2>
                      <Tag variant={getApplicationStatusVariant(app.status)}>
                        {formatStatus(app.status)}
                      </Tag>
                    </div>
                    <div className={styles.companyMeta}>
                      <span className={styles.companyName}>{companyName}</span>
                      {app.job?.location && (
                        <>
                          <span className={styles.metaDot}>•</span>
                          <span className={styles.metaItem}>
                            <FiMapPin size={12} />
                            <span>{app.job.location}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.tags}>
                    {app.job?.employment_type && (
                      <Tag variant="neutral">
                        {formatEmploymentType(app.job.employment_type)}
                      </Tag>
                    )}
                    {salary && <Tag variant="neutral">{salary}</Tag>}
                  </div>

                  <div className={styles.footerMeta}>
                    <span className={styles.date}>
                      <FiClock size={12} />
                      <span>Applied {formatRelativeTime(app.created_at)}</span>
                    </span>
                    <span className={styles.viewLink}>
                      <span>View Details</span>
                      <FiArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

