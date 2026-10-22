import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Feedback from '../components/Feedback.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { ApiError, listDevices } from '../services/deviceService.js'
import { calculateFuelPercentage, formatMetric } from '../utils/fuel.js'

function DeviceCard({ device }) {
  const percentage = calculateFuelPercentage(
    device.gasolineLevel,
    device.tankCapacity,
  )
  const devicePath = `/devices/${encodeURIComponent(device.idDevice)}`

  return (
    <article className="device-card">
      <div className="device-card-heading">
        <div className="device-icon" aria-hidden="true">OBD</div>
        <div>
          <h2>{device.name || 'Veículo sem nome'}</h2>
          <p>{device.idDevice}</p>
        </div>
        <span className="status-badge">Vinculado</span>
      </div>

      <div className="device-fuel-row">
        <span>Combustível estimado</span>
        <strong>
          {formatMetric(device.gasolineLevel)} L
          <small>
            {percentage === null ? '' : ` · ${formatMetric(percentage)}%`}
          </small>
        </strong>
      </div>

      <div className="fuel-progress" aria-hidden="true">
        <span style={{ width: `${percentage ?? 0}%` }} />
      </div>

      <Link className="card-link" to={devicePath}>
        Ver detalhes <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

export default function DevicesPage() {
  const [devices, setDevices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { token, clearSession } = useAuth()

  useDocumentTitle('Dispositivos')

  const loadDevices = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      setDevices(await listDevices({ token }))
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        clearSession()
        return
      }

      setError(requestError.message || 'Não foi possível carregar os dispositivos.')
    } finally {
      setIsLoading(false)
    }
  }, [clearSession, token])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  return (
    <main className="page-shell dashboard-screen">
      <header className="page-heading page-heading-actions">
        <div>
          <p className="eyebrow">GARAGEM</p>
          <h1>Seus dispositivos</h1>
          <span>Acompanhe os veículos vinculados à sua conta.</span>
        </div>
        <Link className="primary-link-button" to="/devices/novo">
          + Adicionar dispositivo
        </Link>
      </header>

      {error && (
        <Feedback title="Não foi possível atualizar">
          {error}
        </Feedback>
      )}

      {isLoading ? (
        <LoadingState message="Carregando seus dispositivos..." />
      ) : devices.length > 0 ? (
        <section className="device-list" aria-label="Dispositivos vinculados">
          {devices.map((device) => (
            <DeviceCard key={device.idDevice} device={device} />
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">+</div>
          <h2>Nenhum dispositivo vinculado</h2>
          <p>Adicione o MAC da sua ESP32 para começar a acompanhar o veículo.</p>
          <Link className="primary-link-button" to="/devices/novo">
            Adicionar primeiro dispositivo
          </Link>
        </section>
      )}

      {!isLoading && (
        <button className="text-button refresh-list" type="button" onClick={loadDevices}>
          Atualizar lista
        </button>
      )}
    </main>
  )
}
