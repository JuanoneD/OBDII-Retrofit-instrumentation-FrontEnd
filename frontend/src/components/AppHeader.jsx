import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="app-header">
      <div className="app-header-content">
        <Link className="brand-link" to="/devices" aria-label="Ir para dispositivos">
          <span className="brand-mark" aria-hidden="true">II</span>
          <span>
            <strong>OBD-II</strong>
            <small>RETROFIT</small>
          </span>
        </Link>

        <nav className="header-actions" aria-label="Navegação principal">
          <Link to="/devices">Dispositivos</Link>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </nav>
      </div>
    </header>
  )
}
