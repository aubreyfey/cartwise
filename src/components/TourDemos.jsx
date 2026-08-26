import { useEffect, useState } from 'react'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

// Little scripted vignettes of the app being used, for the tour.
//
// They are mock-ups rather than the real components on purpose: a demo has to
// hit exact frames on a timer, and driving the live UI to do that would mean
// putting demo hooks all through the app. These are a few dozen lines of
// markup that can be made to do anything, and they cannot break the app.

const REDUCED = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Step through a sequence on a timer, looping.
 *
 * With reduced motion requested it jumps straight to the final frame and
 * stops — the point of the demo is the end state, and someone who asked the
 * OS for less movement should not be given a permanent animation.
 */
function useSteps(count, ms = 1200) {
  const [step, setStep] = useState(() => (REDUCED() ? count - 1 : 0))

  useEffect(() => {
    if (REDUCED()) return undefined
    const id = setInterval(() => setStep((s) => (s + 1) % count), ms)
    return () => clearInterval(id)
  }, [count, ms])

  return step
}

/** The pretend fingertip. `tap` pulses it at the moment of contact. */
function Finger({ x, y, tap, hidden }) {
  return (
    <span
      className={`demo__finger ${tap ? 'demo__finger--tap' : ''} ${hidden ? 'demo__finger--hidden' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden="true"
    />
  )
}

const peso = (n) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

/* ------------------------------------------------------------------ aisles */

const AISLE_ITEMS = [
  { name: 'Bananas', sticker: 'banana', aisle: 'Produce' },
  { name: 'Whole Wheat Bread', sticker: 'bread', aisle: 'Bakery' },
  { name: 'Fresh Milk', sticker: 'milk', aisle: 'Dairy' },
]
const TYPED = 'Fresh Milk'

function AisleDemo() {
  // 0 empty, 1-2 typing, 3 sorted in
  const step = useSteps(5, 900)
  const typing = step >= 1 && step <= 2
  const typedText = step === 0 ? '' : step === 1 ? TYPED.slice(0, 5) : TYPED
  const placed = step >= 3

  return (
    <div className="demo demo--aisles">
      <div className={`demo__input ${typing ? 'demo__input--active' : ''}`}>
        {typedText || <span className="demo__ph">Add an item…</span>}
        {typing && <span className="demo__caret" />}
      </div>

      {['Produce', 'Bakery', 'Dairy'].map((aisle) => {
        const rows = AISLE_ITEMS.filter(
          (i) => i.aisle === aisle && (i.name !== TYPED || placed),
        )
        return (
          <div className="demo__group" key={aisle}>
            <span className="demo__pill">{aisle}</span>
            {rows.map((r) => (
              <div
                className={`demo__row ${r.name === TYPED ? 'demo__row--drop' : ''}`}
                key={r.name}
              >
                <Sticker id={r.sticker} size={18} />
                <span className="demo__name">{r.name}</span>
              </div>
            ))}
          </div>
        )
      })}
      <Finger x={62} y={11} tap={step === 2} hidden={step > 3} />
    </div>
  )
}

/* ------------------------------------------------------------------ budget */

const BUDGET_ROWS = [
  { name: 'Bananas', sticker: 'banana', price: 96 },
  { name: 'Corned Beef', sticker: 'can', price: 258 },
  { name: 'Fresh Milk', sticker: 'milk', price: 178 },
  { name: 'Coconut Oil', sticker: 'oil', price: 478 },
]
const CAP = 2000

function BudgetDemo() {
  const step = useSteps(BUDGET_ROWS.length + 2, 950)
  const shown = Math.min(step, BUDGET_ROWS.length)
  const total = BUDGET_ROWS.slice(0, shown).reduce((n, r) => n + r.price, 0)
  const pct = Math.min(100, (total / CAP) * 100)

  return (
    <div className="demo demo--budget">
      <div className="demo__labels">
        <span>Total spent</span>
        <span>Budget</span>
      </div>
      <div className="demo__track">
        <div className="demo__fill" style={{ width: `${Math.max(pct, 16)}%` }}>
          <span className="demo__spent">{peso(total)}</span>
        </div>
        <span className="demo__cap">{peso(CAP)}</span>
      </div>

      <div className="demo__rows">
        {BUDGET_ROWS.map((r, i) => (
          <div className={`demo__row ${i < shown ? 'demo__row--in' : 'demo__row--out'}`} key={r.name}>
            <Sticker id={r.sticker} size={18} />
            <span className="demo__name">{r.name}</span>
            <span className="demo__amount">{peso(r.price)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- price memory */

function VaultDemo() {
  // 0 empty, 1 typed "mil", 2 suggestion up, 3 finger on it, 4 filled
  const step = useSteps(6, 950)

  return (
    <div className="demo demo--vault">
      <div className={`demo__input ${step >= 1 && step <= 3 ? 'demo__input--active' : ''}`}>
        {step === 0 && <span className="demo__ph">Add an item…</span>}
        {step >= 1 && step <= 3 && (
          <>
            mil<span className="demo__caret" />
          </>
        )}
        {step >= 4 && 'Fresh Milk'}
      </div>

      {step >= 2 && step <= 3 && (
        <div className="demo__suggest">
          <Sticker id="milk" size={18} />
          <span className="demo__name">Fresh Milk</span>
          <span className="demo__price">{peso(89)}</span>
          <span className="demo__from">from Vault</span>
        </div>
      )}

      {step >= 4 && (
        <div className="demo__filled">
          <div className="demo__chip">
            <span className="demo__chip-label">Qty</span>
            <strong>2</strong>
          </div>
          <div className="demo__chip demo__chip--money">
            <span className="demo__chip-label">Price</span>
            <strong>{peso(89)}</strong>
          </div>
          <div className="demo__chip">
            <span className="demo__chip-label">Aisle</span>
            <strong>Dairy</strong>
          </div>
        </div>
      )}

      <Finger x={48} y={38} tap={step === 3} hidden={step < 2 || step > 3} />
    </div>
  )
}

/* ----------------------------------------------------------------- compare */

const COMPARE = [
  { store: 'Savemore', total: 1072.2 },
  { store: 'Public Market', total: 980.45 },
]

function CompareDemo() {
  // alternates which store is selected
  const step = useSteps(4, 1300)
  const active = step >= 2 ? 1 : 0
  const max = Math.max(...COMPARE.map((c) => c.total))

  return (
    <div className="demo demo--compare">
      <div className="demo__stores">
        {COMPARE.map((c, i) => (
          <span key={c.store} className={`demo__store ${i === active ? 'demo__store--on' : ''}`}>
            {c.store}
          </span>
        ))}
      </div>

      <div className="demo__bars">
        {COMPARE.map((c, i) => {
          const cheapest = c.total === Math.min(...COMPARE.map((x) => x.total))
          return (
            <div className="demo__bar-row" key={c.store}>
              <span className="demo__bar-name">{c.store}</span>
              <span className="demo__bar">
                <span
                  className={`demo__bar-fill ${cheapest ? 'demo__bar-fill--best' : ''}`}
                  style={{ width: `${(c.total / max) * 100}%` }}
                />
              </span>
              <span className={`demo__amount ${cheapest ? 'demo__amount--best' : ''}`}>
                {peso(c.total)}
              </span>
            </div>
          )
        })}
      </div>

      <p className="demo__note">
        <strong>Public Market</strong> saves {peso(91.75)} on the items priced at both.
      </p>

      <Finger x={active === 0 ? 22 : 62} y={12} tap={step === 1 || step === 3} />
    </div>
  )
}

/* ---------------------------------------------------------------- shopping */

const SHOP_ROWS = [
  { name: 'Bananas', sticker: 'banana' },
  { name: 'Broccoli', sticker: 'broccoli' },
  { name: 'Corned Beef', sticker: 'can' },
]

function ShoppingDemo() {
  const step = useSteps(SHOP_ROWS.length + 2, 950)
  const done = Math.min(step, SHOP_ROWS.length)
  // Checked rows sink, exactly as they do in the real shopping mode.
  const ordered = [...SHOP_ROWS.keys()].sort((a, b) => {
    const A = a < done ? 1 : 0
    const B = b < done ? 1 : 0
    return A - B
  })

  return (
    <div className="demo demo--shopping">
      <div className="demo__rows">
        {ordered.map((idx, position) => {
          const r = SHOP_ROWS[idx]
          const checked = idx < done
          return (
            <div
              className={`demo__row demo__row--tall ${checked ? 'demo__row--done' : ''}`}
              key={r.name}
              style={{ transform: `translateY(${position * 0}px)` }}
            >
              <span className={`demo__check ${checked ? 'demo__check--on' : ''}`} />
              <Sticker id={r.sticker} size={20} />
              <span className="demo__name">{r.name}</span>
            </div>
          )
        })}
      </div>

      <div className="demo__basket">
        <span className="demo__basket-count">{done}</span>
        <span>{done}/3 in the cart</span>
        <span className="demo__basket-btn">Finish trip</span>
      </div>

      <Finger
        x={11}
        y={11 + Math.min(done, SHOP_ROWS.length - 1) * 21}
        tap={step < SHOP_ROWS.length}
        hidden={step >= SHOP_ROWS.length}
      />
    </div>
  )
}

/* ------------------------------------------------------------------- scan */

function ScanDemo() {
  // 0-1 scanning, 2 found, 3 becomes a row
  const step = useSteps(5, 1000)

  return (
    <div className="demo demo--scan">
      <div className={`demo__viewfinder ${step <= 1 ? 'demo__viewfinder--live' : ''}`}>
        <Icon name="barcode" size={54} />
        {step <= 1 && <span className="demo__scanline" />}
        {step >= 2 && <span className="demo__found">4800016641107</span>}
      </div>

      {step >= 3 && (
        <div className="demo__row demo__row--drop">
          <Sticker id="can" size={20} />
          <span className="demo__name">Corned Beef</span>
          <span className="demo__amount">{peso(86)}</span>
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- expiry */

const EXPIRY = [
  { name: 'Fresh Milk', sticker: 'milk', when: 'yesterday', tone: 'bad' },
  { name: 'Wheat Bread', sticker: 'bread', when: 'today', tone: 'bad' },
  { name: 'Greek Yogurt', sticker: 'yogurt', when: 'in 2 days', tone: 'warn' },
  { name: 'Cheddar', sticker: 'cheese', when: 'in 19 days', tone: 'ok' },
]

function ExpiryDemo() {
  const step = useSteps(EXPIRY.length + 2, 800)
  const shown = Math.min(step, EXPIRY.length)

  return (
    <div className="demo demo--expiry">
      {EXPIRY.map((r, i) => (
        <div
          className={`demo__row ${i < shown ? 'demo__row--in' : 'demo__row--out'}`}
          key={r.name}
        >
          <Sticker id={r.sticker} size={18} />
          <span className="demo__name">{r.name}</span>
          <span className={`demo__when demo__when--${r.tone}`}>{r.when}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ trips */

function TripsDemo() {
  const step = useSteps(4, 1100)
  const up = step >= 1

  return (
    <div className="demo demo--trips">
      <div className={`demo__receipt ${up ? 'demo__receipt--up' : ''}`}>
        <p className="demo__receipt-title">Trip complete</p>
        <div className="demo__figures">
          <div>
            <span>Budget</span>
            <strong>{peso(2000)}</strong>
          </div>
          <div>
            <span>Spent</span>
            <strong>{peso(1642.25)}</strong>
          </div>
          <div>
            <span>Saved</span>
            <strong className="demo__good">{peso(357.75)}</strong>
          </div>
        </div>
        <div className="demo__collage">
          {['banana', 'can', 'milk', 'bread', 'cheese'].map((id, i) => (
            <Sticker key={id} id={id} size={26} tilt={i % 2 ? 9 : -9} />
          ))}
        </div>
      </div>
    </div>
  )
}

export const DEMOS = {
  aisles: AisleDemo,
  budget: BudgetDemo,
  vault: VaultDemo,
  compare: CompareDemo,
  shopping: ShoppingDemo,
  scan: ScanDemo,
  expiry: ExpiryDemo,
  trips: TripsDemo,
}

export default function TourDemo({ name }) {
  const Component = DEMOS[name]
  if (!Component) return null
  return (
    <div className="demo__frame">
      <Component />
    </div>
  )
}
