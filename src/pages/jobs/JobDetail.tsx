import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Tag, Modal, TextArea, Select, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useJob } from '@/hooks/queries/useJobQueries'
import { useApplyToJob } from '@/hooks/queries/useApplicationQueries'
import { useResumes } from '@/hooks/queries/useResumeQueries'
import { extractApiError } from '@/api/utils'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType } from '@/utils/format'
import styles from './JobDetail.module.css'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const jobId = Number(id)
  const { data: job, isLoading: jobLoading, isError: jobIsError, error: jobError, refetch: refetchJob } = useJob(jobId)
  const { data: resumesData, isLoading: resumesLoading } = useResumes()
  
  const applyMutation = useApplyToJob()
  
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [selectedResume, setSelectedResume] = useState('')
  const [applyError, setApplyError] = useState<string | null>(null)

  const resumes = resumesData || []

  if (jobLoading) return <div className={styles.container}><LoadingSpinner /></div>
  
  if (jobIsError) {
    return (
      <div className={styles.container}>
        <ErrorState 
          message={jobError instanceof Error ? jobError.message : "Failed to load job"} 
          onRetry={() => refetchJob()} 
        />
      </div>
    )
  }

  if (!job) {
    return (
      <div className={styles.container}>
        <EmptyState title="Job not found" description="The job you are looking for does not exist." />
      </div>
    )
  }

  const handleApply = async () => {
    setApplyError(null)

    try {
      await applyMutation.mutateAsync({
        jobId: job.id,
        data: {
          resume_id: selectedResume ? parseInt(selectedResume) : undefined,
          cover_letter: coverLetter || undefined
        }
      })
      setIsApplyModalOpen(false)
      navigate('/seeker/applications')
    } catch (error: any) {
      setApplyError(extractApiError(error))
    }
  }

  const resumeOptions = resumes.map((r) => ({
    value: r.id.toString(),
    label: r.title || `Resume ${r.id}`
  }))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{job.title}</h1>
        
        <div className={styles.companyInfo}>
          <h2 className={styles.companyName}>{job.employer?.company_name}</h2>
          {job.employer?.website && (
            <a href={job.employer.website} target="_blank" rel="noopener noreferrer" className={styles.companyLink}>
              {job.employer.website}
            </a>
          )}
        </div>
        
        <div className={styles.tags}>
          <Tag variant="neutral">{formatEmploymentType(job.employment_type)}</Tag>
          <Tag variant="neutral">{job.location}</Tag>
          {(job.salary_min || job.salary_max) && (
            <Tag variant="amber">{formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')}</Tag>
          )}
        </div>
      </div>
      
      <div className={styles.description}>
        {job.description}
      </div>
      
      <div className={styles.footer}>
        <span className={styles.postedDate}>Posted {formatRelativeTime(job.created_at)}</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          {user?.account_type === 'SEEKER' && job.employer?.id && (
            <Button 
              variant="secondary" 
              onClick={() => navigate('/messages', { state: { employerId: job.employer.id } })}
            >
              Message Employer
            </Button>
          )}
          <Button variant="primary" onClick={() => setIsApplyModalOpen(true)}>
            Apply Now
          </Button>
        </div>
      </div>

      <Modal 
        open={isApplyModalOpen} 
        onClose={() => {
          setIsApplyModalOpen(false)
          setApplyError(null)
        }}
        title={`Apply for ${job.title}`}
      >
        {!user ? (
          <div className={styles.signInMessage}>
            <p>Please sign in to apply for this position.</p>
            <Link to="/login" className={styles.signInLink}>Go to Sign In</Link>
          </div>
        ) : user.account_type === 'EMPLOYER' ? (
          <div className={styles.signInMessage}>
            <p>Employers cannot apply for jobs. Please log in as a job seeker.</p>
          </div>
        ) : (
          <div className={styles.applyForm}>
            {applyError && <div style={{ color: 'var(--color-danger)' }}>{applyError}</div>}
            
            {resumesLoading ? (
              <LoadingSpinner />
            ) : resumes.length === 0 ? (
              <p>You have no resumes. Please upload one in your profile first.</p>
            ) : (
              <Select
                label="Select Resume *"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                options={[{ value: '', label: 'Choose a resume...' }, ...resumeOptions]}
              />
            )}
            
            <TextArea
              label="Cover Letter (Optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Why are you a good fit for this role?"
            />
            
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleApply} 
                disabled={!selectedResume || applyMutation.isPending}
                loading={applyMutation.isPending}
              >
                Submit Application
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
