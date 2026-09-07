import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppLayout, GuestLayout } from '@/components/layout/Layout'
import { RequireAuth, GuestOnly } from '@/components/layout/RequireAuth'
import { LoadingSpinner } from '@/components/ui'

// Pages
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import JobList from '@/pages/jobs/JobList'
import JobDetail from '@/pages/jobs/JobDetail'
import SeekerDashboard from '@/pages/seeker/Dashboard'
import SeekerApplications from '@/pages/seeker/Applications'
import SeekerApplicationDetail from '@/pages/seeker/ApplicationDetail'
import SeekerProfile from '@/pages/seeker/Profile'
import SavedJobs from '@/pages/seeker/SavedJobs'
import EmployerDashboard from '@/pages/employer/Dashboard'
import EmployerJobs from '@/pages/employer/Jobs'
import EmployerJobDetail from '@/pages/employer/JobDetail'
import EmployerJobForm from '@/pages/employer/JobForm'
import EmployerApplicants from '@/pages/employer/Applicants'
import EmployerProfile from '@/pages/employer/Profile'
import ResumeShortlist from '@/pages/employer/ResumeShortlist'
import AdminDashboard from '@/pages/admin/AdminDashboard'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public standalone Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Guest-only routes (login/register with seamless 3D card flip) */}
      <Route element={<GuestOnly><GuestLayout /></GuestOnly>}>
        <Route element={<Auth />}>
          <Route path="/login" element={<></>} />
          <Route path="/register" element={<></>} />
        </Route>
      </Route>

      {/* Main app routes with sidebar layout */}
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth role="ADMIN">
              <AdminDashboard />
            </RequireAuth>
          }
        />

        {/* Seeker routes */}
        <Route
          path="/seeker/dashboard"
          element={
            <RequireAuth role="SEEKER">
              <SeekerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/seeker/applications"
          element={
            <RequireAuth role="SEEKER">
              <SeekerApplications />
            </RequireAuth>
          }
        />
        <Route
          path="/seeker/applications/:id"
          element={
            <RequireAuth role="SEEKER">
              <SeekerApplicationDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/seeker/profile"
          element={
            <RequireAuth role="SEEKER">
              <SeekerProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/seeker/saved-jobs"
          element={
            <RequireAuth role="SEEKER">
              <SavedJobs />
            </RequireAuth>
          }
        />

        {/* Employer routes */}
        <Route
          path="/employer/dashboard"
          element={
            <RequireAuth role="EMPLOYER">
              <EmployerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/jobs"
          element={
            <RequireAuth role="EMPLOYER">
              <EmployerJobs />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/jobs/:id"
          element={
            <RequireAuth role="EMPLOYER">
              <EmployerJobDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/shortlist"
          element={
            <RequireAuth role="EMPLOYER">
              <ResumeShortlist />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/jobs/new"
          element={
            <RequireAuth role="EMPLOYER">
              <EmployerJobForm />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/jobs/:id/edit"
          element={
            <RequireAuth role="EMPLOYER">
              <EmployerJobForm />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/jobs/:id/applicants"
          element={
            <RequireAuth role="EMPLOYER">
              <EmployerApplicants />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/profile"
          element={
            <RequireAuth role="EMPLOYER">
              <EmployerProfile />
            </RequireAuth>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
