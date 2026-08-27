import AccountPanel from './AccountPanel.jsx'
import DataPanel from './DataPanel.jsx'
import Icon from '../icons.jsx'
import { CURRENCIES, currencySymbol } from '../currency.js'
import { ACCENTS, TEXTURES } from '../theme.js'
import Sticker from '../stickers.jsx'

const STICKER_STYLE_CHOICES = [
  { id: 'emoji', label: 'Emoji' },
  { id: 'drawn', label: 'Drawn' },
]

// Three that look clearly different in each set, so the choice is legible
// at a glance rather than a pair of identical-looking swatches.
const PREVIEW = ['banana', 'cheese', 'milk']

/**
 * Everything that is configuration rather than shopping. Moving these off the
 * home screen leaves it as the thing it should be: your name, your savings,
 * and your lists.
 */
export default function SettingsScreen({
  name,
  onNameChange,
  currency,
  onCurrencyChange,
  accent,
  onAccentChange,
  texture,
  onTextureChange,
  stickerStyle,
  onStickerStyleChange,
  onRestore,
  onShowTour,
}) {
  return (
    <div className="settings">
      <header className="screen-head">
        <h1 className="screen-head__title">Settings</h1>
      </header>

      <label className="setting">
        <span className="setting__label">Your name</span>
        <input
          className="setting__control"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Optional"
          aria-label="Your name"
          maxLength={24}
          autoComplete="given-name"
        />
        <span className="setting__hint">Used for the greeting. It never leaves this device.</span>
      </label>

      <label className="setting">
        <span className="setting__label">Currency</span>
        <select
          className="setting__control"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name} ({currencySymbol(c.code)})
            </option>
          ))}
        </select>
      </label>

      <section className="setting">
        <span className="setting__label">Accent</span>
        <ul className="accents">
          {ACCENTS.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`accent ${a.id === accent ? 'accent--on' : ''}`}
                style={{ '--swatch': a.color }}
                onClick={() => onAccentChange(a.id)}
                aria-pressed={a.id === accent}
                title={a.label}
              >
                <span className="accent__dot" />
                <span className="accent__label">{a.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="setting">
        <span className="setting__label">Texture</span>
        <span className="setting__hint">
          A pattern behind everything. Drawn with gradients, so it costs no
          download.
        </span>
        <ul className="textures">
          {TEXTURES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`texture texture--${t.id} ${t.id === texture ? 'texture--on' : ''}`}
                onClick={() => onTextureChange(t.id)}
                aria-pressed={t.id === texture}
              >
                <span className="texture__label">{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="setting">
        <span className="setting__label">Item pictures</span>
        <span className="setting__hint">
          Emoji are drawn by your phone, so on an iPhone you get Apple's. The
          drawn set looks the same on every device.
        </span>
        <ul className="stickerstyles">
          {STICKER_STYLE_CHOICES.map((choice) => (
            <li key={choice.id}>
              <button
                type="button"
                className={`stickerstyle ${
                  choice.id === stickerStyle ? 'stickerstyle--on' : ''
                }`}
                onClick={() => onStickerStyleChange(choice.id)}
                aria-pressed={choice.id === stickerStyle}
              >
                <span className="stickerstyle__sample" aria-hidden="true">
                  {PREVIEW.map((id) => (
                    <Sticker key={id} id={id} size={24} variant={choice.id} />
                  ))}
                </span>
                <span className="stickerstyle__label">{choice.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button className="tour__open" type="button" onClick={onShowTour}>
        <Icon name="sparkle" size={17} /> What Cartwise does
      </button>

      <AccountPanel />
      <DataPanel onRestore={onRestore} />
    </div>
  )
}
