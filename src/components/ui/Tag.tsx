import React from 'react';
import styles from './Tag.module.css';

export type TagVariant =
  | 'neutral'
  | 'amber'
  | 'success'
  | 'danger'
  | 'warning'
  // Application status variants
  | 'applied'
  | 'inReview'
  | 'interview'
  | 'offered'
  | 'rejected'
  // Job type variants
  | 'fullTime'
  | 'partTime'
  | 'remote'
  | 'internship'
  | 'new';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: TagVariant;
}

const STATUS_MAP: Record<string, TagVariant> = {
  SUBMITTED: 'applied',
  UNDER_REVIEW: 'inReview',
  SHORTLISTED: 'interview',
  OFFERED: 'offered',
  REJECTED: 'rejected',
  WITHDRAWN: 'neutral',
};

const TYPE_MAP: Record<string, TagVariant> = {
  FULL_TIME: 'fullTime',
  PART_TIME: 'partTime',
  CONTRACT: 'neutral',
  INTERNSHIP: 'internship',
  TEMPORARY: 'neutral',
  FREELANCE: 'neutral',
};

export function statusToVariant(status: string): TagVariant {
  return STATUS_MAP[status] || 'neutral';
}

export function typeToVariant(employmentType: string): TagVariant {
  return TYPE_MAP[employmentType] || 'neutral';
}

export function typeToLabel(employmentType: string): string {
  const labels: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    INTERNSHIP: 'Internship',
    TEMPORARY: 'Temporary',
    FREELANCE: 'Freelance',
  };
  return labels[employmentType] || employmentType;
}

export const Tag: React.FC<TagProps> = ({ variant, children, className = '', ...props }) => {
  return (
    <span className={`${styles.tag} ${styles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
