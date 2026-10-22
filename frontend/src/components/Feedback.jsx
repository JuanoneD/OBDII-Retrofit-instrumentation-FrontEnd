export default function Feedback({ type = 'error', title, children }) {
  return (
    <div
      className={`feedback feedback-${type}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {title && <strong>{title}</strong>}
      <p>{children}</p>
    </div>
  )
}
