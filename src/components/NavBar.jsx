import Icon from '../icons.jsx'

// A bottom bar rather than the side rail some apps use: on a phone the bottom
// of the screen is where a thumb already is, and vertical labels are hard to
// read.
const TABS = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'expiry', label: 'Expiry', icon: 'calendar' },
  { id: 'trips', label: 'Trips', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
]

export default function NavBar({ view, onNavigate, alerts = 0 }) {
  return (
    <nav className="nav" aria-label="Sections">
      {TABS.map((tab) => {
        // A list belongs to Home; without this the bar goes blank as soon as
        // you open one.
        const active = view === tab.id || (tab.id === 'home' && view === 'list')
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav__tab ${active ? 'nav__tab--on' : ''}`}
            onClick={() => onNavigate(tab.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav__icon">
              <Icon name={tab.icon} size={21} />
              {tab.id === 'expiry' && alerts > 0 && (
                <span className="nav__badge" aria-hidden="true">
                  {alerts > 9 ? '9+' : alerts}
                </span>
              )}
            </span>
            <span className="nav__label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
