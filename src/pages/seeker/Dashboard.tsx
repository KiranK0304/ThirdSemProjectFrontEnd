import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, LoadingSpinner, CompanyAvatar, Tag } from '@/components/ui';
import { typeToVariant, typeToLabel } from '@/components/ui/Tag';
import { useAuth } from '@/context/AuthContext';
import { useSeekerApplications } from '@/hooks/queries/useApplicationQueries';
import { useRecommendedJobs, useSavedJobs, useSaveJob, useUnsaveJob } from '@/hooks/queries/useJobQueries';
import { formatRelativeTime } from '@/utils/date';
import {
  FiSearch,
  FiMapPin,
  FiFileText,
  FiClock,
  FiCalendar,
  FiStar,
  FiBookmark,
} from 'react-icons/fi';
import styles from './Dashboard.module.css';

const POPULAR_SEARCHES = [
  'Frontend Developer',
  'Product Manager',
  'Data Analyst',
  'UI/UX Designer',
];

export default function SeekerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const { data: applications, isLoading: isLoadingApps } = useSeekerApplications();
  const { data: recommendedJobs, isLoading: isLoadingRecs } = useRecommendedJobs();
  const { data: savedJobs = [], isLoading: isLoadingSaved } = useSavedJobs();
  const saveJob = useSaveJob();
  const unsaveJob = useUnsaveJob();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (locationQuery) params.set('location', locationQuery);
    navigate(`/jobs?${params.toString()}`);
  };

  const handlePopularSearch = (term: string) => {
    navigate(`/jobs?search=${encodeURIComponent(term)}`);
  };

  const isSaved = (jobId: number) => savedJobs.some((s) => s.job.id === jobId);

  const toggleSave = (e: React.MouseEvent, jobId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved(jobId)) {
      unsaveJob.mutate(jobId);
    } else {
      saveJob.mutate(jobId);
    }
  };

  if (isLoadingApps || isLoadingRecs || isLoadingSaved) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate stats
  const totalApps = applications?.length || 0;
  const inReview = applications?.filter((a) => a.status === 'UNDER_REVIEW').length || 0;
  const interviews = applications?.filter((a) => a.status === 'SHORTLISTED').length || 0;
  const offers = applications?.filter((a) => a.status === 'OFFERED').length || 0;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const jobs = Array.isArray(recommendedJobs) ? recommendedJobs : [];

  // Check if a job was posted recently (within 2 days)
  const isNew = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 2 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className={styles.dashboardGrid}>
      {/* ── LEFT COLUMN ── */}
      <div className={styles.mainColumn}>
        {/* Hero Welcome Card */}
        <div className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div className={styles.heroText}>
              <h1 className={styles.greeting}>
                Good morning, {firstName} 👋
              </h1>
              <p className={styles.subtitle}>
                Find the right opportunity and build your future.
              </p>
            </div>
            <div className={styles.heroIllustration}>💼</div>
          </div>

          <form className={styles.searchBar} onSubmit={handleSearch}>
            <div className={styles.inputWrapper}>
              <FiSearch className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Job title, keyword or company"
                className={styles.invisibleInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.inputWrapper}>
              <FiMapPin className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Location"
                className={styles.invisibleInput}
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className={styles.searchBtn}
            >
              Search Jobs
            </Button>
          </form>

          <div className={styles.popularTags}>
            <span className={styles.popularLabel}>Popular searches:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                className={styles.popularTag}
                onClick={() => handlePopularSearch(term)}
                type="button"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className={styles.recommendedCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recommended Jobs</h2>
            <Link to="/jobs" className={styles.viewAll}>
              View all jobs
            </Link>
          </div>

          <div className={styles.jobsList}>
            {jobs.length === 0 && (
              <p className={styles.emptyText}>
                No recommendations yet. Apply to jobs or save some to get
                personalised suggestions.
              </p>
            )}
            {jobs.slice(0, 5).map((job) => {
              const companyName =
                job.employer?.company_name || 'Company';
              return (
                <Link
                  to={`/jobs/${job.id}`}
                  key={job.id}
                  className={styles.jobRow}
                >
                  <CompanyAvatar name={companyName} size={40} />
                  <div className={styles.jobInfo}>
                    <p className={styles.jobTitle}>{job.title}</p>
                    <div className={styles.jobMeta}>
                      <span>{companyName}</span>
                      <span className={styles.metaDot} />
                      <span>{job.location || 'Remote'}</span>
                    </div>
                  </div>
                  <div className={styles.jobTags}>
                    <Tag variant={typeToVariant(job.employment_type)}>
                      {typeToLabel(job.employment_type)}
                    </Tag>
                    {isNew(job.created_at) && (
                      <Tag variant="new">New</Tag>
                    )}
                  </div>
                  <button
                    className={`${styles.bookmarkBtn} ${isSaved(job.id) ? styles.bookmarkBtnActive : ''}`}
                    onClick={(e) => toggleSave(e, job.id)}
                    title={isSaved(job.id) ? 'Unsave' : 'Save'}
                    type="button"
                  >
                    <FiBookmark
                      fill={isSaved(job.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className={styles.sideColumn}>
        {/* Application Overview */}
        <div className={styles.overviewCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Application Overview</h2>
            <Link to="/seeker/applications" className={styles.viewAll}>
              View all
            </Link>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div
                className={`${styles.statIconBox} ${styles.statIconApplications}`}
              >
                <FiFileText />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{totalApps}</span>
                <span className={styles.statLabel}>Applications</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <div
                className={`${styles.statIconBox} ${styles.statIconReview}`}
              >
                <FiClock />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{inReview}</span>
                <span className={styles.statLabel}>In Review</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <div
                className={`${styles.statIconBox} ${styles.statIconInterviews}`}
              >
                <FiCalendar />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{interviews}</span>
                <span className={styles.statLabel}>Interviews</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <div
                className={`${styles.statIconBox} ${styles.statIconOffers}`}
              >
                <FiStar />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{offers}</span>
                <span className={styles.statLabel}>Offers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Jobs Widget */}
        <div className={styles.savedCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Saved Jobs</h2>
            <Link to="/seeker/saved-jobs" className={styles.viewAll}>
              View all
            </Link>
          </div>

          {savedJobs.length === 0 ? (
            <p className={styles.emptyText}>No saved jobs yet.</p>
          ) : (
            <div className={styles.savedList}>
              {savedJobs.slice(0, 4).map((saved) => (
                <Link
                  to={`/jobs/${saved.job.id}`}
                  key={saved.id}
                  className={styles.savedRow}
                >
                  <CompanyAvatar
                    name={
                      saved.job.employer?.company_name || 'Company'
                    }
                    size={36}
                  />
                  <div className={styles.savedInfo}>
                    <p className={styles.savedTitle}>
                      {saved.job.title}
                    </p>
                    <span className={styles.savedMeta}>
                      {saved.job.employer?.company_name || 'Company'}
                      {saved.job.location
                        ? ` · ${saved.job.location}`
                        : ''}
                      {' · '}
                      Saved {formatRelativeTime(saved.created_at)}
                    </span>
                  </div>
                  <span className={styles.savedBookmark}>
                    <FiBookmark fill="currentColor" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
