interface ResourceCardProps {
  label: string
  code: string
  current: number
  maximum: number
  explanation: string
  status: string
  tone: 'green' | 'cyan' | 'violet' | 'amber' | 'red'
  steps?: number[]
  onDelta: (delta: number) => void
  onSet: (value: number) => void
}

export function ResourceCard({
  label,
  code,
  current,
  maximum,
  explanation,
  status,
  tone,
  steps = [-5, -1, 1, 5],
  onDelta,
  onSet,
}: ResourceCardProps) {
  const percentage = maximum === 0 ? 0 : Math.round((current / maximum) * 100)

  return (
    <article className={`resource-card resource-card--${tone}`}>
      <div className="resource-card__header">
        <div>
          <span className="eyebrow">{code}</span>
          <h3>{label}</h3>
        </div>
        <span className="status-label">{status}</span>
      </div>

      <div className="resource-value">
        <label className="sr-only" htmlFor={`resource-${code}`}>
          Valor atual de {label}
        </label>
        <input
          id={`resource-${code}`}
          type="number"
          min={0}
          max={maximum}
          value={current}
          onChange={(event) => onSet(event.currentTarget.valueAsNumber)}
        />
        <span aria-hidden="true">/</span>
        <strong>{maximum}</strong>
      </div>

      <div
        className="resource-meter"
        role="progressbar"
        aria-label={`${label}: ${current} de ${maximum}`}
        aria-valuemin={0}
        aria-valuemax={maximum}
        aria-valuenow={current}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>

      <div className="quick-controls" aria-label={`Ações rápidas de ${label}`}>
        {steps.map((step) => (
          <button key={step} type="button" onClick={() => onDelta(step)}>
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>

      <p className="calculation-note">{explanation}</p>
    </article>
  )
}
