import { useMemo, useState } from 'react'
import { formatMoney } from '../money.js'
import { bestOption, estimateBasket } from '../community.js'
import Icon from '../icons.jsx'

/**
 * What the whole list would cost at each shop.
 *
 * Every figure here is built from prices someone recorded at a till — right
 * now that someone is always you. The copy says "estimated" and dates every
 * number for that reason: CartWise has no retailer feed, and a total presented
 * as today's shelf price would be a claim it cannot support.
 *
 * A shop is only ranked as an option if it can price the whole basket.
 * Comparing a complete total against a partial one is how you send someone to
 * the wrong shop, so partial shops are listed separately, greyed, with what
 * they are missing.
 */
export default function BasketCompare({ items, reports, currency }) {
  const [open, setOpen] = useState(false)

  const estimates = useMemo(() => estimateBasket(items, reports), [items, reports])
  const recommendation = useMemo(() => bestOption(estimates), [estimates])

  // Nothing to say until at least one shop can price the lot.
  if (!recommendation) {
    const anyPartial = estimates.some((e) => e.covered > 0)
    if (!anyPartial) return null

    return (
      <section className="basket">
        <p className="basket__thin">
          <Icon name="shelf" size={15} /> Not enough recorded prices to compare
          shops for this list yet. Confirm prices as you shop and this fills in.
        </p>
      </section>
    )
  }

  const { best, saving, comparedAcross } = recommendation
  const partial = estimates.filter((e) => !e.complete && e.covered > 0)

  return (
    <section className="basket">
      <button
        className="basket__head"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="basket__label">Best estimated option</span>
        <span className={`vault__chevron ${open ? 'vault__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      <p className="basket__store">{best.storeName}</p>
      <p className="basket__total">
        {formatMoney(best.total, currency)} <span>estimated total</span>
      </p>
      <p className="basket__cover">
        {best.covered}/{best.of} products have recent prices
        {best.oldestDays > 0 && <> · oldest {best.oldestDays} days old</>}
      </p>

      {saving !== null && saving > 0 && (
        <p className="basket__saving">
          You could save approximately <strong>{formatMoney(saving, currency)}</strong>{' '}
          compared with the next option.
        </p>
      )}
      {saving !== null && saving === 0 && (
        <p className="basket__saving basket__saving--none">
          The next option works out the same.
        </p>
      )}
      {comparedAcross === 1 && (
        <p className="basket__saving basket__saving--none">
          Only one shop has prices for everything, so there is nothing to
          compare it against yet.
        </p>
      )}

      {open && (
        <>
          {estimates.filter((e) => e.complete).length > 1 && (
            <ul className="basket__list">
              {estimates
                .filter((e) => e.complete)
                .map((e) => (
                  <li
                    className={`basket__row ${e.storeKey === best.storeKey ? 'basket__row--best' : ''}`}
                    key={e.storeKey}
                  >
                    <span className="basket__rowstore">{e.storeName}</span>
                    <span className="basket__rowtotal">{formatMoney(e.total, currency)}</span>
                  </li>
                ))}
            </ul>
          )}

          {partial.length > 0 && (
            <div className="basket__partial">
              <p className="basket__partialhead">Not enough prices to rank</p>
              <ul className="basket__list">
                {partial.map((e) => (
                  <li className="basket__row basket__row--partial" key={e.storeKey}>
                    <span className="basket__rowstore">{e.storeName}</span>
                    <span className="basket__rowmissing">
                      {e.covered}/{e.of} priced
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="basket__caveat">
            Estimated from prices recorded at the till, not live shop prices.
            CartWise has no connection to any retailer.
          </p>
        </>
      )}
    </section>
  )
}
