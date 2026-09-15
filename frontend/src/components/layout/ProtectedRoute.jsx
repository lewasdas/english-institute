import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'

const ROLE_DASHBOARDS = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="spinner-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const redirectTo = ROLE_DASHBOARDS[role] || '/'
    return <Navigate to={redirectTo} replace />
  }

  return children ? children : <Outlet />
}
