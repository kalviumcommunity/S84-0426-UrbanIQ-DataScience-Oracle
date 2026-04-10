import { Navigate, Outlet } from 'react-router-dom'
import { getSession } from '../../services/auth.js'

function PublicOnlyGate() {
  const session = getSession()

  if (session) {
    return <Navigate to={session.user.role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard'} replace />
  }

  return <Outlet />
}

export default PublicOnlyGate
