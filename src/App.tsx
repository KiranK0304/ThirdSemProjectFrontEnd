import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppLayout, GuestLayout } from '@/components/layout/Layout'
import { RequireAuth, GuestOnly } from '@/components/layout/RequireAuth'
import { LoadingSpinner } from '@/components/ui'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import JobList from '@/pages/jobs/JobList'
import JobDetail from '@/pages/jobs/JobDetail'
import SeekerDashboard from '@/pages/seeker/Dashboard'
import SeekerApplications from '@/pages/seeker/Applications'
import SeekerApplicationDetail from '@/pages/seeker/ApplicationDetail'
import SeekerProfile from '@/pages/seeker/Profile'
import EmployerDashboard from '@/pages/employer/Dashboard'
import EmployerJobs from '@/pages/employer/Jobs'
import EmployerJobForm from '@/pages/employer/JobForm'
import EmployerApplicants from '@/pages/employer/Applicants'
import EmployerProfile from '@/pages/employer/Profile'
import Messages from '@/pages/messages/Messages'

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
      {/* Guest-only routes (login/register) */}
      <Route element={<GuestOnly><GuestLayout /></GuestOnly>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Main app routes with sidebar layout */}
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* Unified Messages route accessible to authenticated users */}
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <Messages />
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
