import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Input, TextArea, Modal, LoadingSpinner } from '@/components/ui'
import { useUpdateProfile } from '@/hooks/queries/useAuthQueries'
import { useResumes, useUploadResume, useDeleteResume } from '@/hooks/queries/useResumeQueries'
import { formatRelativeTime } from '@/utils/date'
import { extractApiError } from '@/api/utils'
import styles from './Profile.module.css'

export default function Profile() {
  const { user } = useAuth()
  const profile = user?.seeker_profile
  const updateProfile = useUpdateProfile()
  const { data: resumes = [], isLoading: resumesLoading } = useResumes()
  const uploadResume = useUploadResume()
  const deleteResume = useDeleteResume()

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

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
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
    try {
      await uploadResume.mutateAsync({ file, title: resumeTitle || undefined })
      setResumeTitle('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setUploadError(extractApiError(err))
    }
  }

  const handleDelete = async () => {
    if (deleteTarget === null) return
    setDeleteError('')
    try {
      await deleteResume.mutateAsync(deleteTarget)
      setDeleteTarget(null)
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

        {resumesLoading ? (
          <LoadingSpinner size="md" />
        ) : (
          <>
            {resumes.length > 0 && (
              <div className={styles.resumeList}>
                {resumes.map((resume) => (
                  <div key={resume.id} className={styles.resumeItem}>
                    <div className={styles.resumeInfo}>
                      <span className={styles.resumeTitle}>{resume.title}</span>
                      <span className={styles.resumeDate}>
                        Uploaded {formatRelativeTime(resume.created_at)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(resume.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
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
                <div className={styles.uploadActions}>
                  <Button
                    variant="secondary"
                    onClick={handleUpload}
                    loading={uploadResume.isPending}
                  >
                    Upload
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
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
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
        <p>This resume will be permanently deleted. Applications that used it will no longer have an attached resume.</p>
        {deleteError && <p className={styles.errorMsg}>{deleteError}</p>}
      </Modal>
    </div>
  )
}
