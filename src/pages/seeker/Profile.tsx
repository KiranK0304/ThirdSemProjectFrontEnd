import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Input, TextArea, ConfirmModal, LoadingSpinner } from '@/components/ui'
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
import {
  FiUser,
  FiFileText,
  FiExternalLink,
  FiTrash2,
  FiCheckCircle,
  FiStar,
  FiUploadCloud,
  FiAlertCircle,
  FiPlus,
  FiBriefcase,
  FiBookOpen,
  FiCode,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiMapPin,
  FiCalendar,
  FiX,
  FiAward,
} from 'react-icons/fi'
import type { Resume, WorkExperience, EducationItem, ProjectItem } from '@/api/types'
import styles from './Profile.module.css'

const SUGGESTED_SKILLS = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Django',
  'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL',
  'Tailwind CSS', 'Next.js', 'REST APIs', 'Git', 'CI/CD'
]

type ActiveTab = 'overview' | 'skills_projects' | 'experience_education' | 'resumes'

export default function Profile() {
  const { user } = useAuth()
  const profile = user?.seeker_profile
  const updateProfile = useUpdateProfile()
  const { data: resumes = [], isLoading: resumesLoading } = useResumes()
  const uploadResume = useUploadResume()
  const deleteResume = useDeleteResume()
  const setPrimaryResume = useSetPrimaryResume()

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  // Profile fields state
  const [name, setName] = useState(user?.name ?? '')
  const [headline, setHeadline] = useState(profile?.headline ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [yearsExp, setYearsExp] = useState(profile?.years_of_experience != null ? String(profile?.years_of_experience) : '')
  const [bio, setBio] = useState(profile?.bio ?? '')

  // Social links state
  const [github, setGithub] = useState(profile?.social_links?.github ?? '')
  const [linkedin, setLinkedin] = useState(profile?.social_links?.linkedin ?? '')
  const [portfolio, setPortfolio] = useState(profile?.social_links?.portfolio ?? '')
  const [twitter, setTwitter] = useState(profile?.social_links?.twitter ?? '')

  // Skills state
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? [])
  const [newSkillInput, setNewSkillInput] = useState('')

  // Experience state
  const [experience, setExperience] = useState<WorkExperience[]>(profile?.experience ?? [])
  const [showAddExp, setShowAddExp] = useState(false)
  const [newExpRole, setNewExpRole] = useState('')
  const [newExpCompany, setNewExpCompany] = useState('')
  const [newExpLocation, setNewExpLocation] = useState('')
  const [newExpStartDate, setNewExpStartDate] = useState('')
  const [newExpEndDate, setNewExpEndDate] = useState('')
  const [newExpCurrent, setNewExpCurrent] = useState(false)
  const [newExpDesc, setNewExpDesc] = useState('')

  // Education state
  const [education, setEducation] = useState<EducationItem[]>(profile?.education ?? [])
  const [showAddEdu, setShowAddEdu] = useState(false)
  const [newEduDegree, setNewEduDegree] = useState('')
  const [newEduSchool, setNewEduSchool] = useState('')
  const [newEduField, setNewEduField] = useState('')
  const [newEduStartYear, setNewEduStartYear] = useState('')
  const [newEduEndYear, setNewEduEndYear] = useState('')
  const [newEduGrade, setNewEduGrade] = useState('')

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>(profile?.projects ?? [])
  const [showAddProj, setShowAddProj] = useState(false)
  const [newProjTitle, setNewProjTitle] = useState('')
  const [newProjDesc, setNewProjDesc] = useState('')
  const [newProjTech, setNewProjTech] = useState('')
  const [newProjLive, setNewProjLive] = useState('')
  const [newProjGithub, setNewProjGithub] = useState('')

  // Alerts
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Resume state
  const fileRef = useRef<HTMLInputElement>(null)
  const [resumeTitle, setResumeTitle] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState('')
  const [pendingPrimaryId, setPendingPrimaryId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null)
  const [deleteError, setDeleteError] = useState('')

  // Sync state when user object updates
  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      const p = user.seeker_profile
      if (p) {
        setHeadline(p.headline ?? '')
        setPhone(p.phone ?? '')
        setLocation(p.location ?? '')
        setYearsExp(p.years_of_experience != null ? String(p.years_of_experience) : '')
        setBio(p.bio ?? '')
        setSkills(p.skills ?? [])
        setExperience(p.experience ?? [])
        setEducation(p.education ?? [])
        setProjects(p.projects ?? [])
        setGithub(p.social_links?.github ?? '')
        setLinkedin(p.social_links?.linkedin ?? '')
        setPortfolio(p.social_links?.portfolio ?? '')
        setTwitter(p.social_links?.twitter ?? '')
      }
    }
  }, [user])

  // Save full profile
  const handleProfileSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setProfileSuccess('')
    setProfileError('')

    const payload = {
      name,
      seeker_profile: {
        headline,
        phone,
        location,
        bio,
        years_of_experience: yearsExp.trim() ? Number(yearsExp) : null,
        skills,
        experience,
        education,
        projects,
        social_links: {
          github: github.trim(),
          linkedin: linkedin.trim(),
          portfolio: portfolio.trim(),
          twitter: twitter.trim(),
        },
      },
    }

    try {
      await updateProfile.mutateAsync(payload)
      setProfileSuccess('Career portfolio updated successfully!')
      setTimeout(() => setProfileSuccess(''), 3500)
    } catch (err) {
      setProfileError(extractApiError(err))
    }
  }

  // Skills handlers
  const handleAddSkill = (skillToAdd?: string) => {
    const s = (skillToAdd || newSkillInput).trim()
    if (!s) return
    if (!skills.includes(s)) {
      setSkills([...skills, s])
    }
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  // Experience handlers
  const handleAddExperience = () => {
    if (!newExpRole.trim() || !newExpCompany.trim() || !newExpStartDate.trim()) return
    const newEntry: WorkExperience = {
      id: String(Date.now()),
      role: newExpRole.trim(),
      company: newExpCompany.trim(),
      location: newExpLocation.trim() || undefined,
      start_date: newExpStartDate.trim(),
      end_date: newExpCurrent ? 'Present' : newExpEndDate.trim() || undefined,
      current: newExpCurrent,
      description: newExpDesc.trim() || undefined,
    }
    setExperience([...experience, newEntry])
    setNewExpRole('')
    setNewExpCompany('')
    setNewExpLocation('')
    setNewExpStartDate('')
    setNewExpEndDate('')
    setNewExpCurrent(false)
    setNewExpDesc('')
    setShowAddExp(false)
  }

  const handleRemoveExperience = (id?: string, index?: number) => {
    setExperience(experience.filter((item, i) => (id ? item.id !== id : i !== index)))
  }

  // Education handlers
  const handleAddEducation = () => {
    if (!newEduDegree.trim() || !newEduSchool.trim() || !newEduStartYear.trim()) return
    const newEntry: EducationItem = {
      id: String(Date.now()),
      degree: newEduDegree.trim(),
      institution: newEduSchool.trim(),
      field_of_study: newEduField.trim() || undefined,
      start_year: newEduStartYear.trim(),
      end_year: newEduEndYear.trim() || undefined,
      grade: newEduGrade.trim() || undefined,
    }
    setEducation([...education, newEntry])
    setNewEduDegree('')
    setNewEduSchool('')
    setNewEduField('')
    setNewEduStartYear('')
    setNewEduEndYear('')
    setNewEduGrade('')
    setShowAddEdu(false)
  }

  const handleRemoveEducation = (id?: string, index?: number) => {
    setEducation(education.filter((item, i) => (id ? item.id !== id : i !== index)))
  }

  // Project handlers
  const handleAddProject = () => {
    if (!newProjTitle.trim() || !newProjDesc.trim()) return
    const techArray = newProjTech
      ? newProjTech.split(',').map((t) => t.trim()).filter(Boolean)
      : []
    const newEntry: ProjectItem = {
      id: String(Date.now()),
      title: newProjTitle.trim(),
      description: newProjDesc.trim(),
      technologies: techArray,
      live_url: newProjLive.trim() || undefined,
      github_url: newProjGithub.trim() || undefined,
    }
    setProjects([...projects, newEntry])
    setNewProjTitle('')
    setNewProjDesc('')
    setNewProjTech('')
    setNewProjLive('')
    setNewProjGithub('')
    setShowAddProj(false)
  }

  const handleRemoveProject = (id?: string, index?: number) => {
    setProjects(projects.filter((item, i) => (id ? item.id !== id : i !== index)))
  }

  // Resume handlers
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
        <h1 className={styles.title}>Career Portfolio & Profile</h1>
        <p className={styles.subtitle}>
          Showcase your professional experience, key skills, live projects, and verified credentials to hiring teams.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiUser size={15} />
          <span>Basic Info & Socials</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'skills_projects' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('skills_projects')}
        >
          <FiCode size={15} />
          <span>Skills & Projects</span>
          <span className={styles.tabCount}>{skills.length + projects.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'experience_education' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('experience_education')}
        >
          <FiBriefcase size={15} />
          <span>Experience & Education</span>
          <span className={styles.tabCount}>{experience.length + education.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'resumes' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveTab('resumes')}
        >
          <FiFileText size={15} />
          <span>Uploaded Resumes</span>
          <span className={styles.tabCount}>{resumes.length}</span>
        </button>
      </div>

      {/* Tab 1: Basic Info & Socials */}
      {activeTab === 'overview' && (
        <Card className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <div className={styles.userBadge}>
              <div className={styles.avatar}>
                {(name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h2 className={styles.cardTitle}>{name || 'Job Seeker'}</h2>
                <span className={styles.userEmail}>{user?.email}</span>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => handleProfileSave()}
              loading={updateProfile.isPending}
            >
              Save Profile
            </Button>
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
                label="Professional Headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer | React & Python"
              />
            </div>

            <div className={styles.formGrid}>
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
              <Input
                label="Current Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA (or Remote)"
              />
            </div>

            <div style={{ maxWidth: '300px' }}>
              <Input
                label="Years of Experience"
                type="number"
                min="0"
                max="50"
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>

            <TextArea
              label="Professional Summary / Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Highlight your domain strengths, core stack, and the impact you deliver..."
            />

            <h3 className={styles.sectionHeading}>
              <FiGlobe size={16} />
              <span>Developer & Social Links</span>
            </h3>

            <div className={styles.formGrid}>
              <Input
                label="GitHub Profile URL"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
              />
              <Input
                label="LinkedIn Profile URL"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className={styles.formGrid}>
              <Input
                label="Portfolio / Personal Website"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.dev"
              />
              <Input
                label="Twitter / X Profile"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/handle"
              />
            </div>

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
      )}

      {/* Tab 2: Skills & Projects */}
      {activeTab === 'skills_projects' && (
        <>
          {/* Skills Section */}
          <Card className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Core Technical Skills</h2>
                <p className={styles.cardSubtitle}>
                  Add technical competencies, frameworks, languages, and tools relevant to your target roles.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleProfileSave()}
                loading={updateProfile.isPending}
              >
                Save Skills
              </Button>
            </div>

            <div className={styles.form}>
              <div className={styles.addSkillRow}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Add Skill Tag"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Type a skill and press Enter or click Add"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSkill()
                      }
                    }}
                  />
                </div>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => handleAddSkill()}
                >
                  <FiPlus size={14} />
                  <span>Add</span>
                </Button>
              </div>

              <div className={styles.quickSkillsRow}>
                <span>Suggestions:</span>
                {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.quickSkillBtn}
                    onClick={() => handleAddSkill(s)}
                  >
                    + {s}
                  </button>
                ))}
              </div>

              <div className={styles.skillPillsContainer}>
                {skills.map((skill) => (
                  <span key={skill} className={styles.skillPill}>
                    <span>{skill}</span>
                    <button
                      type="button"
                      className={styles.removeSkillBtn}
                      onClick={() => handleRemoveSkill(skill)}
                      title={`Remove ${skill}`}
                    >
                      <FiX size={13} />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                    No skills added yet. Type a skill tag above.
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Projects Showcase */}
          <Card className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Featured Projects</h2>
                <p className={styles.cardSubtitle}>
                  Showcase engineering projects, open-source work, or live applications you've built.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddProj(!showAddProj)}
              >
                <FiPlus size={14} />
                <span>{showAddProj ? 'Cancel' : 'Add Project'}</span>
              </Button>
            </div>

            {showAddProj && (
              <div className={styles.addDrawer}>
                <h4 className={styles.addDrawerTitle}>New Project Details</h4>
                <div className={styles.formGrid}>
                  <Input
                    label="Project Title *"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="e.g. AI-Powered Code Auditor"
                  />
                  <Input
                    label="Technologies Used (comma-separated)"
                    value={newProjTech}
                    onChange={(e) => setNewProjTech(e.target.value)}
                    placeholder="e.g. React, Next.js, Python, FastAPI"
                  />
                </div>
                <TextArea
                  label="Description / Impact *"
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  rows={3}
                  placeholder="What problem does it solve? What architecture did you use?"
                />
                <div className={styles.formGrid}>
                  <Input
                    label="Live Demo URL"
                    value={newProjLive}
                    onChange={(e) => setNewProjLive(e.target.value)}
                    placeholder="https://myproject.dev"
                  />
                  <Input
                    label="GitHub Repository URL"
                    value={newProjGithub}
                    onChange={(e) => setNewProjGithub(e.target.value)}
                    placeholder="https://github.com/user/project"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="primary" size="sm" onClick={handleAddProject}>
                    Add to Showcase
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddProj(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className={styles.itemList}>
              {projects.map((proj, idx) => (
                <div key={proj.id || idx} className={styles.itemCard}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemIcon}>
                      <FiCode />
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{proj.title}</h4>
                      <p className={styles.itemDescription}>{proj.description}</p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className={styles.itemTechPills}>
                          {proj.technologies.map((tech) => (
                            <span key={tech} className={styles.techPill}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={styles.itemLinks}>
                        {proj.live_url && (
                          <a
                            href={proj.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.itemLink}
                          >
                            <FiGlobe size={12} />
                            <span>Live Demo</span>
                          </a>
                        )}
                        {proj.github_url && (
                          <a
                            href={proj.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.itemLink}
                          >
                            <FiGithub size={12} />
                            <span>Source Code</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveProject(proj.id, idx)}
                      title="Delete project"
                    >
                      <FiTrash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && !showAddProj && (
                <div className={styles.emptyState}>
                  No projects added yet. Click "Add Project" above to highlight your work!
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <Button
                variant="primary"
                onClick={() => handleProfileSave()}
                loading={updateProfile.isPending}
              >
                Save All Skills & Projects
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
          </Card>
        </>
      )}

      {/* Tab 3: Experience & Education */}
      {activeTab === 'experience_education' && (
        <>
          {/* Work Experience */}
          <Card className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Work Experience</h2>
                <p className={styles.cardSubtitle}>
                  Detail your employment history, positions, responsibilities, and achievements.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddExp(!showAddExp)}
              >
                <FiPlus size={14} />
                <span>{showAddExp ? 'Cancel' : 'Add Experience'}</span>
              </Button>
            </div>

            {showAddExp && (
              <div className={styles.addDrawer}>
                <h4 className={styles.addDrawerTitle}>New Work Experience</h4>
                <div className={styles.formGrid}>
                  <Input
                    label="Role / Title *"
                    value={newExpRole}
                    onChange={(e) => setNewExpRole(e.target.value)}
                    placeholder="e.g. Lead Software Engineer"
                  />
                  <Input
                    label="Company Name *"
                    value={newExpCompany}
                    onChange={(e) => setNewExpCompany(e.target.value)}
                    placeholder="e.g. Acme Innovations"
                  />
                </div>
                <div className={styles.formGrid}>
                  <Input
                    label="Location"
                    value={newExpLocation}
                    onChange={(e) => setNewExpLocation(e.target.value)}
                    placeholder="e.g. Remote / New York, NY"
                  />
                  <Input
                    label="Start Date *"
                    value={newExpStartDate}
                    onChange={(e) => setNewExpStartDate(e.target.value)}
                    placeholder="e.g. Jan 2022"
                  />
                </div>
                <div className={styles.formGrid}>
                  <div>
                    <Input
                      label="End Date"
                      value={newExpEndDate}
                      onChange={(e) => setNewExpEndDate(e.target.value)}
                      placeholder="e.g. Present or Dec 2024"
                      disabled={newExpCurrent}
                    />
                    <label className={styles.checkboxRow} style={{ marginTop: '6px' }}>
                      <input
                        type="checkbox"
                        checked={newExpCurrent}
                        onChange={(e) => setNewExpCurrent(e.target.checked)}
                      />
                      <span>I currently work here</span>
                    </label>
                  </div>
                </div>
                <TextArea
                  label="Role Description / Highlights"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  rows={3}
                  placeholder="Key accomplishments, technologies managed, performance improvements..."
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="primary" size="sm" onClick={handleAddExperience}>
                    Add Experience
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddExp(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className={styles.itemList}>
              {experience.map((item, idx) => (
                <div key={item.id || idx} className={styles.itemCard}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemIcon}>
                      <FiBriefcase />
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{item.role}</h4>
                      <div className={styles.itemSubtitle}>{item.company}</div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemMetaItem}>
                          <FiCalendar size={12} />
                          <span>{item.start_date} – {item.current ? 'Present' : item.end_date || 'Present'}</span>
                        </span>
                        {item.location && (
                          <span className={styles.itemMetaItem}>
                            <FiMapPin size={12} />
                            <span>{item.location}</span>
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className={styles.itemDescription}>{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveExperience(item.id, idx)}
                      title="Remove experience"
                    >
                      <FiTrash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              {experience.length === 0 && !showAddExp && (
                <div className={styles.emptyState}>
                  No work experience entries added yet. Click "Add Experience" to add one!
                </div>
              )}
            </div>
          </Card>

          {/* Education */}
          <Card className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Education History</h2>
                <p className={styles.cardSubtitle}>
                  Degrees, diplomas, certifications, or academic institutions attended.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddEdu(!showAddEdu)}
              >
                <FiPlus size={14} />
                <span>{showAddEdu ? 'Cancel' : 'Add Education'}</span>
              </Button>
            </div>

            {showAddEdu && (
              <div className={styles.addDrawer}>
                <h4 className={styles.addDrawerTitle}>New Education Entry</h4>
                <div className={styles.formGrid}>
                  <Input
                    label="Degree / Certificate *"
                    value={newEduDegree}
                    onChange={(e) => setNewEduDegree(e.target.value)}
                    placeholder="e.g. B.S. in Computer Science"
                  />
                  <Input
                    label="Institution / University *"
                    value={newEduSchool}
                    onChange={(e) => setNewEduSchool(e.target.value)}
                    placeholder="e.g. Stanford University"
                  />
                </div>
                <div className={styles.formGrid}>
                  <Input
                    label="Field of Study"
                    value={newEduField}
                    onChange={(e) => setNewEduField(e.target.value)}
                    placeholder="e.g. Software Engineering & Distributed Systems"
                  />
                  <Input
                    label="Grade / GPA / Honors (Optional)"
                    value={newEduGrade}
                    onChange={(e) => setNewEduGrade(e.target.value)}
                    placeholder="e.g. 3.9 / 4.0 or First Class"
                  />
                </div>
                <div className={styles.formGrid}>
                  <Input
                    label="Start Year *"
                    value={newEduStartYear}
                    onChange={(e) => setNewEduStartYear(e.target.value)}
                    placeholder="e.g. 2018"
                  />
                  <Input
                    label="End Year (or Expected)"
                    value={newEduEndYear}
                    onChange={(e) => setNewEduEndYear(e.target.value)}
                    placeholder="e.g. 2022"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="primary" size="sm" onClick={handleAddEducation}>
                    Add Education
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddEdu(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className={styles.itemList}>
              {education.map((item, idx) => (
                <div key={item.id || idx} className={styles.itemCard}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemIcon}>
                      <FiBookOpen />
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{item.degree}</h4>
                      <div className={styles.itemSubtitle}>{item.institution}</div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemMetaItem}>
                          <FiCalendar size={12} />
                          <span>{item.start_year} – {item.end_year || 'Present'}</span>
                        </span>
                        {item.field_of_study && (
                          <span className={styles.itemMetaItem}>
                            <span>• {item.field_of_study}</span>
                          </span>
                        )}
                        {item.grade && (
                          <span className={styles.itemMetaItem}>
                            <FiAward size={12} />
                            <span>{item.grade}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveEducation(item.id, idx)}
                      title="Remove education"
                    >
                      <FiTrash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              {education.length === 0 && !showAddEdu && (
                <div className={styles.emptyState}>
                  No education history added yet. Click "Add Education" to add one!
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <Button
                variant="primary"
                onClick={() => handleProfileSave()}
                loading={updateProfile.isPending}
              >
                Save All Experience & Education
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
          </Card>
        </>
      )}

      {/* Tab 4: Resumes */}
      {activeTab === 'resumes' && (
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
      )}

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
