interface StepperProps {
  label: string
  value: number
  bonus?: number
  hint?: string
  disableDecrease?: boolean
  disableIncrease?: boolean
  onDecrease: () => void
  onIncrease: () => void
}

export function Stepper({
  label,
  value,
  bonus = 0,
  hint,
  disableDecrease,
  disableIncrease,
  onDecrease,
  onIncrease,
}: StepperProps) {
  return (
    <div className="stepper-row">
      <div className="stepper-copy">
        <span className="stepper-label">{label}</span>
        {hint && <span className="stepper-hint">{hint}</span>}
      </div>
      <div className="stepper-controls" aria-label={`Ajustar ${label}`}>
        <button
          type="button"
          className="stepper-button"
          onClick={onDecrease}
          disabled={disableDecrease}
          aria-label={`Diminuir ${label}`}
        >
          −
        </button>
        <output className="stepper-value" aria-label={`${label}: ${value + bonus}; ${value} distribuído e ${bonus} de bônus`}>
          {value + bonus}
          {bonus !== 0 && <small>{value} {bonus > 0 ? '+' : '−'} {Math.abs(bonus)}</small>}
        </output>
        <button
          type="button"
          className="stepper-button"
          onClick={onIncrease}
          disabled={disableIncrease}
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

