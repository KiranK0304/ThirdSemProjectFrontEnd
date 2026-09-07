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
  is_primary?: boolean
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
  account_type: 'EMPLOYER' | 'SEEKER' | null
  is_active: boolean
  is_staff: boolean
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

export interface SavedJob {
  id: number
  job: Job
  created_at: string
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

export interface CandidateAnalysisSummary {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  overall_score: number | null
  recommendation: 'STRONG_FIT' | 'MODERATE_FIT' | 'WEAK_FIT' | string
  summary: string
  skills: string[]
  total_years_experience: number
  strengths: string[]
  concerns: string[]
}

export interface Application {
  id: number
  job: Job
  seeker: ApplicationSeeker
  resume: Resume | null
  cover_letter: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'OFFERED' | 'REJECTED' | 'WITHDRAWN'
  analysis?: CandidateAnalysisSummary | null
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

export type ChatRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ChatEmployer {
  id: number
  user_id: number
  user_email: string
  user_name: string
  company_name: string
  website: string
  description: string
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface ChatSeeker {
  id: number
  user_id: number
  user_email: string
  user_name: string
  phone: string
  bio: string
}

export interface ChatMessage {
  id: number
  chat_request: number
  sender_id: number
  sender_email: string
  sender_name: string
  content: string
  is_read: boolean
  is_from_me: boolean
  created_at: string
}

export interface ChatRequest {
  id: number
  seeker: ChatSeeker
  employer: ChatEmployer
  status: ChatRequestStatus
  initial_message: string
  created_at: string
  updated_at: string
  latest_message: {
    id: number
    sender_id: number
    sender_name: string
    content: string
    created_at: string
    is_read: boolean
  } | null
  unread_messages_count: number
}

export interface RecommendedJob extends Job {
  match_score: number
}

export interface JobBookmark {
  id: number
  job: Job
  created_at: string
}

export interface Interview {
  id: number
  application_id: number
  job_title: string
  seeker_email: string
  scheduled_at: string
  duration_minutes: number
  meeting_url: string
  notes: string
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'
  created_at: string
  updated_at: string
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

export interface CriterionDetail {
  score: number
  reason: string
}

export interface RankedCandidate {
  rank: number
  candidate_id: number
  application_id: number
  candidate_name: string
  candidate_email: string
  criteria_scores: Record<string, number>
  criteria_details: Record<string, CriterionDetail>
  final_score: number
  resume_url?: string
}

export interface JobRankingResponse {
  job_id: number
  job_title: string
  weights_used: Record<string, number>
  total_candidates: number
  ranked_candidates: RankedCandidate[]
  created_at: string
}

export interface JobCriteriaResponse {
  job_id: number
  weights: Record<string, number>
  is_custom: boolean
}

export interface CopilotAction {
  action_type: 'shortlist' | 'copy_text' | 'filter' | 'inspect' | string
  label: string
  application_id?: number
  candidate_id?: number
  candidate_name?: string
  payload?: string
}

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CopilotRequest {
  message: string
  history?: CopilotMessage[]
  candidate_ids?: number[]
}

export interface CopilotResponse {
  reply: string
  suggested_actions: CopilotAction[]
}

// ── Modern Modular Recruiter Copilot Types ──────────────────────────────────

export interface CopilotSession {
  id: number
  job_id: number
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface CopilotToolCall {
  name: string
  arguments: Record<string, any>
}

export interface CopilotEvidenceExcerpt {
  section: string
  details: string
}

export interface CopilotCandidateProfile {
  application_id: number
  name: string
  email: string
  overall_score: number
  recommendation: string
  years_experience?: number
  skills?: string[]
  key_skills?: string[]
  summary?: string
  strengths?: string[]
  concerns?: string[]
  relevant_evidence?: CopilotEvidenceExcerpt[]
}

export interface CopilotMessageMetadata {
  tools_called?: CopilotToolCall[]
  candidates?: CopilotCandidateProfile[] | Record<string, any>
  error?: string
}

export interface CopilotMessageItem {
  id: number
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  metadata: CopilotMessageMetadata
  created_at: string
}

export interface SendMessageResponse {
  session_id: number
  user_message: CopilotMessageItem
  assistant_message: CopilotMessageItem
}
