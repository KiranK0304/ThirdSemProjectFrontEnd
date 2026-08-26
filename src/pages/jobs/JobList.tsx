import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Input, Select, Tag, Button, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui'
import { useJobs } from '@/hooks/queries/useJobQueries'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType } from '@/utils/format'
import styles from './JobList.module.css'

export default function JobList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    employment_type: searchParams.get('employment_type') || '',
    location: searchParams.get('location') || '',
    salary_min: searchParams.get('salary_min') || '',
    sort: searchParams.get('sort') || '-created_at'
  })

  // sync filters when url changes (e.g. back button)
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      employment_type: searchParams.get('employment_type') || '',
      location: searchParams.get('location') || '',
      salary_min: searchParams.get('salary_min') || '',
      sort: searchParams.get('sort') || '-created_at'
    })
  }, [searchParams])

  const { data, isLoading, isError, error, refetch } = useJobs({
    search: searchParams.get('search') || undefined,
    employment_type: searchParams.get('employment_type') || undefined,
    location: searchParams.get('location') || undefined,
    min_salary: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min') as string) : undefined,
    ordering: searchParams.get('sort') || undefined
  })

  const jobs = Array.isArray(data) ? data : []

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
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
      sort: '-created_at'
    })
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <div className={styles.filtersCard}>
          <form onSubmit={applyFilters} className={styles.filtersForm}>
            <Input 
              label="Search" 
              placeholder="Keywords..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select 
              label="Employment Type"
              value={filters.employment_type}
              onChange={(e) => handleFilterChange('employment_type', e.target.value)}
              options={[
                {value: '', label: 'All types'},
                {value: 'FULL_TIME', label: 'Full Time'},
                {value: 'PART_TIME', label: 'Part Time'},
                {value: 'CONTRACT', label: 'Contract'},
                {value: 'INTERNSHIP', label: 'Internship'},
                {value: 'TEMPORARY', label: 'Temporary'},
                {value: 'FREELANCE', label: 'Freelance'}
              ]}
            />
            <Input 
              label="Location" 
              placeholder="City, state, remote..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
            <Input 
              label="Min Salary" 
              type="number"
              placeholder="e.g. 50000"
              value={filters.salary_min}
              onChange={(e) => handleFilterChange('salary_min', e.target.value)}
            />
            <Select 
              label="Sort By"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              options={[
                {value: '-created_at', label: 'Newest'},
                {value: 'created_at', label: 'Oldest'},
                {value: '-salary_max', label: 'Highest salary'},
                {value: 'salary_min', label: 'Lowest salary'}
              ]}
            />
            <div className={styles.filterActions}>
              <Button type="submit" variant="secondary" className={styles.fullWidth}>Apply</Button>
              <Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button>
            </div>
          </form>
        </div>

        <div className={styles.jobsList}>
          {isLoading && <LoadingSpinner />}
          
          {isError && (
            <ErrorState 
              message={error instanceof Error ? error.message : "Failed to load jobs"} 
              onRetry={() => refetch()} 
            />
          )}

          {!isLoading && !isError && jobs.length === 0 && (
            <EmptyState title="No jobs found" description="Try adjusting your search or filters." />
          )}

          {!isLoading && !isError && jobs.length > 0 && (
            <div className={styles.jobsGrid}>
              {jobs.map((job: any) => (
                <Card 
                  key={job.id} 
                  clickable 
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className={styles.jobCard}
                >
                  <div className={styles.jobHeader}>
                    <div className={styles.jobTitleGroup}>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <span className={styles.companyName}>{job.employer?.company_name}</span>
                    </div>
                    <SaveJobButton jobId={job.id} stopPropagation />
                  </div>
                  
                  <div className={styles.jobTags}>
                    <Tag variant="neutral">{formatEmploymentType(job.employment_type)}</Tag>
                    <Tag variant="neutral">{job.location}</Tag>
                    {(job.salary_min || job.salary_max) && (
                      <Tag variant="amber">{formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')}</Tag>
                    )}
                  </div>
                  
                  <div className={styles.jobFooter}>
                    <span className={styles.postedDate}>{formatRelativeTime(job.created_at)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
