import AccountPanel from './AccountPanel.jsx'
import DataPanel from './DataPanel.jsx'
import Icon from '../icons.jsx'
import { CURRENCIES, currencySymbol } from '../currency.js'

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

      <button className="tour__open" type="button" onClick={onShowTour}>
        <Icon name="sparkle" size={17} /> What Cartwise does
      </button>

      <AccountPanel />
      <DataPanel onRestore={onRestore} />
    </div>
  )
}
