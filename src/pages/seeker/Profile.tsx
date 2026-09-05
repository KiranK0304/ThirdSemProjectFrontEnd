import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Input, TextArea, Modal, LoadingSpinner } from '@/components/ui'
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
import { FiFileText, FiExternalLink, FiTrash2, FiCheckCircle, FiStar } from 'react-icons/fi'
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
      setProfileSuccess('Profile updated.')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (err) {
      setProfileError(extractApiError(err))
    }
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploadError('')
    setResumeSuccessMsg('')
    try {
      await uploadResume.mutateAsync({ file, title: resumeTitle || undefined })
      setResumeTitle('')
      if (fileRef.current) fileRef.current.value = ''
      setResumeSuccessMsg('Resume uploaded successfully.')
      setTimeout(() => setResumeSuccessMsg(''), 3000)
    } catch (err) {
      setUploadError(extractApiError(err))
    }
  }

  const handleSetPrimary = async (resumeId: number) => {
    setPendingPrimaryId(resumeId)
    setResumeSuccessMsg('')
    try {
      await setPrimaryResume.mutateAsync(resumeId)
      setResumeSuccessMsg('Main resume updated.')
      setTimeout(() => setResumeSuccessMsg(''), 3000)
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
      setTimeout(() => setResumeSuccessMsg(''), 3000)
    } catch (err) {
      setDeleteError(extractApiError(err))
    }
  }

  return (
    <div className={styles.page}>
      <h1>My Profile</h1>

      {/* Profile form */}
      <Card className={styles.profileCard}>
        <form className={styles.form} onSubmit={handleProfileSave}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
          />
          <TextArea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell employers about yourself..."
          />
          <div className={styles.formActions}>
            <Button
              variant="primary"
              type="submit"
              loading={updateProfile.isPending}
            >
              Save Changes
            </Button>
            {profileSuccess && <span className={styles.successMsg}>{profileSuccess}</span>}
            {profileError && <span className={styles.errorMsg}>{profileError}</span>}
          </div>
        </form>
      </Card>

      {/* Resumes section */}
      <Card>
        <div className={styles.resumeHeader}>
          <h2>Resumes</h2>
          <span className={styles.resumeCount}>{resumes.length} of 3</span>
        </div>

        {resumeSuccessMsg && (
          <div className={styles.resumeSuccess}>
            <FiCheckCircle size={14} />
            <span>{resumeSuccessMsg}</span>
          </div>
        )}

        {resumesLoading ? (
          <LoadingSpinner size="md" />
        ) : (
          <>
            {resumes.length > 0 && (
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
                          <FiFileText size={20} />
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
                              {resume.title}
                            </a>
                            {isPrimary && (
                              <span className={styles.primaryBadge}>
                                <FiCheckCircle size={12} /> Main Resume
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
                            <FiExternalLink size={14} /> View
                          </Button>
                        </a>

                        {!isPrimary && resumes.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(resume.id)}
                            loading={setPrimaryResume.isPending && pendingPrimaryId === resume.id}
                            className={styles.btnAction}
                            title="Make this your primary default resume"
                          >
                            <FiStar size={14} /> Set as Main
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${styles.btnAction} ${styles.deleteBtn}`}
                          onClick={() => setDeleteTarget(resume)}
                          title="Delete this resume"
                        >
                          <FiTrash2 size={14} /> Delete
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {resumes.length < 3 ? (
              <div className={styles.uploadForm}>
                <Input
                  label="Resume title (optional)"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="e.g. Backend Developer Resume"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className={styles.fileInput}
                />
                <span className={styles.uploadHint}>Supported formats: PDF, DOC, DOCX (Max 5MB)</span>
                <div className={styles.uploadActions}>
                  <Button
                    variant="secondary"
                    onClick={handleUpload}
                    loading={uploadResume.isPending}
                  >
                    Upload Resume
                  </Button>
                  {uploadError && <span className={styles.errorMsg}>{uploadError}</span>}
                </div>
              </div>
            ) : (
              <p className={styles.maxNote}>
                Maximum 3 resumes reached. Delete one to upload a new one.
              </p>
            )}
          </>
        )}
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete resume?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteResume.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
        </p>
        <p style={{ marginTop: '8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          This resume will be permanently deleted. Applications that used it will no longer have an attached file.
        </p>
        {deleteError && <p className={styles.errorMsg}>{deleteError}</p>}
      </Modal>
    </div>
  )
}

