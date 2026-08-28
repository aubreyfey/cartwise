import { QUICK_SETS, dateInDays } from '../pantry.js'

/**
 * Pick a use-by date by sliding through the useful ones.
 *
 * The steps are the quick sets, not raw days: the range is 3 days to 3 months,
 * and a linear day slider would spend most of its travel on distinctions
 * nobody makes. Sliding between "a week" and "a fortnight" is the real
 * decision, so the slider snaps to those and the exact date is still editable
 * underneath.
 *
 * A native range input rather than a custom drag: it is draggable, tappable,
 * arrow-key operable and announced correctly, all for free.
 */
export default function ExpirySlider({ value, onChange, id = 'expiry-slider' }) {
  // Which step the current date corresponds to, or -1 for a hand-picked date
  // that does not land on one.
  const index = QUICK_SETS.findIndex((q) => dateInDays(q.days) === value)
  const current = index === -1 ? null : index

  return (
    <div className="xslider">
      <label className="xslider__label" htmlFor={id}>
        Quick set
      </label>

      <input
        id={id}
        className="xslider__input"
        type="range"
        min="0"
        max={QUICK_SETS.length - 1}
        step="1"
        // A date typed by hand sits between steps; park the handle at the
        // nearest one rather than snapping the date itself.
        value={current ?? 1}
        onChange={(e) => onChange(dateInDays(QUICK_SETS[Number(e.target.value)].days))}
        aria-label="How long until it goes off"
        aria-valuetext={current === null ? 'Custom date' : QUICK_SETS[current].label}
        list={`${id}-ticks`}
      />

      <datalist id={`${id}-ticks`}>
        {QUICK_SETS.map((q, i) => (
          <option key={q.id} value={i} label={q.label} />
        ))}
      </datalist>

      <ol className="xslider__ticks" aria-hidden="true">
        {QUICK_SETS.map((q, i) => (
          <li key={q.id}>
            {/* Tappable as well as slidable — reaching "3 months" by dragging
                a 5-step slider is fiddlier than just hitting it. */}
            <button
              type="button"
              className={`xslider__tick ${i === current ? 'xslider__tick--on' : ''}`}
              onClick={() => onChange(dateInDays(q.days))}
              tabIndex={-1}
            >
              {q.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
