import { useEffect, useRef, useState } from 'react'
import { ACCENTS, PAPERS, TEXTURES, defaultLook } from '../theme.js'

/**
 * The look controls, close to hand rather than three taps into Settings.
 *
 * Papers first, because that is the one people reach for. Everything that
 * needs explaining hides behind Advanced — a slider you have never wanted is
 * clutter, and a slider you do want is worth one tap.
 */
export default function LookPopover({ look, onChange, onClose }) {
  const [advanced, setAdvanced] = useState(
    // Open on arrival if the sliders are somewhere other than stock, or the
    // panel would claim nothing had been changed when something had.
    () =>
      look.textureStrength !== defaultLook().textureStrength ||
      look.saturation !== defaultLook().saturation ||
      look.texture !== defaultLook().texture,
  )
  const panelRef = useRef(null)
  const firstRef = useRef(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  // Dismiss on Escape or on a click anywhere else, the way a popover should.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target)) onClose()
    }
    window.addEventListener('keydown', onKey)
    // Deferred: the click that opened this is still on its way up.
    const id = setTimeout(() => window.addEventListener('pointerdown', onDown), 0)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [onClose])

  const set = (patch) => onChange({ ...look, ...patch })

  return (
    <div className="look" ref={panelRef} role="dialog" aria-label="Appearance">
      <p className="look__group">Paper</p>
      <ul className="look__papers">
        {PAPERS.map((paper, i) => (
          <li key={paper.id}>
            <button
              ref={i === 0 ? firstRef : undefined}
              type="button"
              className={`look__paper ${paper.id === look.paper ? 'look__paper--on' : ''}`}
              style={{ '--swatch': paper.light }}
              onClick={() => set({ paper: paper.id })}
              aria-pressed={paper.id === look.paper}
              title={paper.label}
            >
              <span className="look__tick" aria-hidden="true">
                ✓
              </span>
              <span className="sr-only">{paper.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="look__group">Accent</p>
      <ul className="look__papers">
        {ACCENTS.map((accent) => (
          <li key={accent.id}>
            <button
              type="button"
              className={`look__paper look__paper--accent ${
                accent.id === look.accent ? 'look__paper--on' : ''
              }`}
              style={{ '--swatch': accent.color }}
              onClick={() => set({ accent: accent.id })}
              aria-pressed={accent.id === look.accent}
              title={accent.label}
            >
              <span className="look__tick" aria-hidden="true">
                ✓
              </span>
              <span className="sr-only">{accent.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="look__rule" />

      <label className="look__toggle">
        <span className="look__toggle-label">Advanced</span>
        <input
          type="checkbox"
          checked={advanced}
          onChange={(e) => setAdvanced(e.target.checked)}
        />
        <span className="look__switch" aria-hidden="true" />
      </label>

      {advanced && (
        <div className="look__advanced">
          <label className="look__slider">
            <span className="look__slider-label">Texture</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={look.textureStrength}
              onChange={(e) => set({ textureStrength: Number(e.target.value) })}
            />
            <output className="look__value">{look.textureStrength}</output>
          </label>

          {/* A strength slider is no use while the pattern is Plain, so the
              pattern itself belongs here rather than only in Settings. */}
          <ul className="look__patterns">
            {TEXTURES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`look__pattern ${t.id === look.texture ? 'look__pattern--on' : ''}`}
                  onClick={() => set({ texture: t.id })}
                  aria-pressed={t.id === look.texture}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>

          <label className="look__slider">
            <span className="look__slider-label">Saturation</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={look.saturation}
              onChange={(e) => set({ saturation: Number(e.target.value) })}
            />
            <output className="look__value">{look.saturation}</output>
          </label>

          <button
            className="look__reset"
            type="button"
            onClick={() => onChange(defaultLook())}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  )
}
