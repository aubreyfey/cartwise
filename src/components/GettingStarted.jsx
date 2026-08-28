import { gettingStarted } from '../gettingStarted.js'
import Icon from '../icons.jsx'

/**
 * What CartWise can do yet, and what it needs to do more.
 *
 * Every clever thing in this app is computed from your own shopping, so on day
 * one none of it can say anything and a new user has no way of knowing there
 * is more coming. This says so — each step naming what it unlocks rather than
 * just being a chore — and takes itself off the screen once they are done.
 */
export default function GettingStarted({ carts, trips, purchases, vault }) {
  const state = gettingStarted({ carts, trips, purchases, vault })
  if (!state) return null

  const { steps, done, total, next } = state

  return (
    <section className="gs" aria-labelledby="gs-title">
      <div className="gs__head">
        <span className="gs__icon" aria-hidden="true">
          <Icon name="sparkle" size={18} />
        </span>
        <span className="gs__headtext">
          <h2 className="gs__title" id="gs-title">
            CartWise gets smarter as you shop
          </h2>
          {next && (
            <p className="gs__next">
              Next: {next.label.toLowerCase()} — unlocks {next.unlocks}.
            </p>
          )}
        </span>
        <span className="gs__count" aria-label={`${done} of ${total} done`}>
          {done}/{total}
        </span>
      </div>

      <ol className="gs__steps">
        {steps.map((step) => (
          <li className={`gs__step ${step.done ? 'gs__step--done' : ''}`} key={step.id}>
            <span className="gs__tick" aria-hidden="true">
              {step.done ? '✓' : ''}
            </span>
            <span className="gs__steptext">
              <span className="gs__steplabel">{step.label}</span>
              <span className="gs__unlocks">{step.unlocks}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
