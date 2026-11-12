import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DetectedErrorsSection from '../components/DetectedErrorsSection.jsx'
import Feedback from '../components/Feedback.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import {
  ApiError,
  getDevice,
  getDetectedErrors,
  getDtcs,
  setDiagnosticMode,
} from '../services/deviceService.js'

function decodeDeviceId(value = '') {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function formatReceivedAt(value) {
  if (!value) {
    return 'Horário não informado'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function DiagnosticPage() {
  const { idDevice: routeDeviceId } = useParams()
  const deviceId = useMemo(
    () => decodeDeviceId(routeDeviceId),
    [routeDeviceId],
  )
  const [device, setDevice] = useState(null)
  const [dtcs, setDtcs] = useState([])
  const [detectedErrors, setDetectedErrors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingMode, setIsUpdatingMode] = useState(false)
  const [isRefreshingDtcs, setIsRefreshingDtcs] = useState(false)
  const [isRefreshingDetectedErrors, setIsRefreshingDetectedErrors] =
    useState(false)
  const [error, setError] = useState('')
  const [detectedErrorsError, setDetectedErrorsError] = useState('')
  const [success, setSuccess] = useState('')
  const { token, clearSession } = useAuth()

  useDocumentTitle(`Diagnóstico${device?.name ? ` — ${device.name}` : ''}`)

  const handleRequestError = useCallback(
    (requestError, fallback, setRequestError = setError) => {
      if (requestError instanceof ApiError && requestError.status === 401) {
        clearSession()
        return
      }

      setRequestError(requestError.message || fallback)
    },
    [clearSession],
  )

  const loadDiagnosticData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    setDetectedErrorsError('')

    const [deviceResult, dtcsResult, detectedErrorsResult] =
      await Promise.allSettled([
        getDevice({ deviceId, token }),
        getDtcs({ deviceId, token }),
        getDetectedErrors({ deviceId, token }),
      ])

    if (deviceResult.status === 'fulfilled') {
      setDevice(deviceResult.value)
    } else {
      handleRequestError(
        deviceResult.reason,
        'Não foi possível carregar o dispositivo.',
      )
    }

    if (dtcsResult.status === 'fulfilled') {
      setDtcs(dtcsResult.value)
    } else {
      handleRequestError(
        dtcsResult.reason,
        'Não foi possível carregar os códigos de falha.',
      )
    }

    if (detectedErrorsResult.status === 'fulfilled') {
      setDetectedErrors(detectedErrorsResult.value)
    } else {
      handleRequestError(
        detectedErrorsResult.reason,
        'Não foi possível carregar as falhas detectadas.',
        setDetectedErrorsError,
      )
    }

    setIsLoading(false)
  }, [deviceId, handleRequestError, token])

  useEffect(() => {
    loadDiagnosticData()
  }, [loadDiagnosticData])

  async function handleToggleDiagnosticMode() {
    const nextMode = !device.diagnoseMode
    setIsUpdatingMode(true)
    setError('')
    setSuccess('')

    try {
      await setDiagnosticMode({
        deviceId,
        diagnoseMode: nextMode,
        token,
      })
      setDevice((currentDevice) => ({
        ...currentDevice,
        diagnoseMode: nextMode,
      }))
      setSuccess(
        nextMode
          ? 'Modo diagnóstico ativado. A ESP fará a leitura dos DTCs no próximo ciclo de comunicação.'
          : 'Modo diagnóstico desativado.',
      )
    } catch (requestError) {
      handleRequestError(
        requestError,
        'Não foi possível alterar o modo diagnóstico.',
      )
    } finally {
      setIsUpdatingMode(false)
    }
  }

  async function handleRefreshDtcs() {
    setIsRefreshingDtcs(true)
    setError('')

    try {
      setDtcs(await getDtcs({ deviceId, token }))
    } catch (requestError) {
      handleRequestError(
        requestError,
        'Não foi possível atualizar os códigos de falha.',
      )
    } finally {
      setIsRefreshingDtcs(false)
    }
  }

  const handleRefreshDetectedErrors = useCallback(async () => {
    setIsRefreshingDetectedErrors(true)
    setDetectedErrorsError('')

    try {
      setDetectedErrors(await getDetectedErrors({ deviceId, token }))
    } catch (requestError) {
      handleRequestError(
        requestError,
        'Não foi possível atualizar as falhas detectadas.',
        setDetectedErrorsError,
      )
    } finally {
      setIsRefreshingDetectedErrors(false)
    }
  }, [deviceId, handleRequestError, token])

  useEffect(() => {
    if (!device?.diagnoseMode) {
      return undefined
    }

    const intervalId = globalThis.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        handleRefreshDetectedErrors()
      }
    }, 15000)

    return () => globalThis.clearInterval(intervalId)
  }, [device?.diagnoseMode, handleRefreshDetectedErrors])

  const detailPath = `/devices/${encodeURIComponent(deviceId)}`

  if (isLoading) {
    return (
      <main className="page-shell dashboard-screen">
        <LoadingState message="Carregando diagnóstico do veículo..." />
      </main>
    )
  }

  if (!device) {
    return (
      <main className="page-shell page-narrow">
        <Link className="back-link" to={detailPath}>← Voltar para o dispositivo</Link>
        <Feedback title="Diagnóstico indisponível">
          {error || 'Não foi possível encontrar este dispositivo.'}
        </Feedback>
      </main>
    )
  }

  return (
    <main className="page-shell dashboard-screen diagnostic-page">
      <Link className="back-link" to={detailPath}>← Voltar para o dispositivo</Link>

      <header className="page-heading detail-heading">
        <div>
          <p className="eyebrow">DIAGNÓSTICO DO VEÍCULO</p>
          <h1>{device.name || 'Veículo sem nome'}</h1>
          <span className="device-id-label">{device.idDevice}</span>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={loadDiagnosticData}
        >
          Atualizar tudo
        </button>
      </header>

      {success && <Feedback type="success">{success}</Feedback>}
      {error && <Feedback>{error}</Feedback>}

      <section
        className={`diagnostic-status-panel ${device.diagnoseMode ? 'is-active' : ''}`}
        aria-labelledby="diagnostic-mode-title"
      >
        <div className="diagnostic-status-copy">
          <span className="diagnostic-status-badge">
            {device.diagnoseMode ? 'ATIVO' : 'DESATIVADO'}
          </span>
          <h2 id="diagnostic-mode-title">Modo diagnóstico</h2>
          <p>
            {device.diagnoseMode
              ? 'A ESP está autorizada a solicitar os códigos de falha da ECU e enviá-los ao servidor.'
              : 'Ative o modo para solicitar uma leitura dos códigos de falha no próximo ciclo da ESP.'}
          </p>
        </div>

        <button
          className={`diagnostic-toggle ${device.diagnoseMode ? 'is-active' : ''}`}
          type="button"
          role="switch"
          aria-checked={device.diagnoseMode}
          onClick={handleToggleDiagnosticMode}
          disabled={isUpdatingMode}
        >
          <span className="diagnostic-toggle-track" aria-hidden="true">
            <span />
          </span>
          <span>
            {isUpdatingMode
              ? 'Salvando...'
              : device.diagnoseMode
                ? 'Desativar'
                : 'Ativar'}
          </span>
        </button>
      </section>

      <DetectedErrorsSection
        detectedErrors={detectedErrors}
        error={detectedErrorsError}
        isLoading={isRefreshingDetectedErrors}
        isAutoRefreshEnabled={device.diagnoseMode}
        onRefresh={handleRefreshDetectedErrors}
      />

      <section className="dtc-section" aria-labelledby="dtc-list-title">
        <div className="section-heading dtc-section-heading">
          <div>
            <h2 id="dtc-list-title">Códigos de falha ativos</h2>
            <span>
              {dtcs.length === 1
                ? '1 falha registrada'
                : `${dtcs.length} falhas registradas`}
            </span>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={handleRefreshDtcs}
            disabled={isRefreshingDtcs}
          >
            {isRefreshingDtcs ? 'Atualizando...' : 'Atualizar DTCs'}
          </button>
        </div>

        {dtcs.length > 0 ? (
          <div className="dtc-list">
            {dtcs.map((dtc) => (
              <article className="dtc-card" key={`${dtc.code}-${dtc.receivedAt}`}>
                <div className="dtc-card-heading">
                  <code>{dtc.code}</code>
                  <span>{formatReceivedAt(dtc.receivedAt)}</span>
                </div>
                <h3>{dtc.title}</h3>
                <p>
                  {dtc.description || 'Descrição detalhada indisponível para este código.'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="dtc-empty-state">
            <span aria-hidden="true">✓</span>
            <div>
              <h3>Nenhuma falha ativa registrada</h3>
              <p>
                {device.diagnoseMode
                  ? 'Aguarde o próximo envio da ESP e atualize a lista para consultar o resultado.'
                  : 'Ative o modo diagnóstico para solicitar uma nova leitura à ESP.'}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
