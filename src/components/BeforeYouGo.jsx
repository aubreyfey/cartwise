import { useState } from 'react'
import Icon from '../icons.jsx'

/**
 * One home for everything the app has worked out about this list before you
 * leave the house.
 *
 * These four panels — basket estimate, which shop is cheapest, whether
 * splitting the shop pays, and what is due a restock — each self-hide when
 * they have nothing to say, so on an empty list the screen looks calm. The
 * problem was the opposite case: once you have some history they all appear
 * at once, and an audit counted 128 interactive elements on this screen. The
 * app looked unfinished precisely when it had the most to offer.
 *
 * So they are one collapsed card with the headline in the summary line. The
 * findings are still one tap away and nothing was removed — this is a
 * hierarchy fix, not a feature cut.
 */
export default function BeforeYouGo({ summary = [], children }) {
  const [open, setOpen] = useState(false)

  return (
    <section className={`byg ${open ? 'byg--open' : ''}`}>
      <button
        className="byg__head"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="byg__icon" aria-hidden="true">
          <Icon name="sparkle" size={17} />
        </span>
        <span className="byg__text">
          <span className="byg__title">Before you go</span>
          <span className="byg__summary">
            {summary.length > 0 ? (
              summary.map((line, i) => (
                <span key={line}>
                  {i > 0 && ' · '}
                  {line}
                </span>
              ))
            ) : (
              // An empty state that says what to do, rather than "no data".
              <>Confirm prices as you shop and comparisons appear here</>
            )}
          </span>
        </span>
        <span className={`vault__chevron ${open ? 'vault__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && <div className="byg__body">{children}</div>}
    </section>
  )
}
