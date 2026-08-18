import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSeekerApplications } from '@/hooks/queries/useApplicationQueries';
import { useJobs } from '@/hooks/queries/useJobQueries';
import { formatRelativeTime } from '@/utils/date';
import { FiSearch, FiMapPin, FiArrowRight } from 'react-icons/fi';
import styles from './Dashboard.module.css';

export default function SeekerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const { data: applications, isLoading: isLoadingApps } = useSeekerApplications();
  const { data: recentJobsData, isLoading: isLoadingJobs } = useJobs({ ordering: '-created_at' });
  const recentJobs = Array.isArray(recentJobsData) ? recentJobsData : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (locationQuery) params.set('location', locationQuery);
    navigate(`/jobs?${params.toString()}`);
  };

  if (isLoadingApps || isLoadingJobs) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate stats
  const totalApps = applications?.length || 0;
  const inReview = applications?.filter(a => a.status === 'UNDER_REVIEW').length || 0;
  const interviews = applications?.filter(a => a.status === 'SHORTLISTED').length || 0;

  const firstName = user?.name?.split(' ')[0] || 'Seeker';

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.greeting}>Good morning, {firstName}.</h1>
        
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <div className={styles.inputWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search for jobs..." 
              className={styles.invisibleInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.divider}></div>
          <div className={styles.inputWrapper}>
            <FiMapPin className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="City, state, or remote" 
              className={styles.invisibleInput}
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" className={styles.searchBtn}>Search</Button>
        </form>
      </div>

      <div className={styles.statsSection}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{totalApps}</span>
          <span className={styles.statLabel}>Applications</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{inReview}</span>
          <span className={styles.statLabel}>In Review</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{interviews}</span>
          <span className={styles.statLabel}>Interviews</span>
        </div>
      </div>

      <div className={styles.jobsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recommended for you</h2>
          <Link to="/jobs" className={styles.viewAll}>View all <FiArrowRight /></Link>
        </div>
        
        <div className={styles.jobsList}>
          {recentJobs.slice(0, 4).map((job: any) => {
            const companyName = job.employer?.company_name || 'Company';
            
            return (
              <Link to={`/jobs/${job.id}`} key={job.id} className={styles.jobRow}>
                <div className={styles.jobRowLeft}>
                  <div className={styles.jobTitle}>{job.title}</div>
                  <div className={styles.jobCompany}>{companyName}</div>
                </div>
                <div className={styles.jobRowRight}>
                  <span className={styles.jobLocation}>{job.location || 'Remote'}</span>
                  <span className={styles.jobTime}>{formatRelativeTime(job.created_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
