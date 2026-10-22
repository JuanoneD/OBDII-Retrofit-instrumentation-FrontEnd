export default function LoadingState({ message = 'Carregando...' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
