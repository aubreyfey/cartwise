import { useEffect, useRef, useState } from 'react'
import Icon from '../icons.jsx'
import {
  contentBounds,
  describeResult,
  removeBackground,
  trimHalo,
} from '../cutout.js'

// First run: show what the app is, then ask the two things that make it
// immediately useful — where you shop, and what one of your products looks
// like. Everything else can wait until there is a reason to ask.

const OUTPUT = 192
const WORK = 320
const PAD = 0.06

export default function Onboarding({ base = '/', onFinish }) {
  const [step, setStep] = useState(0)
  const [store, setStore] = useState('')
  const [sticker, setSticker] = useState(null)
  const [stickerName, setStickerName] = useState('')
  const [note, setNote] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onFinish({ store: null, sticker: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFinish])

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
        setBusy(false)
        cutOut(image)
      }
      image.onerror = () => {
        setBusy(false)
        setNote("That file isn't an image we can read.")
      }
      image.src = reader.result
    }
    reader.onerror = () => {
      setBusy(false)
      setNote("Couldn't read that file.")
    }
    reader.readAsDataURL(file)
  }

  /** Same pipeline as the in-app sticker maker, at its default strength. */
  function cutOut(image) {
    const scale = Math.min(WORK / image.width, WORK / image.height, 1)
    const w = Math.max(1, Math.round(image.width * scale))
    const h = Math.max(1, Math.round(image.height * scale))

    const work = document.createElement('canvas')
    work.width = w
    work.height = h
    const wctx = work.getContext('2d', { willReadFrequently: true })
    wctx.drawImage(image, 0, 0, w, h)

    const data = wctx.getImageData(0, 0, w, h)
    const result = removeBackground(data.data, w, h, { tolerance: 40 })
    trimHalo(data.data, w, h)
    const bounds = contentBounds(data.data, w, h)

    if (!describeResult(result, bounds).ok) {
      setNote('Try a plainer surface — a counter or a table works best.')
      setSticker(null)
      return
    }

    wctx.putImageData(data, 0, 0)
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

    const webp = out.toDataURL('image/webp', 0.85)
    canvasRef.current = out
    setSticker(webp.startsWith('data:image/webp') ? webp : out.toDataURL('image/png'))
    setNote(null)
  }

  const done = (extra = {}) =>
    onFinish({
      store: store.trim() || null,
      sticker: sticker && stickerName.trim() ? { name: stickerName.trim(), dataUrl: sticker } : null,
      ...extra,
    })

  /* ------------------------------------------------------------- welcome */

  if (step === 0) {
    return (
      <div className="onb onb--welcome">
        <h1 className="onb__brand">
          <Icon name="cart" size={36} strokeWidth={1.9} /> CartWise
        </h1>
        <p className="onb__tagline">The grocery list that remembers what things cost.</p>
        <p className="onb__badge">
          Works offline <span aria-hidden="true">·</span> No account
        </p>

        {/* The screenshot scrolls inside the phone, so the app is seen doing
            something rather than sitting still.

            A background rather than an <img>: animating background-position
            from 0% to 100% travels exactly to the bottom of the picture
            whatever its height, where translating an image by a percentage
            means guessing a distance and running onto blank space when the
            guess is wrong. */}
        <div className="onb__phone">
          <div
            className="onb__screen onb__screen--scroll"
            style={{
              backgroundImage: `url(${`${base}tour/scroll.webp`.replace(/\/{2,}/g, '/')})`,
            }}
            role="img"
            aria-label="CartWise showing a grocery list with prices and a budget"
          />
        </div>

        <div className="onb__actions">
          <button className="btn btn--primary btn--wide" type="button" onClick={() => setStep(1)}>
            Get started
          </button>
        </div>
      </div>
    )
  }

  /* --------------------------------------------------------------- store */

  if (step === 1) {
    return (
      <div className="onb">
        <div className="onb__body">
          <h1 className="onb__title">Where was your last grocery trip?</h1>
          <p className="onb__sub">
            CartWise keeps prices per shop, so it can tell you where things are
            cheaper. You can add more later.
          </p>

          <form
            className="onb__form"
            onSubmit={(e) => {
              e.preventDefault()
              setStep(2)
            }}
          >
            <input
              className="onb__input"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Savemore, Public Market…"
              aria-label="Shop name"
              autoComplete="off"
              autoFocus
              maxLength={40}
            />
          </form>
        </div>

        <div className="onb__actions">
          <button className="btn btn--ghost" type="button" onClick={() => setStep(2)}>
            Skip
          </button>
          <button
            className="btn btn--primary btn--wide"
            type="button"
            onClick={() => setStep(2)}
            disabled={!store.trim()}
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------- sticker */

  return (
    <div className="onb">
      <div className="onb__body">
        <h1 className="onb__title">Got something you just bought?</h1>
        <p className="onb__sub">
          Photograph it on a plain surface and CartWise cuts it out into a
          sticker, so you recognise it on the list at a glance.
        </p>

        <div className="onb__stage">
          {sticker ? (
            <img className="sticker-photo onb__preview" src={sticker} alt="" />
          ) : (
            <span className="onb__placeholder">
              <Icon name="camera" size={44} strokeWidth={1.4} />
            </span>
          )}
        </div>

        {sticker && (
          <input
            className="onb__input"
            value={stickerName}
            onChange={(e) => setStickerName(e.target.value)}
            placeholder="What is it? e.g. Corned Beef"
            aria-label="Product name"
            autoComplete="off"
            maxLength={40}
          />
        )}

        {note && <p className="onb__note">{note}</p>}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pickFile}
          hidden
        />
      </div>

      <div className="onb__actions">
        <button className="btn btn--ghost" type="button" onClick={() => done()}>
          {sticker ? 'Skip this' : 'Not now'}
        </button>
        <button
          className="btn btn--primary btn--wide"
          type="button"
          onClick={() => (sticker && stickerName.trim() ? done() : fileRef.current?.click())}
          disabled={busy}
        >
          {busy ? 'Reading…' : sticker ? 'Save sticker' : 'Take a photo'}
        </button>
      </div>
    </div>
  )
}
