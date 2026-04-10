import { Navigate, Outlet } from 'react-router-dom'
import { getSession } from '../../services/auth.js'

function AuthGate({ allowedRoles }) {
  const session = getSession()

  if (!session) {
    return <Navigate to="/get-started" replace />
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return <Navigate to={session.user.role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard'} replace />
  }

  return <Outlet />
}

export default AuthGate
