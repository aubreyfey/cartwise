import { PLUS_FEATURES, PLUS_PRICE } from '../plus.js'
import { formatMoney } from '../money.js'
import Mascot from './Mascot.jsx'
import Icon from '../icons.jsx'

/**
 * What CartWise Plus is, and what it costs.
 *
 * There is no Subscribe button because there is no payment processor yet, and
 * a button that takes no money is a lie about a commercial relationship. It
 * says the price and says it is not on sale — which is also the honest thing
 * to show someone who tapped a locked feature.
 *
 * Features that do not exist yet are listed as not-yet rather than promised.
 * A paywall must not sell something it cannot deliver.
 */
export default function PlusSheet({ onClose, onDevGrant = null }) {
  return (
    <div className="sheet" onMouseDown={onClose} role="presentation">
      <section
        className="plussheet"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plus-title"
      >
        <div className="plussheet__hero">
          <Mascot state="wink" size={84} />
          <h2 className="plussheet__title" id="plus-title">
            CartWise Plus
          </h2>
          <p className="plussheet__price">
            <strong>{formatMoney(PLUS_PRICE.intro)}</strong> for your{' '}
            {PLUS_PRICE.introPeriod}, then {formatMoney(PLUS_PRICE.renewal)} a{' '}
            {PLUS_PRICE.renewalPeriod}
          </p>
        </div>

        <ul className="plussheet__list">
          {PLUS_FEATURES.map((f) => (
            <li className={`plusrow ${f.live ? '' : 'plusrow--soon'}`} key={f.id}>
              <span className="plusrow__tick" aria-hidden="true">
                <Icon name={f.live ? 'check' : 'calendar'} size={15} />
              </span>
              <span className="plusrow__label">{f.label}</span>
              {!f.live && <span className="plusrow__soon">not built yet</span>}
            </li>
          ))}
        </ul>

        <p className="plussheet__note">
          Everything else stays free, with no limits — your lists, your Vault,
          every price you have recorded, expiry tracking and the map. Plus is
          for the parts that need a server, plus a bit of colour.
        </p>

        <div className="plussheet__honest">
          <strong>Plus isn't on sale yet.</strong> Payments aren't set up, so
          there is nothing to buy today — this is here so you can see what it
          will be and what it will cost. Nothing you are using now will start
          costing money.
        </div>

        <div className="plussheet__actions">
          <button className="btn btn--primary" type="button" onClick={onClose}>
            Got it
          </button>
        </div>

        {/* A way to switch the entitlement on locally, for testing the gated
            paths before a real processor exists. Clearly labelled as such —
            it is a flag in this browser, not a purchase. */}
        {onDevGrant && (
          <button className="plussheet__dev" type="button" onClick={onDevGrant}>
            Turn Plus on for this browser (testing only — not a purchase)
          </button>
        )}
      </section>
    </div>
  )
}
