import React, { useState } from 'react';
import { LoadingSpinner, EmptyState, Tag } from '@/components/ui';
import { useAdminEmployers, useApproveEmployer, useRejectEmployer } from '@/hooks/queries/useAdminQueries';
import { useJobs } from '@/hooks/queries/useJobQueries';
import { formatRelativeTime } from '@/utils/date';
import styles from './AdminDashboard.module.css';

type StatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const { data: employers = [], isLoading } = useAdminEmployers(statusFilter || undefined);
  const { data: jobs = [] } = useJobs();
  const approveMutation = useApproveEmployer();
  const rejectMutation = useRejectEmployer();

  const pendingCount = employers.filter(e => e.verification_status === 'PENDING').length;
  const approvedCount = employers.filter(e => e.verification_status === 'APPROVED').length;
  const rejectedCount = employers.filter(e => e.verification_status === 'REJECTED').length;

  const getStatusVariant = (status: string): 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <section className={styles.header}>
        <h1 className={styles.headerTitle}>Admin Dashboard</h1>
        <p className={styles.headerSubtitle}>Manage employer verifications and platform activity</p>
      </section>

      {/* Stats */}
      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{employers.length}</p>
          <p className={styles.statLabel}>Total Employers</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{pendingCount}</p>
          <p className={styles.statLabel}>Pending Review</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{approvedCount}</p>
          <p className={styles.statLabel}>Approved</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{jobs.length}</p>
          <p className={styles.statLabel}>Total Jobs</p>
        </div>
      </section>

      {/* Filters */}
      <div className={styles.filters}>
        {(['', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((filter) => (
          <button
            key={filter}
            className={`${styles.filterBtn} ${statusFilter === filter ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter(filter)}
          >
            {filter || 'All'}
          </button>
        ))}
      </div>

      {/* Employer Table */}
      {employers.length === 0 ? (
        <EmptyState
          title="No employers found"
          description={statusFilter ? `No employers with status "${statusFilter}".` : 'No employers registered yet.'}
        />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Website</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employers.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className={styles.companyName}>{emp.company_name || 'Unnamed Company'}</div>
                    <div className={styles.companyEmail}>{emp.user_email}</div>
                  </td>
                  <td>
                    {emp.website ? (
                      <a href={emp.website} target="_blank" rel="noopener noreferrer">
                        {emp.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <Tag variant={getStatusVariant(emp.verification_status)}>
                      {emp.verification_status}
                    </Tag>
                  </td>
                  <td>{formatRelativeTime(emp.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      {emp.verification_status !== 'APPROVED' && (
                        <button
                          className={styles.approveBtn}
                          onClick={() => approveMutation.mutate(emp.id)}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </button>
                      )}
                      {emp.verification_status !== 'REJECTED' && (
                        <button
                          className={styles.rejectBtn}
                          onClick={() => rejectMutation.mutate(emp.id)}
                          disabled={rejectMutation.isPending}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
