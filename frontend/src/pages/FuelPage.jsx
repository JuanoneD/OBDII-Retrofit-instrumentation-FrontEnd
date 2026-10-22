import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Feedback from '../components/Feedback.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import {
  ApiError,
  getDevice,
  recalculateFuel,
} from '../services/deviceService.js'
import {
  calculateFuelPercentage,
  formatFuelFactor,
  formatMetric,
  FuelValidationError,
  parseFuelAmount,
} from '../utils/fuel.js'

function decodeDeviceId(value = '') {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default function FuelPage() {
  const { idDevice: routeDeviceId } = useParams()
  const deviceId = useMemo(
    () => decodeDeviceId(routeDeviceId),
    [routeDeviceId],
  )
  const [device, setDevice] = useState(null)
  const [refueledGas, setRefueledGas] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { token, clearSession } = useAuth()

  useDocumentTitle('Calibrar combustível')

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

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const amount = parseFuelAmount(refueledGas)
      setIsSubmitting(true)
      const result = await recalculateFuel({
        deviceId,
        refueledGas: amount,
        token,
      })

      setDevice(result.device)
      setRefueledGas('')
      setSuccess(
        `Calibração concluída. Novo fator: ${formatFuelFactor(result.newFactor)}.`,
      )
    } catch (requestError) {
      if (requestError instanceof FuelValidationError) {
        setError(requestError.message)
        return
      }

      handleRequestError(
        requestError,
        'Não foi possível recalibrar o combustível.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const detailPath = `/devices/${encodeURIComponent(deviceId)}`

  if (isLoading) {
    return (
      <main className="page-shell page-narrow">
        <LoadingState message="Carregando dados de combustível..." />
      </main>
    )
  }

  if (!device) {
    return (
      <main className="page-shell page-narrow">
        <Link className="back-link" to={detailPath}>← Voltar para o dispositivo</Link>
        <Feedback title="Combustível indisponível">
          {error || 'Não foi possível encontrar este dispositivo.'}
        </Feedback>
      </main>
    )
  }

  const percentage = calculateFuelPercentage(
    device.gasolineLevel,
    device.tankCapacity,
  )

  return (
    <main className="page-shell page-narrow fuel-page">
      <Link className="back-link" to={detailPath}>← Voltar para o dispositivo</Link>

      <header className="page-heading">
        <p className="eyebrow">{device.name || 'VEÍCULO'}</p>
        <h1>Calibrar combustível</h1>
        <span>Informe quantos litros entraram ao completar o tanque.</span>
      </header>

      <section className="fuel-result-hero" aria-label="Combustível atual">
        <span>Combustível estimado antes da calibração</span>
        <strong>{formatMetric(device.gasolineLevel)} L</strong>
        <small>
          {percentage === null
            ? `Tanque de ${formatMetric(device.tankCapacity)} L`
            : `${formatMetric(percentage)}% de um tanque de ${formatMetric(device.tankCapacity)} L`}
        </small>
      </section>

      <section className="fuel-result-grid" aria-label="Informações atuais">
        <article>
          <span>Capacidade</span>
          <strong>{formatMetric(device.tankCapacity)} L</strong>
        </article>
        <article>
          <span>Fator atual</span>
          <strong>{formatFuelFactor(device.fuelConsumptionFactor)}</strong>
        </article>
      </section>

      <form className="fuel-card fuel-calibration-card" onSubmit={handleSubmit} noValidate>
        <div className="fuel-card-icon" aria-hidden="true">⛽</div>
        <h2>Registrar abastecimento</h2>
        <p className="fuel-card-description">
          O backend comparará o volume abastecido com o consumo estimado e ajustará o fator automaticamente.
        </p>

        <label htmlFor="refueled-gas">Quantos litros foram abastecidos?</label>
        <div className="liters-field">
          <input
            id="refueled-gas"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 42,5"
            value={refueledGas}
            onChange={(event) => setRefueledGas(event.target.value)}
            disabled={isSubmitting}
          />
          <span>litros</span>
        </div>

        {success && <Feedback type="success">{success}</Feedback>}
        {error && <Feedback>{error}</Feedback>}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'RECALIBRANDO...' : 'RECALIBRAR COMBUSTÍVEL'}
        </button>
      </form>

      <p className="screen-note">
        Ao concluir, o nível de combustível será atualizado para a capacidade total do tanque.
      </p>
    </main>
  )
}
