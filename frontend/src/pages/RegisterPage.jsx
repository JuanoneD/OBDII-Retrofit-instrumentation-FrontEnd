import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Feedback from '../components/Feedback.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { registerUser } from '../services/authService.js'

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { authenticate } = useAuth()
  const navigate = useNavigate()

  useDocumentTitle('Criar conta')

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Preencha nome, e-mail e senha para criar a conta.')
      return
    }

    if (form.password !== form.passwordConfirmation) {
      setError('A confirmação de senha não corresponde à senha informada.')
      return
    }

    setIsSubmitting(true)

    try {
      const token = await registerUser(form)
      authenticate(token)
      navigate('/devices', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível criar a conta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen register-screen">
      <header className="screen-header auth-heading">
        <div className="auth-brand-mark" aria-hidden="true">II</div>
        <p>OBD-II RETROFIT</p>
        <h1>Crie sua conta</h1>
        <span>Cadastre-se para vincular e acompanhar seus dispositivos.</span>
      </header>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <label htmlFor="register-name">Nome</label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          value={form.name}
          onChange={updateField}
          disabled={isSubmitting}
        />

        <label htmlFor="register-email">E-mail</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={form.email}
          onChange={updateField}
          disabled={isSubmitting}
        />

        <label htmlFor="register-password">Senha</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          value={form.password}
          onChange={updateField}
          disabled={isSubmitting}
        />

        <label htmlFor="register-password-confirmation">Confirme a senha</label>
        <input
          id="register-password-confirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          value={form.passwordConfirmation}
          onChange={updateField}
          disabled={isSubmitting}
        />

        {error && <Feedback>{error}</Feedback>}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
        </button>

        <p className="form-footer">
          Já possui uma conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </main>
  )
}
