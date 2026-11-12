import Feedback from './Feedback.jsx'
import LoadingState from './LoadingState.jsx'

function formatDetectedAt(value) {
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

export default function DetectedErrorsSection({
  detectedErrors,
  error,
  isLoading,
  isAutoRefreshEnabled,
  onRefresh,
}) {
  return (
    <section
      className="detected-errors-section"
      aria-labelledby="detected-errors-title"
    >
      <div className="section-heading dtc-section-heading">
        <div>
          <h2 id="detected-errors-title">Falhas detectadas pela ESP</h2>
          <span>
            {detectedErrors.length === 1
              ? '1 falha no histórico'
              : `${detectedErrors.length} falhas no histórico`}
          </span>
          <small>
            {isAutoRefreshEnabled
              ? 'Atualização automática a cada 15 segundos'
              : 'Ative o modo diagnóstico para habilitar a atualização automática'}
          </small>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Atualizando...' : 'Atualizar falhas'}
        </button>
      </div>

      {error && (
        <Feedback title="Falhas temporariamente indisponíveis">
          {error}
        </Feedback>
      )}

      {isLoading && detectedErrors.length === 0 ? (
        <LoadingState message="Carregando falhas detectadas..." />
      ) : detectedErrors.length > 0 ? (
        <div className="detected-error-list">
          {detectedErrors.map((detectedError, index) => (
            <article
              className="detected-error-card"
              key={`${detectedError.detectedAt}-${detectedError.title}-${index}`}
            >
              <div className="detected-error-card-heading">
                <span aria-hidden="true">!</span>
                <time dateTime={detectedError.detectedAt || undefined}>
                  {formatDetectedAt(detectedError.detectedAt)}
                </time>
              </div>
              <h3>{detectedError.title}</h3>
              <p>{detectedError.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="dtc-empty-state">
          <span aria-hidden="true">✓</span>
          <div>
            <h3>Nenhuma falha detectada pela ESP</h3>
            <p>
              O histórico será preenchido quando a ESP identificar e enviar uma
              falha durante o modo diagnóstico.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
