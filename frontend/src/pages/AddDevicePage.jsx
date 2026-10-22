import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Feedback from '../components/Feedback.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { addDevice, ApiError } from '../services/deviceService.js'
import { formatMacInput, normalizeMac } from '../utils/device.js'

export default function AddDevicePage() {
  const [name, setName] = useState('')
  const [idDevice, setIdDevice] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { token, clearSession } = useAuth()
  const navigate = useNavigate()

  useDocumentTitle('Adicionar dispositivo')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const normalizedMac = normalizeMac(idDevice)

    if (!name.trim()) {
      setError('Informe um nome para identificar o veículo.')
      return
    }

    if (!normalizedMac) {
      setError('Informe um MAC válido no formato AA:BB:CC:DD:EE:FF.')
      return
    }

    setIsSubmitting(true)

    try {
      await addDevice({ idDevice: normalizedMac, name, token })
      navigate(`/devices/${encodeURIComponent(normalizedMac)}`, {
        replace: true,
        state: { message: 'Dispositivo adicionado à sua conta.' },
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        clearSession()
        return
      }

      if (requestError instanceof ApiError && requestError.status === 404) {
        setError(
          'A ESP ainda não foi encontrada no servidor. Ligue o dispositivo e aguarde o primeiro envio de dados antes de vinculá-lo.',
        )
        return
      }

      setError(requestError.message || 'Não foi possível adicionar o dispositivo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-shell page-narrow">
      <Link className="back-link" to="/devices">← Voltar para dispositivos</Link>

      <header className="page-heading">
        <p className="eyebrow">NOVO DISPOSITIVO</p>
        <h1>Vincular uma ESP32</h1>
        <span>Use o endereço MAC impresso ou exibido pelo dispositivo.</span>
      </header>

      <form className="form-card device-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="device-name">Nome do veículo</label>
        <input
          id="device-name"
          type="text"
          autoComplete="off"
          placeholder="Ex.: Gol do Rafael"
          maxLength="100"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
        />

        <label htmlFor="device-mac">MAC da ESP32</label>
        <input
          id="device-mac"
          className="monospace-input"
          type="text"
          autoComplete="off"
          inputMode="text"
          placeholder="AA:BB:CC:DD:EE:FF"
          value={idDevice}
          onChange={(event) => setIdDevice(formatMacInput(event.target.value))}
          disabled={isSubmitting}
        />
        <small className="field-help">
          O MAC possui 12 caracteres e identifica a placa de forma única.
        </small>

        <div className="backend-limit-note">
          A ESP precisa ter enviado dados ao servidor pelo menos uma vez antes de ser vinculada.
        </div>

        {error && <Feedback>{error}</Feedback>}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'ADICIONANDO...' : 'ADICIONAR DISPOSITIVO'}
        </button>
      </form>
    </main>
  )
}
