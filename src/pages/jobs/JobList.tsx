import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Input, Select, Tag, Button, EmptyState, ErrorState, LoadingSpinner, CompanyAvatar } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useJobs } from '@/hooks/queries/useJobQueries'
import { useSeekerAppliedMap } from '@/hooks/queries/useApplicationQueries'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType } from '@/utils/format'
import { FiSearch, FiMapPin, FiFilter, FiRotateCcw, FiArrowRight, FiBriefcase } from 'react-icons/fi'
import styles from './JobList.module.css'

export default function JobList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isApplied } = useSeekerAppliedMap(user?.account_type === 'SEEKER')

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    employment_type: searchParams.get('employment_type') || '',
    location: searchParams.get('location') || '',
    salary_min: searchParams.get('salary_min') || '',
    sort: searchParams.get('sort') || '-created_at',
  })

  // sync filters when url changes
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      employment_type: searchParams.get('employment_type') || '',
      location: searchParams.get('location') || '',
      salary_min: searchParams.get('salary_min') || '',
      sort: searchParams.get('sort') || '-created_at',
    })
  }, [searchParams])

  const { data, isLoading, isError, error, refetch } = useJobs({
    search: searchParams.get('search') || undefined,
    employment_type: searchParams.get('employment_type') || undefined,
    location: searchParams.get('location') || undefined,
    min_salary: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min') as string) : undefined,
    ordering: searchParams.get('sort') || undefined,
  })

  const jobs = Array.isArray(data) ? data : []

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams()
    if (filters.search) newParams.set('search', filters.search)
    if (filters.employment_type) newParams.set('employment_type', filters.employment_type)
    if (filters.location) newParams.set('location', filters.location)
    if (filters.salary_min) newParams.set('salary_min', filters.salary_min)
    if (filters.sort !== '-created_at') newParams.set('sort', filters.sort)
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      employment_type: '',
      location: '',
      salary_min: '',
      sort: '-created_at',
    })
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.employment_type || filters.location || filters.salary_min || filters.sort !== '-created_at'
  )

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Find Open Positions</h1>
          <p className={styles.subtitle}>
            Explore thousands of verified roles across high-growth startups and tech leaders.
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Filters Sidebar */}
        <aside className={styles.filtersSidebar}>
          <div className={styles.filtersCard}>
            <div className={styles.filtersCardHeader}>
              <div className={styles.filtersCardTitle}>
                <FiFilter size={16} />
                <span>Filter Roles</span>
              </div>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className={styles.resetFiltersBtn}>
                  <FiRotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <form onSubmit={applyFilters} className={styles.filtersForm}>
              <Input
                label="Search Keyword"
                placeholder="Job title, skills, keywords..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />

              <Select
                label="Employment Type"
                value={filters.employment_type}
                onChange={(e) => handleFilterChange('employment_type', e.target.value)}
                options={[
                  { value: '', label: 'All Employment Types' },
                  { value: 'FULL_TIME', label: 'Full Time' },
                  { value: 'PART_TIME', label: 'Part Time' },
                  { value: 'CONTRACT', label: 'Contract' },
                  { value: 'INTERNSHIP', label: 'Internship' },
                  { value: 'TEMPORARY', label: 'Temporary' },
                  { value: 'FREELANCE', label: 'Freelance' },
                ]}
              />

              <Input
                label="Location"
                placeholder="City, state, or remote..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />

              <Input
                label="Minimum Salary (USD)"
                type="number"
                placeholder="e.g. 80000"
                value={filters.salary_min}
                onChange={(e) => handleFilterChange('salary_min', e.target.value)}
              />

              <Select
                label="Sort Order"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                options={[
                  { value: '-created_at', label: 'Newest Posted' },
                  { value: 'created_at', label: 'Oldest' },
                  { value: '-salary_max', label: 'Highest Salary' },
                  { value: 'salary_min', label: 'Lowest Salary' },
                ]}
              />

              <div className={styles.filterActions}>
                <Button type="submit" variant="primary" className={styles.fullWidthBtn}>
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button type="button" variant="ghost" className={styles.fullWidthBtn} onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </form>
          </div>
        </aside>

        {/* Jobs List Main Content */}
        <main className={styles.jobsMain}>
          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              {isLoading ? 'Searching positions...' : `Showing ${jobs.length} position${jobs.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {isLoading && (
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="lg" />
            </div>
          )}

          {isError && (
            <ErrorState
              message={error instanceof Error ? error.message : 'Failed to load jobs.'}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && jobs.length === 0 && (
            <div className={styles.emptyCard}>
              <EmptyState
                title="No matching jobs found"
                description="Try tweaking your keyword searches, removing salary constraints, or selecting all employment types."
                action={
                  hasActiveFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Reset Filters
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}

          {!isLoading && !isError && jobs.length > 0 && (
            <div className={styles.jobsGrid}>
              {jobs.map((job: any) => {
                const companyName = job.employer?.company_name || 'Hiring Company'
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')

                return (
                  <Card
                    key={job.id}
                    clickable
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className={styles.jobCard}
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
                      <div className={styles.footerMeta}>
                        <span className={styles.postedDate}>
                          Posted {formatRelativeTime(job.created_at)}
                        </span>
                        <span className={styles.viewJobLink}>
                          <span>View Role</span>
                          <FiArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

