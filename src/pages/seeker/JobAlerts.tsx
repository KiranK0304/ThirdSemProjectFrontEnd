import React, { useState } from 'react'
import { Button, Card, EmptyState, ErrorState, Input, LoadingSpinner, Select, Tag } from '@/components/ui'
import {
  useCreateJobAlert,
  useDeleteJobAlert,
  useJobAlertMatches,
  useJobAlerts,
  useUpdateJobAlert,
} from '@/hooks/queries/useJobQueries'
import type { JobAlert } from '@/api/types'
import { extractApiError } from '@/api/utils'
import styles from './JobAlerts.module.css'

const employmentTypeOptions = [
  { value: '', label: 'Any employment type' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'FREELANCE', label: 'Freelance' },
]

function AlertCard({ alert }: { alert: JobAlert }) {
  const { data: matches = [] } = useJobAlertMatches(alert.id, alert.is_active)
  const updateAlert = useUpdateJobAlert()
  const deleteAlert = useDeleteJobAlert()

  const criteria = [
    alert.keyword && `Keyword: ${alert.keyword}`,
    alert.location && `Location: ${alert.location}`,
    alert.employment_type && alert.employment_type.replace('_', ' '),
    alert.minimum_salary && `Min salary: ${alert.minimum_salary}`,
  ].filter(Boolean)

  return (
    <Card className={styles.alertCard}>
      <div className={styles.alertHeader}>
        <div>
          <h2>{alert.keyword || 'Job alert'}</h2>
          <p>{criteria.join(' · ')}</p>
        </div>
        <Tag variant={alert.is_active ? 'success' : 'neutral'}>
          {alert.is_active ? 'Active' : 'Paused'}
        </Tag>
      </div>
      <div className={styles.alertFooter}>
        <span>
          {alert.frequency === 'DAILY' ? 'Daily' : 'Weekly'} · {matches.length} current match(es)
        </span>
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateAlert.mutate({ id: alert.id, data: { is_active: !alert.is_active } })}
            loading={updateAlert.isPending}
          >
            {alert.is_active ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteAlert.mutate(alert.id)}
            loading={deleteAlert.isPending}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function JobAlerts() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [minimumSalary, setMinimumSalary] = useState('')
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY')
  const [error, setError] = useState<string | null>(null)
  const { data: alerts = [], isLoading, isError, error: alertsError, refetch } = useJobAlerts()
  const createAlert = useCreateJobAlert()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    try {
      await createAlert.mutateAsync({
        keyword: keyword.trim() || undefined,
        location: location.trim() || undefined,
        employment_type: employmentType || undefined,
        minimum_salary: minimumSalary ? Number(minimumSalary) : undefined,
        frequency,
      })
      setKeyword('')
      setLocation('')
      setEmploymentType('')
      setMinimumSalary('')
      setFrequency('DAILY')
    } catch (requestError: unknown) {
      setError(extractApiError(requestError) || 'Could not create this job alert')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.heading}>
        <h1>Job Alerts</h1>
        <p>Save a search and we will email you when new matching jobs are available.</p>
      </div>

      <Card className={styles.formCard}>
        <h2>Create an alert</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input label="Keyword" placeholder="React developer" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Input label="Location" placeholder="Kochi or Remote" value={location} onChange={(event) => setLocation(event.target.value)} />
          <Select label="Employment type" value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} options={employmentTypeOptions} />
          <Input label="Minimum salary" type="number" min="0" placeholder="50000" value={minimumSalary} onChange={(event) => setMinimumSalary(event.target.value)} />
          <Select
            label="Email frequency"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as 'DAILY' | 'WEEKLY')}
            options={[{ value: 'DAILY', label: 'Daily' }, { value: 'WEEKLY', label: 'Weekly' }]}
          />
          <div className={styles.submitArea}>
            <Button type="submit" loading={createAlert.isPending} disabled={createAlert.isPending}>
              Create Alert
            </Button>
            {error && <span className={styles.error}>{error}</span>}
          </div>
        </form>
      </Card>

      <section className={styles.alertsSection}>
        <h2>Your alerts</h2>
        {isLoading && <LoadingSpinner />}
        {isError && (
          <ErrorState
            message={alertsError instanceof Error ? alertsError.message : 'Failed to load alerts'}
            onRetry={() => refetch()}
          />
        )}
        {!isLoading && !isError && alerts.length === 0 && (
          <EmptyState title="No alerts yet" description="Create an alert to hear about new roles that match your search." />
        )}
        {!isLoading && !isError && alerts.length > 0 && (
          <div className={styles.alertList}>
            {alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          </div>
        )}
      </section>
    </div>
  )
}
