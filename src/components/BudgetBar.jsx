import { useRef, useState } from 'react'
import { formatMoney, parseMoney } from '../money.js'

export default function BudgetBar({
  title,
  budget,
  onBudgetChange,
  listTotal,
  cartTotal,
  unpriced,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  // Escape closes the input, which fires blur — this stops blur committing
  // the draft the user just abandoned.
  const cancelled = useRef(false)

  const hasBudget = budget > 0
  const pct = hasBudget ? Math.min(100, (listTotal / budget) * 100) : 0
  const over = hasBudget && listTotal > budget
  const remaining = budget - listTotal

  function commit() {
    setEditing(false)
    if (cancelled.current) return
    onBudgetChange(parseMoney(draft))
  }

  return (
    <section className="budget">
      <h2 className="budget__title">{title}</h2>

      <div className="budget__labels">
        <span className="budget__label">Total spent</span>
        <span className="budget__label">Budget</span>
      </div>

      <div className="budget__row">
        <div
          className={`budget__track ${over ? 'budget__track--over' : ''}`}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Budget used"
        >
          <div
            className={`budget__fill ${over ? 'budget__fill--over' : ''}`}
            style={{ width: hasBudget ? `${over ? 100 : Math.max(pct, 18)}%` : '100%' }}
          >
            <span className="budget__spent">{formatMoney(listTotal)}</span>
          </div>
        </div>

        {editing ? (
          <input
            className="budget__input"
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                cancelled.current = true
                setEditing(false)
              }
            }}
            aria-label="Budget"
            autoFocus
          />
        ) : (
          <button
            className="budget__cap"
            type="button"
            onClick={() => {
              setDraft(hasBudget ? String(budget) : '')
              cancelled.current = false
              setEditing(true)
            }}
          >
            {hasBudget ? formatMoney(budget) : 'Set'}
          </button>
        )}
      </div>

      <p className="budget__note">
        {hasBudget && (
          <span className={over ? 'budget__note--over' : 'budget__note--good'}>
            {over
              ? `${formatMoney(Math.abs(remaining))} over`
              : `${formatMoney(remaining)} left`}
          </span>
        )}
        {cartTotal > 0 && <> · {formatMoney(cartTotal)} in the cart</>}
        {unpriced > 0 && (
          <>
            {' '}
            · <span className="budget__warn">{unpriced} unpriced</span>
          </>
        )}
      </p>
    </section>
  )
}
