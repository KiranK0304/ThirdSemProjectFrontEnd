import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, TextArea, Select } from '@/components/ui';
import { useCreateJob, useUpdateJob } from '@/hooks/queries/useJobQueries';
import { Job, WorkplaceType, ExperienceLevel } from '@/api/types';
import { extractApiError } from '@/api/utils';
import { FiX, FiPlus } from 'react-icons/fi';
import styles from './JobModal.module.css';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
];

const WORKPLACE_TYPES: { value: WorkplaceType; label: string }[] = [
  { value: 'REMOTE', label: 'Remote (Work from anywhere)' },
  { value: 'HYBRID', label: 'Hybrid (Office + Remote)' },
  { value: 'ON_SITE', label: 'On-site (In-office)' },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'ENTRY_LEVEL', label: 'Entry-level / Junior (0-2 yrs)' },
  { value: 'MID_LEVEL', label: 'Mid-level (2-5 yrs)' },
  { value: 'SENIOR', label: 'Senior (5-8 yrs)' },
  { value: 'LEAD', label: 'Lead / Staff / Principal (8+ yrs)' },
  { value: 'EXECUTIVE', label: 'Executive / VP / Director' },
];

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open (Active)' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'AUD', label: 'AUD ($)' },
];

const POPULAR_SKILL_SUGGESTIONS = [
  'Python',
  'React',
  'TypeScript',
  'Django',
  'Node.js',
  'PostgreSQL',
  'Docker',
  'AWS',
  'Machine Learning',
  'Kubernetes',
  'GraphQL',
  'Figma',
];

export interface JobModalProps {
  open: boolean;
  onClose: () => void;
  job?: Job | null;
  onSuccess?: (job: Job) => void;
}

export const JobModal: React.FC<JobModalProps> = ({ open, onClose, job, onSuccess }) => {
  const isEditMode = !!job;
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    workplace_type: 'REMOTE' as WorkplaceType,
    experience_level: 'MID_LEVEL' as ExperienceLevel,
    employment_type: 'FULL_TIME',
    location: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    status: 'OPEN',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    if (open) {
      setApiError(null);
      setFormErrors({});
      setSkillInput('');
      if (job) {
        setFormData({
          title: job.title || '',
          department: job.department || '',
          workplace_type: (job.workplace_type as WorkplaceType) || 'REMOTE',
          experience_level: (job.experience_level as ExperienceLevel) || 'MID_LEVEL',
          employment_type: job.employment_type || 'FULL_TIME',
          location: job.location || '',
          salary_min: job.salary_min != null ? String(job.salary_min) : '',
          salary_max: job.salary_max != null ? String(job.salary_max) : '',
          salary_currency: job.salary_currency || 'USD',
          status: job.status || 'OPEN',
          description: job.description || '',
          responsibilities: job.responsibilities || '',
          requirements: job.requirements || '',
          benefits: job.benefits || '',
        });
        setSkills(Array.isArray(job.skills) ? job.skills : []);
      } else {
        setFormData({
          title: '',
          department: '',
          workplace_type: 'REMOTE',
          experience_level: 'MID_LEVEL',
          employment_type: 'FULL_TIME',
          location: '',
          salary_min: '',
          salary_max: '',
          salary_currency: 'USD',
          status: 'OPEN',
          description: '',
          responsibilities: '',
          requirements: '',
          benefits: '',
        });
        setSkills([]);
      }
    }
  }, [open, job]);

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'title' || field === 'description') {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddSkill = (skillToAdd?: string) => {
    const raw = (skillToAdd !== undefined ? skillToAdd : skillInput).trim();
    if (!raw) return;

    // Support comma-separated inputs
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSkills((prev) => {
      const set = new Set(prev);
      parts.forEach((p) => set.add(p));
      return Array.from(set);
    });

    if (skillToAdd === undefined) {
      setSkillInput('');
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const errors: { title?: string; description?: string } = {};
    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Job overview/description is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload: Partial<Job> = {
      title: formData.title.trim(),
      department: formData.department.trim(),
      workplace_type: formData.workplace_type,
      experience_level: formData.experience_level,
      employment_type: formData.employment_type,
      location: formData.location.trim(),
      skills: skills,
      description: formData.description.trim(),
      responsibilities: formData.responsibilities.trim(),
      requirements: formData.requirements.trim(),
      benefits: formData.benefits.trim(),
      salary_min: formData.salary_min ? formData.salary_min : null,
      salary_max: formData.salary_max ? formData.salary_max : null,
      salary_currency: formData.salary_currency || 'USD',
    };

    if (isEditMode) {
      payload.status = formData.status as Job['status'];
    }

    try {
      if (isEditMode && job) {
        const updated = await updateJob.mutateAsync({ id: job.id, data: payload });
        onSuccess?.(updated);
      } else {
        const created = await createJob.mutateAsync(payload);
        onSuccess?.(created);
      }
      onClose();
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  const isPending = createJob.isPending || updateJob.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
      maxWidth="720px"
    >
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {apiError && <div className={styles.errorMessage}>{apiError}</div>}

          {/* SECTION 1: ROLE OVERVIEW */}
          <div className={styles.sectionHeading}>1. Position Overview</div>

          <div className={styles.row}>
            <Input
              label="Job Title *"
              value={formData.title}
              onChange={handleChange('title')}
              placeholder="e.g. Senior Frontend Engineer"
              error={formErrors.title}
              disabled={isPending}
              autoFocus
            />
            <Input
              label="Department / Team"
              value={formData.department}
              onChange={handleChange('department')}
              placeholder="e.g. Engineering, AI Research, Design"
              disabled={isPending}
            />
          </div>

          <div className={styles.rowThree}>
            <Select
              label="Workplace Mode *"
              options={WORKPLACE_TYPES}
              value={formData.workplace_type}
              onChange={handleChange('workplace_type')}
              disabled={isPending}
            />
            <Select
              label="Employment Type *"
              options={EMPLOYMENT_TYPES}
              value={formData.employment_type}
              onChange={handleChange('employment_type')}
              disabled={isPending}
            />
            <Select
              label="Experience Level *"
              options={EXPERIENCE_LEVELS}
              value={formData.experience_level}
              onChange={handleChange('experience_level')}
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Location (City, State / Country)"
              value={formData.location}
              onChange={handleChange('location')}
              placeholder="e.g. San Francisco, CA (or 'Worldwide' for Remote)"
              disabled={isPending}
            />
          </div>

          {/* SECTION 2: REQUIRED SKILLS & TECH STACK */}
          <div className={styles.sectionHeading}>2. Required Skills & Competencies</div>
          <div className={styles.skillsContainer}>
            <div className={styles.skillInputRow}>
              <Input
                placeholder="Add a required skill (e.g. Python, React, Docker) and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                disabled={isPending}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddSkill()}
                disabled={!skillInput.trim() || isPending}
              >
                <FiPlus size={14} />
                <span>Add</span>
              </Button>
            </div>

            {skills.length > 0 && (
              <div className={styles.skillTags}>
                {skills.map((skill) => (
                  <span key={skill} className={styles.skillBadge}>
                    <span>{skill}</span>
                    <button
                      type="button"
                      className={styles.removeSkillBtn}
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove skill ${skill}`}
                      disabled={isPending}
                    >
                      <FiX size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className={styles.suggestions}>
              <span className={styles.suggestionLabel}>Suggestions:</span>
              {POPULAR_SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 6).map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  className={styles.suggestionChip}
                  onClick={() => handleAddSkill(suggested)}
                  disabled={isPending}
                >
                  + {suggested}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: COMPENSATION */}
          <div className={styles.sectionHeading}>3. Compensation & Pay Scale</div>
          <div className={styles.rowThree}>
            <Input
              label="Min Salary (Annual)"
              type="number"
              value={formData.salary_min}
              onChange={handleChange('salary_min')}
              placeholder="e.g. 100000"
              disabled={isPending}
            />
            <Input
              label="Max Salary (Annual)"
              type="number"
              value={formData.salary_max}
              onChange={handleChange('salary_max')}
              placeholder="e.g. 140000"
              disabled={isPending}
            />
            <Select
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={formData.salary_currency}
              onChange={handleChange('salary_currency')}
              disabled={isPending}
            />
          </div>

          {/* SECTION 4: DETAILED JOB CONTENT */}
          <div className={styles.sectionHeading}>4. Job Details & Role Specifications</div>

          <div className={styles.formGroup}>
            <TextArea
              label="Role Overview / Summary *"
              rows={4}
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Describe the company mission, what this role solves, and the high-level scope..."
              error={formErrors.description}
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <TextArea
              label="Key Responsibilities"
              rows={4}
              value={formData.responsibilities}
              onChange={handleChange('responsibilities')}
              placeholder="• Architect and ship clean, scalable features&#10;• Collaborate with product and design to spec technical solutions&#10;• Mentor junior engineers and participate in code reviews..."
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <TextArea
              label="Requirements & Qualifications"
              rows={4}
              value={formData.requirements}
              onChange={handleChange('requirements')}
              placeholder="• 4+ years of production experience with TypeScript and modern frameworks&#10;• Strong understanding of distributed systems and API design&#10;• BS in Computer Science or equivalent practical experience..."
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <TextArea
              label="Benefits & Perks"
              rows={3}
              value={formData.benefits}
              onChange={handleChange('benefits')}
              placeholder="• Comprehensive medical, dental, and vision health coverage&#10;• Generous equity / stock options package&#10;• Flexible PTO and annual learning/equipment stipend..."
              disabled={isPending}
            />
          </div>

          {isEditMode && (
            <>
              <div className={styles.sectionHeading}>5. Visibility & Status</div>
              <div className={styles.formGroup}>
                <Select
                  label="Job Status"
                  options={STATUS_OPTIONS}
                  value={formData.status}
                  onChange={handleChange('status')}
                  disabled={isPending}
                />
              </div>
            </>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {isEditMode ? 'Save Changes' : 'Publish Job Posting'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default JobModal;
