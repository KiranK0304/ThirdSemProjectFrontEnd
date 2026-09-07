import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Tag, Modal, TextArea, Select, EmptyState, ErrorState, LoadingSpinner, CompanyAvatar, Card } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useJob } from '@/hooks/queries/useJobQueries'
import { useApplyToJob, useSeekerAppliedMap } from '@/hooks/queries/useApplicationQueries'
import { useResumes, useUploadResume } from '@/hooks/queries/useResumeQueries'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { extractApiError } from '@/api/utils'
import { formatRelativeTime, formatSalary } from '@/utils/date'
import { formatEmploymentType, formatStatus, getApplicationStatusVariant } from '@/utils/format'
import { FiUploadCloud, FiFileText, FiAlertCircle, FiArrowLeft, FiMapPin, FiExternalLink, FiClock } from 'react-icons/fi'
import styles from './JobDetail.module.css'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const jobId = Number(id)
  const { data: job, isLoading: jobLoading, isError: jobIsError, error: jobError, refetch: refetchJob } = useJob(jobId)
  const { isApplied, getApplicationForJob } = useSeekerAppliedMap(user?.account_type === 'SEEKER')
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
        const primary = resumes.find((r) => r.is_primary) || resumes[0]
        if (primary) {
          setSelectedResume(primary.id.toString())
        }
      }
    } else if (!resumesLoading) {
      // If user has no saved resumes in profile, automatically default to direct upload
      setApplyMode('upload')
    }
  }, [resumes, resumesLoading, selectedResume])

  if (jobLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (jobIsError) {
    return (
      <div className={styles.container}>
        <ErrorState
          message={jobError instanceof Error ? jobError.message : 'Failed to load job details'}
          onRetry={() => refetchJob()}
        />
      </div>
    )
  }

  if (!job) {
    return (
      <div className={styles.container}>
        <EmptyState title="Job not found" description="The job you are looking for does not exist or has been removed." />
      </div>
    )
  }

  const isJobApplied = job ? isApplied(job.id) : false
  const existingApplication = job ? getApplicationForJob(job.id) : undefined

  const handleApply = async () => {
    if (isJobApplied) {
      setApplyError('You have already applied for this job.')
      return
    }
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
      label: isMain ? `${baseTitle} (Default)` : baseTitle,
    }
  })

  const companyName = job.employer?.company_name || 'Hiring Company'
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')

  return (
    <div className={styles.container}>
      <Link to="/jobs" className={styles.backLink}>
        <FiArrowLeft size={16} />
        <span>Back to All Jobs</span>
      </Link>

      <Card className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.companyInfo}>
            <CompanyAvatar name={companyName} size={64} />
            <div>
              <h1 className={styles.title}>{job.title}</h1>
              <div className={styles.companyMeta}>
                <span className={styles.companyName}>{companyName}</span>
                {job.location && (
                  <>
                    <span className={styles.metaDot}>•</span>
                    <span className={styles.metaItem}>
                      <FiMapPin size={13} />
                      <span>{job.location}</span>
                    </span>
                  </>
                )}
                {job.employer?.website && (
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

          <div className={styles.headerActions}>
            <SaveJobButton jobId={job.id} />
            {isJobApplied && existingApplication ? (
              <div className={styles.appliedActionGroup}>
                <Tag variant={getApplicationStatusVariant(existingApplication.status)}>
                  Applied · {formatStatus(existingApplication.status)}
                </Tag>
                <Link to={`/seeker/applications/${existingApplication.id}`}>
                  <Button variant="secondary">View Application</Button>
                </Link>
              </div>
            ) : (
              <Button variant="primary" onClick={() => setIsApplyModalOpen(true)}>
                Apply Now
              </Button>
            )}
          </div>
        </div>

        <div className={styles.tagsRow}>
          {isJobApplied && <Tag variant="success">Applied</Tag>}
          <Tag variant="neutral">{formatEmploymentType(job.employment_type)}</Tag>
          {salary && <Tag variant="neutral">{salary}</Tag>}
          <span className={styles.postedDate}>
            <FiClock size={12} />
            <span>Posted {formatRelativeTime(job.created_at)}</span>
          </span>
        </div>
      </Card>

      <Card className={styles.bodyCard}>
        <h2 className={styles.sectionTitle}>Job Description & Requirements</h2>
        <div className={styles.descriptionText}>
          {job.description}
        </div>

        <div className={styles.footerRow}>
          {isJobApplied && existingApplication ? (
            <div className={styles.appliedActionGroup}>
              <Tag variant={getApplicationStatusVariant(existingApplication.status)}>
                Applied · {formatStatus(existingApplication.status)}
              </Tag>
              <Link to={`/seeker/applications/${existingApplication.id}`}>
                <Button variant="secondary">View Application</Button>
              </Link>
            </div>
          ) : (
            <Button variant="primary" onClick={() => setIsApplyModalOpen(true)}>
              Apply Now
            </Button>
          )}
        </div>
      </Card>

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
            <p>Please sign in to submit your application for this role.</p>
            <Link to="/auth?mode=login" className={styles.signInLink}>
              <Button variant="primary">Sign In to Apply</Button>
            </Link>
          </div>
        ) : user.account_type === 'EMPLOYER' ? (
          <div className={styles.signInMessage}>
            <p>Employer accounts cannot submit job applications. Please sign in as a job seeker.</p>
          </div>
        ) : (
          <div className={styles.applyForm}>
            {applyError && (
              <div className={styles.errorBanner}>
                <FiAlertCircle size={16} />
                <span>{applyError}</span>
              </div>
            )}

            {resumesLoading ? (
              <div className={styles.modalLoading}>
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                {/* If user has existing resumes, show toggle */}
                {resumes.length > 0 && resumes.length < 3 && (
                  <div className={styles.modeToggle}>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${applyMode === 'saved' ? styles.modeBtnActive : ''}`}
                      onClick={() => setApplyMode('saved')}
                    >
                      <FiFileText size={14} />
                      <span>Saved Resumes ({resumes.length})</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${applyMode === 'upload' ? styles.modeBtnActive : ''}`}
                      onClick={() => setApplyMode('upload')}
                    >
                      <FiUploadCloud size={14} />
                      <span>Upload New File</span>
                    </button>
                  </div>
                )}

                {/* Mode 1: Select from saved resumes */}
                {applyMode === 'saved' && resumes.length > 0 && (
                  <Select
                    label="Choose Resume *"
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    options={[{ value: '', label: 'Select a saved resume...' }, ...resumeOptions]}
                  />
                )}

                {/* Mode 2: Direct file upload */}
                {(applyMode === 'upload' || resumes.length === 0) && (
                  <div className={styles.uploadBox}>
                    <label className={styles.uploadBoxLabel}>
                      Attach Resume Document *
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
                      Accepted formats: PDF, DOC, DOCX (Max 5MB). File will be saved to your candidate profile.
                    </span>
                  </div>
                )}
              </>
            )}

            <TextArea
              label="Cover Note / Pitch (Optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              placeholder="Highlight relevant experience, passion for the company, or notable achievements..."
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
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

