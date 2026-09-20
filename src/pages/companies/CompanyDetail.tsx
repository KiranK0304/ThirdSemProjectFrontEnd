import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCompany } from '@/hooks/queries/useCompanyQueries'
import { Tag, LoadingSpinner, ErrorState, EmptyState } from '@/components/ui'
import { formatEmploymentType, formatWorkplaceType, formatExperienceLevel } from '@/utils/format'
import { formatSalary } from '@/utils/date'
import {
  FiArrowLeft,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiExternalLink,
  FiCheckCircle,
  FiBriefcase,
  FiLinkedin,
  FiTwitter,
  FiArrowRight,
} from 'react-icons/fi'
import styles from './CompanyDetail.module.css'

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const companyId = Number(id)
  const { data: company, isLoading, isError, error, refetch } = useCompany(companyId)

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError || !company) {
    return (
      <div className={styles.container}>
        <Link to="/jobs" className={styles.backLink}>
          <FiArrowLeft /> Back to Jobs
        </Link>
        <ErrorState
          message={error instanceof Error ? error.message : 'Company profile not found'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const activeJobs = company.active_jobs || []
  const initial = (company.company_name || 'C').charAt(0).toUpperCase()

  return (
    <div className={styles.container}>
      <Link to="/jobs" className={styles.backLink}>
        <FiArrowLeft /> Back to All Jobs
      </Link>

      {/* ── Company Hero Banner Card ── */}
      <div className={styles.bannerCard}>
        <div className={styles.headerRow}>
          <div className={styles.companyLogo}>{initial}</div>

          <div className={styles.headerMeta}>
            <div className={styles.titleRow}>
              <h1 className={styles.companyName}>{company.company_name}</h1>
              {company.verification_status === 'APPROVED' && (
                <span className={styles.verifiedBadge}>
                  <FiCheckCircle size={12} />
                  <span>VERIFIED EMPLOYER</span>
                </span>
              )}
            </div>

            {company.tagline && <p className={styles.tagline}>{company.tagline}</p>}

            {/* Info Chips Strip */}
            <div className={styles.infoStrip}>
              {company.headquarters && (
                <span className={styles.infoItem}>
                  <FiMapPin className={styles.infoIcon} />
                  <span>{company.headquarters}</span>
                </span>
              )}

              {company.company_size && (
                <span className={styles.infoItem}>
                  <FiUsers className={styles.infoIcon} />
                  <span>{company.company_size} employees</span>
                </span>
              )}

              {company.founded_year && (
                <span className={styles.infoItem}>
                  <FiCalendar className={styles.infoIcon} />
                  <span>Founded {company.founded_year}</span>
                </span>
              )}

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  <span>Website</span>
                  <FiExternalLink size={12} />
                </a>
              )}

              {company.social_linkedin && (
                <a
                  href={company.social_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  <FiLinkedin size={13} />
                  <span>LinkedIn</span>
                </a>
              )}

              {company.social_twitter && (
                <a
                  href={company.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  <FiTwitter size={13} />
                  <span>Twitter</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Sections ── */}
      <div className={styles.contentGrid}>
        {/* About Section */}
        {company.description && (
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>About {company.company_name}</h2>
            <p className={styles.descriptionText}>{company.description}</p>
          </div>
        )}

        {/* Culture & Perks Section */}
        {Array.isArray(company.perks) && company.perks.length > 0 && (
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Culture, Benefits & Perks</h2>
            <div className={styles.perksCloud}>
              {company.perks.map((perk) => (
                <div key={perk} className={styles.perkPill}>
                  <span className={styles.perkDot} />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Open Positions Section */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            <FiBriefcase size={18} />
            <span>Open Positions ({activeJobs.length})</span>
          </h2>

          {activeJobs.length === 0 ? (
            <EmptyState
              title="No open positions right now"
              description="This company currently has no active job postings. Please check back later."
            />
          ) : (
            <div className={styles.jobsGrid}>
              {activeJobs.map((job) => {
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'USD')

                return (
                  <div key={job.id} className={styles.jobItemCard}>
                    <div className={styles.jobItemLeft}>
                      <Link to={`/jobs/${job.id}`} className={styles.jobItemTitle}>
                        {job.title}
                      </Link>
                      <div className={styles.jobItemBadges}>
                        {job.department && <Tag variant="neutral">{job.department}</Tag>}
                        <Tag variant="neutral">{formatWorkplaceType(job.workplace_type)}</Tag>
                        {job.experience_level && (
                          <Tag variant="neutral">{formatExperienceLevel(job.experience_level)}</Tag>
                        )}
                        <Tag variant="neutral">{formatEmploymentType(job.employment_type)}</Tag>
                        {salary && <Tag variant="neutral">{salary}</Tag>}
                      </div>
                    </div>

                    <div className={styles.jobItemRight}>
                      <Link to={`/jobs/${job.id}`} className={styles.viewJobBtn}>
                        <span>View Role</span>
                        <FiArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
