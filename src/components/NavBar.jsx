import Icon from '../icons.jsx'

// Five tabs, and every one of them is something you do: your lists, what you
// cook, what you have bought, what is going off, where the money went.
//
// Settings is not one of those. It is where you go to change how the app
// behaves, occasionally, and it was taking a sixth of a phone-width bar to
// sit there being rarely pressed. It lives in the header now, next to the
// other control that changes how things look.
const TABS = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'recipes', label: 'Recipes', icon: 'book' },
  { id: 'vault', label: 'Vault', icon: 'vault' },
  { id: 'expiry', label: 'Expiry', icon: 'calendar' },
  { id: 'trips', label: 'Trips', icon: 'chart' },
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
