import { useEffect, useRef, useState } from 'react'
import { BACKGROUNDS, PHOTO_BACKGROUND, backgroundStyle } from '../backgrounds.js'
import Icon from '../icons.jsx'

export default function BackgroundPicker({
  listName,
  current,
  photo,
  note,
  onPick,
  onPickPhoto,
  onRemovePhoto,
  onClose,
}) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // A note only ever arrives from a failed save, so it also ends the spinner.
  useEffect(() => {
    if (note) setBusy(false)
  }, [note])

  async function pickFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    await onPickPhoto(file)
    setBusy(false)
  }

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
          {/* The photo tile sits first, showing the picture already chosen so
              it reads as a swatch rather than a file button. */}
          <li>
            <button
              type="button"
              className={`swatch swatch--photo ${
                current === PHOTO_BACKGROUND ? 'swatch--on' : ''
              }`}
              style={photo ? backgroundStyle(PHOTO_BACKGROUND, photo) : undefined}
              onClick={() =>
                photo ? onPick(PHOTO_BACKGROUND) : fileRef.current?.click()
              }
              aria-pressed={current === PHOTO_BACKGROUND}
              disabled={busy}
            >
              {!photo && <Icon name="camera" size={20} strokeWidth={1.5} />}
              <span className="swatch__label">
                {busy ? 'Reading…' : photo ? 'Photo' : 'Add photo'}
              </span>
            </button>
          </li>

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

        {photo && (
          <div className="picker__photo-actions">
            <button
              className="btn btn--ghost btn--small"
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              Replace photo
            </button>
            <button
              className="btn btn--ghost btn--small"
              type="button"
              onClick={onRemovePhoto}
            >
              Remove photo
            </button>
          </div>
        )}

        {note && <p className="picker__note">{note}</p>}

        <p className="picker__hint">
          Photos are shrunk before they're saved and never leave this device.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={pickFile}
          hidden
        />

        <div className="picker__actions">
          <button className="btn btn--ghost" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
