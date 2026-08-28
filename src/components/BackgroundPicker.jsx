import { useEffect, useRef, useState } from 'react'
import { BACKGROUNDS, PHOTO_BACKGROUND, backgroundStyle } from '../backgrounds.js'
import { photoGateState } from '../plus.js'
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
  target = 'header',
  plus = false,
  onWantPlus,
}) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  // A list that already had a photo keeps it: photo backgrounds were free
  // before Plus existed, and removing something that worked yesterday is the
  // fastest way to lose the users you have.
  const gate = photoGateState({ plus, existingPhoto: photo })

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
        {/* Two buttons now open this, for two different backgrounds. Saying
            which one avoids the obvious confusion. */}
        <h2 className="picker__title">
          {target === 'items' ? 'Behind your items' : 'List header'}
        </h2>
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
              onClick={() => {
                if (photo) return onPick(PHOTO_BACKGROUND)
                if (gate === 'locked') return onWantPlus?.()
                fileRef.current?.click()
              }}
              aria-pressed={current === PHOTO_BACKGROUND}
              disabled={busy}
            >
              {!photo && (
                <Icon name={gate === 'locked' ? 'vault' : 'camera'} size={20} strokeWidth={1.5} />
              )}
              <span className="swatch__label">
                {busy ? 'Reading…' : photo ? 'Photo' : gate === 'locked' ? 'Photo · Plus' : 'Add photo'}
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
              onClick={() => (gate === 'open' ? fileRef.current?.click() : onWantPlus?.())}
              disabled={busy}
            >
              {gate === 'open' ? 'Replace photo' : 'Replace photo · Plus'}
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

        {/* Removing a grandfathered photo cannot be undone without Plus, and
            finding that out afterwards would be a nasty surprise. */}
        {gate === 'grandfathered' && (
          <p className="picker__note picker__note--warn">
            This photo was set before Plus. Remove it and you'll need Plus to
            set a new one.
          </p>
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
