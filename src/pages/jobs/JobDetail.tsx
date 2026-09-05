import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Tag, Modal, TextArea, Select, EmptyState, ErrorState, LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useJob } from '@/hooks/queries/useJobQueries'
import { useApplyToJob } from '@/hooks/queries/useApplicationQueries'
import { useResumes, useUploadResume } from '@/hooks/queries/useResumeQueries'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { extractApiError } from '@/api/utils'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType } from '@/utils/format'
import { FiUploadCloud, FiFileText, FiAlertCircle } from 'react-icons/fi'
import styles from './JobDetail.module.css'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const jobId = Number(id)
  const { data: job, isLoading: jobLoading, isError: jobIsError, error: jobError, refetch: refetchJob } = useJob(jobId)
  const { data: resumesData, isLoading: resumesLoading } = useResumes()
  
  const applyMutation = useApplyToJob()
  
  const uploadResumeMutation = useUploadResume()
  
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [selectedResume, setSelectedResume] = useState('')
  const [applyMode, setApplyMode] = useState<'saved' | 'upload'>('saved')
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null)
  const [newResumeTitle, setNewResumeTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  const resumes = resumesData || []

  useEffect(() => {
    if (resumes.length > 0) {
      if (!selectedResume) {
        const primary = resumes.find(r => r.is_primary) || resumes[0]
        if (primary) {
          setSelectedResume(primary.id.toString())
        }
      }
    } else if (!resumesLoading) {
      // If user has no saved resumes in profile, automatically default to direct upload
      setApplyMode('upload')
    }
  }, [resumes, resumesLoading, selectedResume])

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
    setIsSubmitting(true)

    try {
      let resumeIdToUse: number | undefined

      if (applyMode === 'upload' || resumes.length === 0) {
        if (!newResumeFile) {
          setApplyError('Please choose a resume file (.pdf, .doc, .docx) to upload.')
          setIsSubmitting(false)
          return
        }

        // Upload resume directly to candidate profile
        const uploaded = await uploadResumeMutation.mutateAsync({
          file: newResumeFile,
          title: newResumeTitle.trim() || newResumeFile.name,
        })
        resumeIdToUse = uploaded.id
      } else {
        if (!selectedResume) {
          setApplyError('Please select a resume.')
          setIsSubmitting(false)
          return
        }
        resumeIdToUse = parseInt(selectedResume)
      }

      await applyMutation.mutateAsync({
        jobId: job.id,
        data: {
          resume_id: resumeIdToUse,
          cover_letter: coverLetter.trim() || undefined,
        },
      })
      setIsApplyModalOpen(false)
      navigate('/seeker/applications')
    } catch (error: any) {
      setApplyError(extractApiError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resumeOptions = resumes.map((r) => {
    const isMain = r.is_primary || resumes.length === 1
    const baseTitle = r.title || `Resume ${r.id}`
    return {
      value: r.id.toString(),
      label: isMain ? `${baseTitle} (Main)` : baseTitle,
    }
  })

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
          <SaveJobButton jobId={job.id} />
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
            {applyError && (
              <div className={styles.errorBanner}>
                <FiAlertCircle /> {applyError}
              </div>
            )}
            
            {resumesLoading ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                {/* If user has existing resumes, show toggle between Saved and Upload New */}
                {resumes.length > 0 && resumes.length < 3 && (
                  <div className={styles.modeToggle}>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${applyMode === 'saved' ? styles.modeBtnActive : ''}`}
                      onClick={() => setApplyMode('saved')}
                    >
                      <FiFileText /> Saved Resumes ({resumes.length})
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${applyMode === 'upload' ? styles.modeBtnActive : ''}`}
                      onClick={() => setApplyMode('upload')}
                    >
                      <FiUploadCloud /> Upload New Resume
                    </button>
                  </div>
                )}

                {/* Mode 1: Select from saved resumes */}
                {applyMode === 'saved' && resumes.length > 0 && (
                  <Select
                    label="Select Resume *"
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    options={[{ value: '', label: 'Choose a resume...' }, ...resumeOptions]}
                  />
                )}

                {/* Mode 2: Direct file upload (or automatic if no resumes exist) */}
                {(applyMode === 'upload' || resumes.length === 0) && (
                  <div className={styles.uploadBox}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      Upload Resume File *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setNewResumeFile(file)
                        if (file && !newResumeTitle) {
                          setNewResumeTitle(file.name.replace(/\.[^/.]+$/, ''))
                        }
                      }}
                      className={styles.fileInput}
                    />
                    <span className={styles.uploadHint}>
                      Accepted formats: PDF, DOC, DOCX (Max 5MB). This will be saved to your profile and attached to this application.
                    </span>
                  </div>
                )}
              </>
            )}
            
            <TextArea
              label="Cover Letter (Optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              placeholder="Why are you a good fit for this role?"
            />
            
            <div className={styles.modalActions}>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsApplyModalOpen(false)
                  setApplyError(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleApply} 
                disabled={
                  isSubmitting ||
                  (applyMode === 'saved' && resumes.length > 0 && !selectedResume) ||
                  ((applyMode === 'upload' || resumes.length === 0) && !newResumeFile)
                }
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
