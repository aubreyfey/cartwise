import { useCallback, useEffect, useRef, useState } from 'react'
import {
  contentBounds,
  describeResult,
  removeBackground,
  trimHalo,
} from '../cutout.js'
import Icon from '../icons.jsx'

// Output is a square sticker at this size. Big enough to look sharp on a
// retina row thumbnail, small enough that a hundred of them fit in
// localStorage — roughly 5–12 KB each as WebP.
const OUTPUT = 192
const WORK = 320 // photo is downscaled to this before processing
const PAD = 0.06 // breathing room around the cut-out, as a fraction

export default function PhotoCapture({ name, existing, onSave, onRemove, onCancel }) {
  const fileRef = useRef(null)
  const sourceRef = useRef(null) // the loaded HTMLImageElement
  const canvasRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [tolerance, setTolerance] = useState(40)
  const [note, setNote] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  /** Cut the loaded photo out at the current tolerance and show the result. */
  const process = useCallback(
    (image, tol) => {
      const scale = Math.min(WORK / image.width, WORK / image.height, 1)
      const w = Math.max(1, Math.round(image.width * scale))
      const h = Math.max(1, Math.round(image.height * scale))

      const work = document.createElement('canvas')
      work.width = w
      work.height = h
      const wctx = work.getContext('2d', { willReadFrequently: true })
      wctx.drawImage(image, 0, 0, w, h)

      const imageData = wctx.getImageData(0, 0, w, h)
      const result = removeBackground(imageData.data, w, h, { tolerance: tol })
      trimHalo(imageData.data, w, h)
      const bounds = contentBounds(imageData.data, w, h)
      const verdict = describeResult(result, bounds)

      if (!verdict.ok) {
        setPreview(null)
        setNote({
          tone: 'bad',
          text:
            verdict.reason === 'busy'
              ? "Couldn't separate it from the background. Try a plainer surface, or raise the strength."
              : verdict.reason === 'faint'
                ? 'The product is too close in colour to the background — lower the strength, or use a contrasting surface.'
                : 'Nothing left after cutting out. Try a different photo.',
        })
        return
      }

      wctx.putImageData(imageData, 0, 0)

      // Draw the cropped subject into a square, centred, with a little padding.
      const out = document.createElement('canvas')
      out.width = OUTPUT
      out.height = OUTPUT
      const octx = out.getContext('2d')
      const usable = OUTPUT * (1 - PAD * 2)
      const fit = Math.min(usable / bounds.width, usable / bounds.height)
      const dw = bounds.width * fit
      const dh = bounds.height * fit
      octx.drawImage(
        work,
        bounds.x, bounds.y, bounds.width, bounds.height,
        (OUTPUT - dw) / 2, (OUTPUT - dh) / 2, dw, dh,
      )

      // WebP is roughly half the size of PNG here; browsers that can't encode
      // it silently hand back a PNG data URL instead, which still works.
      const url = out.toDataURL('image/webp', 0.85)
      canvasRef.current = out
      setPreview(url.startsWith('data:image/webp') ? url : out.toDataURL('image/png'))
      setNote(null)
    },
    [],
  )

  function pickFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setBusy(true)
    setNote(null)
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        sourceRef.current = image
        process(image, tolerance)
        setBusy(false)
      }
      image.onerror = () => {
        setBusy(false)
        setNote({ tone: 'bad', text: "That file isn't an image we can read." })
      }
      image.src = reader.result
    }
    reader.onerror = () => {
      setBusy(false)
      setNote({ tone: 'bad', text: "Couldn't read that file." })
    }
    reader.readAsDataURL(file)
  }

  function changeTolerance(value) {
    setTolerance(value)
    if (sourceRef.current) process(sourceRef.current, value)
  }

  return (
    <div className="sheet" role="presentation" onMouseDown={onCancel}>
      <div
        className="capture"
        role="dialog"
        aria-modal="true"
        aria-label={`Sticker for ${name}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="capture__title">Make a sticker</h2>
        <p className="capture__sub">{name}</p>

        <div className="capture__stage">
          {preview ? (
            <img className="capture__preview sticker-photo" src={preview} alt="" />
          ) : existing ? (
            <img className="capture__preview sticker-photo" src={existing} alt="" />
          ) : (
            <div className="capture__placeholder">
              <Icon name="camera" size={40} strokeWidth={1.4} />
              <span>Photograph the product on a plain surface</span>
            </div>
          )}
        </div>

        {sourceRef.current && (
          <label className="capture__slider">
            <span>
              Cut-out strength <strong>{tolerance}</strong>
            </span>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={tolerance}
              onChange={(e) => changeTolerance(Number(e.target.value))}
            />
          </label>
        )}

        {note && <p className={`capture__note capture__note--${note.tone}`}>{note.text}</p>}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pickFile}
          hidden
        />

        <div className="capture__actions">
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Reading…' : sourceRef.current ? 'Retake' : 'Take a photo'}
          </button>

          {existing && (
            <button className="btn btn--ghost btn--danger" type="button" onClick={onRemove}>
              Remove
            </button>
          )}

          <button
            className="btn btn--primary"
            type="button"
            onClick={() => onSave(preview)}
            disabled={!preview}
          >
            Use it
          </button>
        </div>

        <button className="capture__close" type="button" onClick={onCancel} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  )
}
