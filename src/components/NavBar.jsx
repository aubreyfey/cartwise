import Icon from '../icons.jsx'

// Notebook dividers down the left edge: each tab is a tongue sticking out of
// the page, and the active one slides proud of the rest.
const TABS = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'recipes', label: 'Recipes', icon: 'book' },
  { id: 'vault', label: 'Vault', icon: 'vault' },
  { id: 'expiry', label: 'Expiry', icon: 'calendar' },
  { id: 'trips', label: 'Trips', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
]

export default function NavBar({ view, onNavigate, alerts = 0 }) {
  return (
    <nav className="rail" aria-label="Sections">
      {TABS.map((tab) => {
        // A list belongs to Home; without this the rail goes blank the moment
        // you open one.
        const active = view === tab.id || (tab.id === 'home' && view === 'list')
        return (
          <button
            key={tab.id}
            type="button"
            className={`rail__tab ${active ? 'rail__tab--on' : ''}`}
            onClick={() => onNavigate(tab.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="rail__icon">
              <Icon name={tab.icon} size={17} />
              {tab.id === 'expiry' && alerts > 0 && (
                <span className="rail__badge" aria-hidden="true">
                  {alerts > 9 ? '9+' : alerts}
                </span>
              )}
            </span>
            <span className="rail__label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
