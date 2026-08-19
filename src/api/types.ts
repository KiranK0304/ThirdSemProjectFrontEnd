export interface EmployerProfile {
  id: number
  company_name: string
  website: string
  description: string
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  updated_at: string
}

export interface Resume {
  id: number
  title: string
  file: string
  file_url: string
  created_at: string
  updated_at: string
}

export interface SeekerProfile {
  id: number
  phone: string
  bio: string
  resumes: Resume[]
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  email: string
  name: string
  account_type: 'EMPLOYER' | 'SEEKER'
  is_active: boolean
  date_joined: string
  employer_profile: EmployerProfile | null
  seeker_profile: SeekerProfile | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: {
    id: number
    email: string
    name: string
    account_type: 'EMPLOYER' | 'SEEKER'
  }
}

export interface RegisterRequest {
  email: string
  password: string
  password_confirm: string
  name: string
  account_type: 'EMPLOYER' | 'SEEKER'
}

export interface JobEmployer {
  id: number
  company_name: string
  website: string
  description: string
}

export interface Job {
  id: number
  title: string
  description: string
  location: string
  employment_type: string
  salary_min: string | null
  salary_max: string | null
  salary_currency: string
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED'
  employer: JobEmployer
  created_at: string
  updated_at: string
}

export interface ApplicationSeeker {
  id: number
  user_email: string
  user_name: string
  phone: string
  bio: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: number
  job: Job
  seeker: ApplicationSeeker
  resume: Resume | null
  cover_letter: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED'
  created_at: string
  updated_at: string
}

export interface JobFilters {
  search?: string
  employment_type?: string
  location?: string
  min_salary?: number
  ordering?: string
}

export interface EmployerJobFilters {
  status?: string
  search?: string
  ordering?: string
}

export interface ApiError {
  detail?: string
  [key: string]: unknown
}

export interface Notification {
  id: number
  notification_type: string
  title: string
  message: string
  related_url: string
  is_read: boolean
  created_at: string
}
