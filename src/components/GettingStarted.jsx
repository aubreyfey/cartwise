import { gettingStarted } from '../gettingStarted.js'
import Mascot from './Mascot.jsx'
import { breathes } from '../mascotState.js'

/**
 * What CartWise can do yet, and what it needs to do more.
 *
 * Every clever thing in this app is computed from your own shopping, so on day
 * one none of it can say anything and a new user has no way of knowing there
 * is more coming. This says so — each step naming what it unlocks rather than
 * just being a chore — and takes itself off the screen once they are done.
 */
export default function GettingStarted({ carts, trips, purchases, vault, mascot = 'idle', onDismiss }) {
  const state = gettingStarted({ carts, trips, purchases, vault })
  if (!state) return null

  const { steps, done, total, next } = state

  return (
    <section className="gs" aria-labelledby="gs-title">
      <div className="gs__head">
        {/* The character, rather than a sparkle. This card is the one place
            that explicitly promises the app gets better as you use it, so it
            is the right place for something with a face. */}
        <span className={`gs__mascot ${breathes(mascot) ? 'gs__mascot--breathe' : ''}`}>
          <Mascot state={mascot} size={54} />
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

        {/* Somewhere to put it. A card that tells you the app gets better as
            you use it should not be the one thing you cannot get rid of. */}
        {onDismiss && (
          <button
            className="gs__close"
            type="button"
            onClick={onDismiss}
            aria-label="Hide this"
            title="Hide this"
          >
            ×
          </button>
        )}
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
