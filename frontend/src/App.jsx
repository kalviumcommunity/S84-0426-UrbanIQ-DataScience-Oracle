import { Navigate, Route, Routes } from 'react-router-dom'
import AuthGate from './components/layout/AuthGate.jsx'
import Layout from './components/layout/Layout.jsx'
import PublicOnlyGate from './components/layout/PublicOnlyGate.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Complaints from './pages/Complaints.jsx'
import GetStarted from './pages/GetStarted.jsx'
import Login from './pages/Login.jsx'
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
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route element={<AuthGate allowedRoles={["citizen"]} />}>
        <Route element={<Layout />}>
          <Route path="citizen" element={<Navigate to="/citizen/dashboard" replace />} />
          <Route path="citizen/dashboard" element={<Complaints />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/get-started" replace />} />
    </Routes>
  )
}

export default App
