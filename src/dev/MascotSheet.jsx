// A contact sheet for the mascot, so every state can be judged at once.
// Reachable at ?mascots=1 in development only.
import Mascot from '../components/Mascot.jsx'

const STATES = ['idle', 'happy', 'wink', 'thinking', 'walking', 'loading', 'success', 'sad']

export default function MascotSheet() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>Mascot states</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '46rem' }}>
        {STATES.map((s) => (
          <div key={s} style={{ textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '.75rem' }}>
            <Mascot state={s} size={128} />
            <div style={{ fontSize: '.65rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400, marginTop: '2rem' }}>Small sizes</h2>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
        {[64, 44, 30, 22, 18].map((n) => (
          <div key={n} style={{ textAlign: 'center' }}>
            <Mascot state="idle" size={n} simple={n <= 30} />
            <div style={{ fontSize: '.6rem', color: 'var(--text-muted)' }}>{n}px</div>
          </div>
        ))}
      </div>
    </div>
  )
}
