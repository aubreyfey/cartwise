import { useEffect, useRef, useState } from 'react'
import { PURPOSES } from '../carts.js'
import Icon from '../icons.jsx'

/**
 * Making a list, out of the way.
 *
 * This used to be a permanent block at the bottom of Home: a heading and four
 * purpose buttons, sitting under your lists on every visit. You make a list
 * occasionally and look at your lists constantly, so the rare thing was taking
 * up room the common thing needed.
 *
 * Choosing what a list is for stays part of making it rather than becoming a
 * setting to find afterwards — it decides which group the list lands in.
 */
export default function NewListSheet({ onCreate, onClose }) {
  const [purpose, setPurpose] = useState(PURPOSES[0]?.id ?? 'home')
  const [name, setName] = useState('')
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function submit(event) {
    event.preventDefault()
    // An unnamed list is still a list; createCart falls back to a default
    // rather than refusing, so this does not need to police the field.
    onCreate(name.trim(), purpose)
  }

  return (
    <div className="sheet" role="presentation" onMouseDown={onClose}>
      <form
        className="picker newlistsheet"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="New list"
      >
        <h2 className="picker__title">New list</h2>

        <input
          ref={input}
          className="field__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name it — Groceries, Party, Baon…"
          aria-label="List name"
          autoComplete="off"
        />

        <fieldset className="newlistsheet__purposes">
          <legend className="field__label">What is it for?</legend>
          {PURPOSES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`newlist__choice ${purpose === p.id ? 'newlist__choice--on' : ''}`}
              onClick={() => setPurpose(p.id)}
              aria-pressed={purpose === p.id}
            >
              <Icon name={p.icon} size={18} />
              {p.label}
            </button>
          ))}
        </fieldset>

        <div className="newlistsheet__actions">
          <button className="btn btn--primary" type="submit">
            Create
          </button>
          <button className="btn btn--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
