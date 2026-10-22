import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppHeader from './AppHeader.jsx'

export function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <Outlet />
    </div>
  )
}

export function PublicOnlyLayout() {
  const { isAuthenticated } = useAuth()

  return isAuthenticated ? <Navigate to="/devices" replace /> : <Outlet />
}

export function HomeRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/devices' : '/login'} replace />
}
