const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
  FREELANCE: 'Freelance',
}

export function formatEmploymentType(type: string): string {
  return EMPLOYMENT_TYPE_LABELS[type] || type
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  DRAFT: 'Draft',
  OPEN: 'Open',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
}

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] || status
}

export function getApplicationStatusVariant(status: string): 'neutral' | 'amber' | 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'SUBMITTED': return 'neutral'
    case 'UNDER_REVIEW': return 'warning'
    case 'SHORTLISTED': return 'success'
    case 'REJECTED': return 'danger'
    default: return 'neutral'
  }
}

export function getJobStatusVariant(status: string): 'neutral' | 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'OPEN': return 'success'
    case 'CLOSED': return 'danger'
    case 'DRAFT': return 'neutral'
    case 'ARCHIVED': return 'neutral'
    default: return 'neutral'
  }
}
