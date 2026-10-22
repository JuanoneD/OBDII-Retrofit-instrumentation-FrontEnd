import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Feedback from '../components/Feedback.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { loginUser } from '../services/authService.js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { authenticate } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useDocumentTitle('Entrar')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Informe o e-mail e a senha para entrar.')
      return
    }

    setIsSubmitting(true)

    try {
      const token = await loginUser({ email, password })
      authenticate(token)
      const destination = location.state?.from || '/devices'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <header className="screen-header auth-heading">
        <div className="auth-brand-mark" aria-hidden="true">II</div>
        <p>OBD-II RETROFIT</p>
        <h1>Bem-vindo de volta</h1>
        <span>Entre para acompanhar os dados do seu veículo.</span>
      </header>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <label htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
        />

        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
        />

        {error && <Feedback>{error}</Feedback>}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'ENTRANDO...' : 'ENTRAR'}
        </button>

        <p className="form-footer">
          Ainda não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </main>
  )
}
