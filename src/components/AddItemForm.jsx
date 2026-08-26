import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, guessCategory } from '../categories.js'
import { formatMoney } from '../money.js'
import { findByBarcode, priceFor, suggest } from '../vault.js'
import { DEFAULT_UNIT, UNITS, normalizeQty } from '../units.js'
import { lookupBarcode } from '../lookup.js'
import BarcodeScanner, { scannerSupported } from './BarcodeScanner.jsx'
import Sticker, { stickerFor } from '../stickers.jsx'

const EMPTY = { name: '', qty: '1', price: '', unit: DEFAULT_UNIT }

export default function AddItemForm({ onAdd, vault, activeStoreId, onVaultPick }) {
  const [fields, setFields] = useState(EMPTY)
  const [category, setCategory] = useState('other')
  // Once the user picks a category by hand, stop re-guessing under them.
  const [pinned, setPinned] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [scanning, setScanning] = useState(false)
  // A scanned code we don't recognise yet — attached to whatever you name it.
  const [pendingBarcode, setPendingBarcode] = useState(null)
  const [lookupState, setLookupState] = useState('idle')
  const nameRef = useRef(null)
  const blurTimer = useRef(null)

  const suggestions = useMemo(
    () => (showSuggestions ? suggest(vault, fields.name) : []),
    [vault, fields.name, showSuggestions],
  )

  useEffect(() => {
    if (!pinned) setCategory(guessCategory(fields.name))
  }, [fields.name, pinned])

  // Keep the highlight in range as the list shrinks under it.
  useEffect(() => {
    setHighlighted(0)
  }, [fields.name])

  useEffect(() => () => clearTimeout(blurTimer.current), [])

  function set(key, value) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  function applySuggestion(vaultItem) {
    const known = priceFor(vaultItem, activeStoreId)
    setFields({
      name: vaultItem.name,
      qty: String(vaultItem.defaultQty ?? 1),
      price: known == null ? '' : String(known),
      unit: vaultItem.unit ?? DEFAULT_UNIT,
    })
    setCategory(vaultItem.category)
    setPinned(true)
    setShowSuggestions(false)
    nameRef.current?.focus()
    onVaultPick?.(vaultItem)
  }

  function handleKeyDown(event) {
    if (!suggestions.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((h) => (h + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter' && showSuggestions) {
      // Enter takes the highlighted suggestion rather than submitting the
      // half-typed name; a second Enter then adds it.
      event.preventDefault()
      applySuggestion(suggestions[highlighted])
    } else if (event.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  function reset() {
    setFields(EMPTY)
    setPinned(false)
    setShowSuggestions(false)
    setPendingBarcode(null)
    setLookupState('idle')
  }

  /**
   * A scan we already know fills everything in. One we don't leaves the
   * barcode pending: name it and the code sticks to that item, so the next
   * scan of the same product is instant and offline.
   */
  function handleScan(code) {
    setScanning(false)
    const known = findByBarcode(vault, code)

    if (known) {
      applySuggestion(known)
      return
    }

    setPendingBarcode(code)
    setLookupState('idle')
    setFields((f) => ({ ...f, name: '' }))
    nameRef.current?.focus()
  }

  async function lookUpPending() {
    setLookupState('looking')
    try {
      const found = await lookupBarcode(pendingBarcode)
      if (!found) {
        setLookupState('missing')
        return
      }
      setFields((f) => ({ ...f, name: found.name }))
      setCategory(found.category ?? guessCategory(found.name))
      setPinned(true)
      setLookupState('found')
      setShowSuggestions(false)
    } catch {
      setLookupState('offline')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const name = fields.name.trim()
    if (!name) return

    onAdd({
      name,
      qty: normalizeQty(fields.qty, fields.unit),
      price: fields.price,
      unit: fields.unit,
      category,
      barcode: pendingBarcode,
    })

    reset()
    nameRef.current?.focus()
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      {scanning && (
        <BarcodeScanner onScan={handleScan} onCancel={() => setScanning(false)} />
      )}

      {pendingBarcode && (
        <div className="scanned">
          <span className="scanned__icon" aria-hidden="true">
            {fields.name ? (
              <Sticker id={stickerFor(fields.name, category)} size={26} />
            ) : (
              '▊▍▊'
            )}
          </span>
          <span className="scanned__text">
            <strong className="scanned__code">{pendingBarcode}</strong>
            <span className="scanned__hint">
              {lookupState === 'looking' && 'Looking it up…'}
              {lookupState === 'missing' && "Not in the database — name it yourself."}
              {lookupState === 'offline' && "Couldn't reach the database — name it yourself."}
              {lookupState === 'found' && 'Found it. Add a price and it sticks to this code.'}
              {lookupState === 'idle' && 'New code — name it and it sticks to this product.'}
            </span>
          </span>

          {lookupState === 'idle' && (
            <button
              className="btn btn--ghost scanned__lookup"
              type="button"
              onClick={lookUpPending}
              title="Sends only the barcode digits to Open Food Facts"
            >
              Look up
            </button>
          )}
          <button
            className="scanned__dismiss"
            type="button"
            onClick={() => setPendingBarcode(null)}
            aria-label="Forget this barcode"
          >
            ×
          </button>
        </div>
      )}

      <div className="add-form__combo">
        <input
          ref={nameRef}
          className="add-form__name"
          type="text"
          value={fields.name}
          onChange={(e) => {
            set('name', e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay so a click on a suggestion lands before the list closes.
            blurTimer.current = setTimeout(() => setShowSuggestions(false), 120)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add an item…"
          aria-label="Item name"
          autoComplete="off"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls="vault-suggestions"
          enterKeyHint="done"
        />

        {suggestions.length > 0 && (
          <ul className="suggestions" id="vault-suggestions" role="listbox">
            {suggestions.map((s, i) => {
              const known = priceFor(s, activeStoreId)
              // A price we only know from another store is a guess here, and
              // says so rather than passing itself off as this store's price.
              const exact = activeStoreId ? s.prices?.[activeStoreId] > 0 : true
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`suggestion ${i === highlighted ? 'suggestion--active' : ''}`}
                    role="option"
                    aria-selected={i === highlighted}
                    onMouseEnter={() => setHighlighted(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySuggestion(s)}
                  >
                    <span className="suggestion__name">{s.name}</span>
                    {known > 0 && (
                      <span className="suggestion__price">
                        {exact ? '' : '~'}
                        {formatMoney(known)}
                      </span>
                    )}
                    <span className="suggestion__hint">
                      {known > 0 && !exact ? 'other store' : 'from Vault'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="add-form__row">
        <label className="field">
          <span className="field__label">Qty</span>
          <input
            className="field__input field__input--qty"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={fields.qty}
            onChange={(e) => set('qty', e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">Price</span>
          <input
            className="field__input field__input--price"
            type="text"
            inputMode="decimal"
            value={fields.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="—"
            title="Leave blank if you don't know it yet"
          />
        </label>

        <label className="field">
          <span className="field__label">Per</span>
          <select
            className="field__input field__input--unit"
            value={fields.unit}
            onChange={(e) => set('unit', e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--grow">
          <span className="field__label">Aisle</span>
          <select
            className="field__input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPinned(true)
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </label>

        {scannerSupported() && (
          <button
            className="btn btn--scan"
            type="button"
            onClick={() => setScanning(true)}
            title="Scan a barcode"
          >
            <span aria-hidden="true">▊▍▊</span> Scan
          </button>
        )}

        <button className="btn btn--primary" type="submit" disabled={!fields.name.trim()}>
          Add
        </button>
      </div>
    </form>
  )
}
