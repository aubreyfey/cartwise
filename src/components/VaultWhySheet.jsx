import { useEffect } from 'react'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

// Drawn marks rather than emoji, so the sheet looks the same on every device —
// the same reason the sticker set exists.
const REASONS = [
  {
    icon: 'chart',
    title: 'Track prices',
    body: 'See how prices change over time.',
  },
  {
    icon: 'shelf',
    title: 'Compare stores',
    body: 'Find the cheaper option before you shop.',
  },
  {
    icon: 'bell',
    title: 'Spot changes',
    body: 'Notice price increases before checkout.',
  },
  {
    icon: 'basket',
    title: 'Build your catalog',
    body: 'Reuse groceries in future carts with a tap.',
  },
  {
    icon: 'sparkle',
    title: 'Plan with confidence',
    body: 'Get better estimates as your Vault grows.',
  },
]

export default function VaultWhySheet({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet" role="presentation" onMouseDown={onClose}>
      <div
        className="whysheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whyvault-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="psearch__grip" aria-hidden="true" />
        <h2 className="whysheet__title" id="whyvault-title">
          Why build your Vault?
        </h2>

        <ul className="whysheet__list">
          {REASONS.map((reason) => (
            <li className="whyrow" key={reason.title}>
              <span className="whyrow__icon" aria-hidden="true">
                <Icon name={reason.icon} size={20} strokeWidth={1.7} />
              </span>
              <span className="whyrow__text">
                <span className="whyrow__title">{reason.title}</span>
                <span className="whyrow__body">{reason.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <button className="btn btn--primary btn--wide" type="button" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}
