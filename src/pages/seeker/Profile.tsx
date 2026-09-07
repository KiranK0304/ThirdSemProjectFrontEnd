import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Input, TextArea, ConfirmModal, LoadingSpinner, CompanyAvatar } from '@/components/ui'
import { useUpdateProfile } from '@/hooks/queries/useAuthQueries'
import {
  useResumes,
  useUploadResume,
  useDeleteResume,
  useSetPrimaryResume,
} from '@/hooks/queries/useResumeQueries'
import { formatRelativeTime } from '@/utils/date'
import { getMediaUrl } from '@/utils/format'
import { extractApiError } from '@/api/utils'
import { FiFileText, FiExternalLink, FiTrash2, FiCheckCircle, FiStar, FiUser, FiUploadCloud, FiAlertCircle } from 'react-icons/fi'
import type { Resume } from '@/api/types'
import styles from './Profile.module.css'

export default function Profile() {
  const { user } = useAuth()
  const profile = user?.seeker_profile
  const updateProfile = useUpdateProfile()
  const { data: resumes = [], isLoading: resumesLoading } = useResumes()
  const uploadResume = useUploadResume()
  const deleteResume = useDeleteResume()
  const setPrimaryResume = useSetPrimaryResume()

  // Profile form state
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Resume upload state
  const fileRef = useRef<HTMLInputElement>(null)
  const [resumeTitle, setResumeTitle] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState('')
  const [pendingPrimaryId, setPendingPrimaryId] = useState<number | null>(null)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccess('')
    setProfileError('')
    try {
      await updateProfile.mutateAsync({
        name,
        seeker_profile: { phone, bio },
      } as any)
      setProfileSuccess('Profile saved successfully.')
      setTimeout(() => setProfileSuccess(''), 3500)
    } catch (err) {
      setProfileError(extractApiError(err))
    }
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setUploadError('Please choose a file to upload.')
      return
    }
    setUploadError('')
    setResumeSuccessMsg('')
    try {
      await uploadResume.mutateAsync({ file, title: resumeTitle.trim() || undefined })
      setResumeTitle('')
      if (fileRef.current) fileRef.current.value = ''
      setResumeSuccessMsg('Resume uploaded successfully.')
      setTimeout(() => setResumeSuccessMsg(''), 3500)
    } catch (err) {
      setUploadError(extractApiError(err))
    }
  }

  const handleSetPrimary = async (resumeId: number) => {
    setPendingPrimaryId(resumeId)
    setResumeSuccessMsg('')
    try {
      await setPrimaryResume.mutateAsync(resumeId)
      setResumeSuccessMsg('Default resume updated.')
      setTimeout(() => setResumeSuccessMsg(''), 3500)
    } catch (err) {
      setUploadError(extractApiError(err))
    } finally {
      setPendingPrimaryId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteError('')
    try {
      await deleteResume.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      setResumeSuccessMsg('Resume deleted.')
      setTimeout(() => setResumeSuccessMsg(''), 3500)
    } catch (err) {
      setDeleteError(extractApiError(err))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Candidate Profile</h1>
        <p className={styles.subtitle}>
          Manage your personal details, public bio, and active resumes for fast job applications.
        </p>
      </div>

      {/* User Identity card & form */}
      <Card className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <div className={styles.userBadge}>
            <div className={styles.avatar}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className={styles.cardTitle}>{user?.name || 'Job Seeker'}</h2>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleProfileSave}>
          <div className={styles.formGrid}>
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <TextArea
            label="Professional Bio / Summary"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Summarize your key skills, experience level, and what roles you are seeking..."
          />

          <div className={styles.formActions}>
            <Button
              variant="primary"
              type="submit"
              loading={updateProfile.isPending}
            >
              Save Profile Changes
            </Button>
            {profileSuccess && (
              <div className={styles.successAlert}>
                <FiCheckCircle size={14} />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className={styles.errorAlert}>
                <FiAlertCircle size={14} />
                <span>{profileError}</span>
              </div>
            )}
          </div>
        </form>
      </Card>

      {/* Resumes section */}
      <Card className={styles.sectionCard}>
        <div className={styles.resumeHeader}>
          <div>
            <h2 className={styles.cardTitle}>Uploaded Resumes</h2>
            <p className={styles.cardSubtitle}>
              You can store up to 3 versions of your resume and set a default for quick 1-click applications.
            </p>
          </div>
          <span className={styles.resumeCountBadge}>{resumes.length} / 3</span>
        </div>

        {resumeSuccessMsg && (
          <div className={styles.successAlert}>
            <FiCheckCircle size={14} />
            <span>{resumeSuccessMsg}</span>
          </div>
        )}

        {resumesLoading ? (
          <div className={styles.loadingBox}>
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            {resumes.length > 0 ? (
              <div className={styles.resumeList}>
                {resumes.map((resume) => {
                  const isPrimary = resume.is_primary || resumes.length === 1
                  const resumeUrl = getMediaUrl(resume.file_url || resume.file)

                  return (
                    <div
                      key={resume.id}
                      className={`${styles.resumeItem} ${isPrimary ? styles.resumeItemPrimary : ''}`}
                    >
                      <div className={styles.resumeLeft}>
                        <div className={styles.fileIconWrapper}>
                          <FiFileText size={22} />
                        </div>
                        <div className={styles.resumeInfo}>
                          <div className={styles.titleRow}>
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.resumeTitleLink}
                              title="Click to view resume in new tab"
                            >
                              {resume.title || 'Untitled Resume'}
                            </a>
                            {isPrimary && (
                              <span className={styles.primaryBadge}>
                                <FiCheckCircle size={12} /> Default
                              </span>
                            )}
                          </div>
                          <span className={styles.resumeDate}>
                            Uploaded {formatRelativeTime(resume.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.resumeActions}>
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionLink}
                          tabIndex={-1}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            className={styles.btnAction}
                            title="Open resume in new tab"
                          >
                            <FiExternalLink size={13} />
                            <span>View</span>
                          </Button>
                        </a>

                        {!isPrimary && resumes.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(resume.id)}
                            loading={setPrimaryResume.isPending && pendingPrimaryId === resume.id}
                            className={styles.btnAction}
                            title="Make this your default resume"
                          >
                            <FiStar size={13} />
                            <span>Set Default</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${styles.btnAction} ${styles.deleteBtn}`}
                          onClick={() => setDeleteTarget(resume)}
                          title="Delete this resume"
                        >
                          <FiTrash2 size={13} />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.noResumesMsg}>
                No resumes uploaded yet. Add a PDF or DOCX file below to apply for open roles.
              </div>
            )}

            {resumes.length < 3 ? (
              <div className={styles.uploadSection}>
                <h3 className={styles.uploadTitle}>
                  <FiUploadCloud size={18} />
                  <span>Upload New Resume</span>
                </h3>
                <div className={styles.uploadForm}>
                  <Input
                    label="Resume Label / Title (Optional)"
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer - 2026"
                  />
                  <div className={styles.fileInputWrapper}>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className={styles.fileInput}
                    />
                    <span className={styles.uploadHint}>Supported formats: PDF, DOC, DOCX (Max 5MB)</span>
                  </div>
                  <div className={styles.uploadActions}>
                    <Button
                      variant="secondary"
                      onClick={handleUpload}
                      loading={uploadResume.isPending}
                    >
                      <FiUploadCloud size={14} />
                      <span>Upload Resume</span>
                    </Button>
                    {uploadError && (
                      <div className={styles.errorAlert}>
                        <FiAlertCircle size={14} />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.maxNote}>
                Maximum 3 resumes reached. You can delete an existing one to upload a replacement.
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resume?"
        description={`Are you sure you want to delete "${deleteTarget?.title || 'this resume'}"? This action cannot be reversed.`}
        confirmText="Delete Resume"
        cancelText="Keep"
        variant="danger"
        loading={deleteResume.isPending}
      />
    </div>
  )
}


