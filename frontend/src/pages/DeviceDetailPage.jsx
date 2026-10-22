import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Feedback from '../components/Feedback.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import {
  ApiError,
  getDevice,
  resetTrip,
} from '../services/deviceService.js'
import {
  calculateFuelPercentage,
  calculateTripEfficiency,
  formatFuelFactor,
  formatMetric,
} from '../utils/fuel.js'

function decodeDeviceId(value = '') {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default function DeviceDetailPage() {
  const { idDevice: routeDeviceId } = useParams()
  const deviceId = useMemo(
    () => decodeDeviceId(routeDeviceId),
    [routeDeviceId],
  )
  const location = useLocation()
  const [device, setDevice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.message || '')
  const { token, clearSession } = useAuth()

  useDocumentTitle(device?.name || 'Detalhes do dispositivo')

  const handleRequestError = useCallback(
    (requestError, fallback) => {
      if (requestError instanceof ApiError && requestError.status === 401) {
        clearSession()
        return
      }

      setError(requestError.message || fallback)
    },
    [clearSession],
  )

  const loadDevice = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      setDevice(await getDevice({ deviceId, token }))
    } catch (requestError) {
      handleRequestError(
        requestError,
        'Não foi possível carregar o dispositivo.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [deviceId, handleRequestError, token])

  useEffect(() => {
    loadDevice()
  }, [loadDevice])

  async function handleResetTrip() {
    setIsResetting(true)
    setError('')
    setSuccess('')

    try {
      const updatedDevice = await resetTrip({ deviceId, token })
      setDevice(updatedDevice)
      setSuccess('A distância e o consumo da viagem foram zerados.')
      setShowResetConfirmation(false)
    } catch (requestError) {
      handleRequestError(requestError, 'Não foi possível resetar a viagem.')
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell dashboard-screen">
        <LoadingState message="Carregando dados do veículo..." />
      </main>
    )
  }

  if (!device) {
    return (
      <main className="page-shell page-narrow">
        <Link className="back-link" to="/devices">← Voltar para dispositivos</Link>
        <Feedback title="Dispositivo indisponível">
          {error || 'Não foi possível encontrar este dispositivo.'}
        </Feedback>
      </main>
    )
  }

  const fuelPercentage = calculateFuelPercentage(
    device.gasolineLevel,
    device.tankCapacity,
  )
  const tripEfficiency = calculateTripEfficiency(
    device.totalDistance,
    device.tripConsumption,
  )

  return (
    <main className="page-shell dashboard-screen">
      <Link className="back-link" to="/devices">← Voltar para dispositivos</Link>

      <header className="page-heading detail-heading">
        <div>
          <p className="eyebrow">DETALHES DO VEÍCULO</p>
          <h1>{device.name || 'Veículo sem nome'}</h1>
          <span className="device-id-label">{device.idDevice}</span>
        </div>
        <button className="text-button" type="button" onClick={loadDevice}>
          Atualizar dados
        </button>
      </header>

      {success && <Feedback type="success">{success}</Feedback>}
      {error && <Feedback>{error}</Feedback>}

      <section className="fuel-overview" aria-label="Nível de combustível">
        <div className="fuel-overview-heading">
          <div>
            <span>Combustível estimado</span>
            <strong>{formatMetric(device.gasolineLevel)} <small>L</small></strong>
          </div>
          <div className="fuel-percentage-circle">
            {fuelPercentage === null ? '—' : `${formatMetric(fuelPercentage)}%`}
          </div>
        </div>
        <div className="fuel-progress fuel-progress-large" aria-hidden="true">
          <span style={{ width: `${fuelPercentage ?? 0}%` }} />
        </div>
        <p>Capacidade total: {formatMetric(device.tankCapacity)} litros</p>
      </section>

      <section className="metric-section" aria-labelledby="vehicle-metrics-title">
        <div className="section-heading">
          <h2 id="vehicle-metrics-title">Dados da viagem</h2>
          <span>Última sincronização disponível</span>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span>Capacidade do tanque</span>
            <strong>{formatMetric(device.tankCapacity)} L</strong>
            <small>Volume configurado na ESP</small>
          </article>
          <article className="metric-card">
            <span>Fator de consumo</span>
            <strong>{formatFuelFactor(device.fuelConsumptionFactor)}</strong>
            <small>Usado no cálculo do combustível</small>
          </article>
          <article className="metric-card">
            <span>Distância da viagem</span>
            <strong>{formatMetric(device.totalDistance)} km</strong>
            <small>Desde o último reset</small>
          </article>
          <article className="metric-card">
            <span>Consumo da viagem</span>
            <strong>{formatMetric(device.tripConsumption)} L</strong>
            <small>
              {tripEfficiency === null
                ? 'Média ainda indisponível'
                : `${formatMetric(tripEfficiency, 2)} km/L de média`}
            </small>
          </article>
        </div>
      </section>

      <section className="device-actions" aria-labelledby="device-actions-title">
        <div className="section-heading">
          <h2 id="device-actions-title">Ações do dispositivo</h2>
        </div>

        <div className="action-grid">
          <article className="action-card action-card-highlight">
            <div className="action-icon" aria-hidden="true">⛽</div>
            <div>
              <h3>Calibrar combustível</h3>
              <p>Informe o abastecimento para ajustar o fator de consumo.</p>
            </div>
            <Link
              className="primary-link-button"
              to={`/devices/${encodeURIComponent(device.idDevice)}/combustivel`}
            >
              Calibrar
            </Link>
          </article>

          <article className="action-card">
            <div className="action-icon action-icon-muted" aria-hidden="true">↺</div>
            <div>
              <h3>Resetar viagem</h3>
              <p>Zere a distância e o consumo acumulados nesta viagem.</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setShowResetConfirmation(true)}
              disabled={isResetting}
            >
              Resetar
            </button>
          </article>
        </div>
      </section>

      {showResetConfirmation && (
        <section className="confirmation-panel" role="alertdialog" aria-labelledby="reset-title">
          <div>
            <h2 id="reset-title">Resetar dados da viagem?</h2>
            <p>A distância e o consumo serão zerados. O nível do tanque não será alterado.</p>
          </div>
          <div className="confirmation-actions">
            <button
              className="text-button"
              type="button"
              onClick={() => setShowResetConfirmation(false)}
              disabled={isResetting}
            >
              Cancelar
            </button>
            <button
              className="danger-button"
              type="button"
              onClick={handleResetTrip}
              disabled={isResetting}
            >
              {isResetting ? 'Resetando...' : 'Confirmar reset'}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
