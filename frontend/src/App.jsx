import { Navigate, Route, Routes } from 'react-router-dom'
import AuthGate from './components/layout/AuthGate.jsx'
import Layout from './components/layout/Layout.jsx'
import PublicOnlyGate from './components/layout/PublicOnlyGate.jsx'
import AdminAnalytics from './pages/AdminAnalytics.jsx'
import AdminOverview from './pages/AdminOverview.jsx'
import AdminTeamManagement from './pages/AdminTeamManagement.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Complaints from './pages/Complaints.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import GetStarted from './pages/GetStarted.jsx'
import Login from './pages/Login.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GetStarted />} />
      <Route path="get-started" element={<GetStarted />} />

      <Route element={<PublicOnlyGate />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      <Route element={<AuthGate allowedRoles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route path="admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="admin/dashboard" element={<Navigate to="/admin/overview" replace />} />
          <Route path="admin/overview" element={<AdminOverview />} />
          <Route path="admin/work-queue" element={<Dashboard />} />
          <Route path="admin/analytics" element={<AdminAnalytics />} />
          <Route path="admin/team-management" element={<AdminTeamManagement />} />
          <Route path="admin/notifications" element={<Notifications />} />
          <Route path="admin/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<AuthGate allowedRoles={["citizen"]} />}>
        <Route element={<Layout />}>
          <Route path="citizen" element={<Navigate to="/citizen/dashboard" replace />} />
          <Route path="citizen/dashboard" element={<Complaints />} />
          <Route path="citizen/how-it-works" element={<HowItWorks />} />
          <Route path="citizen/notifications" element={<Notifications />} />
          <Route path="citizen/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/get-started" replace />} />
    </Routes>
  )
}

export default App
