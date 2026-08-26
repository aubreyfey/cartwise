import { useEffect } from 'react'
import { BACKGROUNDS, backgroundStyle } from '../backgrounds.js'

export default function BackgroundPicker({ listName, current, onPick, onClose }) {
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
        className="picker"
        role="dialog"
        aria-modal="true"
        aria-label={`Background for ${listName}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="picker__title">Background</h2>
        <p className="picker__sub">{listName}</p>

        <ul className="picker__grid">
          {BACKGROUNDS.map((bg) => (
            <li key={bg.id}>
              <button
                type="button"
                className={`swatch ${bg.id === current ? 'swatch--on' : ''}`}
                style={backgroundStyle(bg.id)}
                onClick={() => onPick(bg.id)}
                aria-pressed={bg.id === current}
              >
                <span className="swatch__label">{bg.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="picker__actions">
          <button className="btn btn--ghost" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
