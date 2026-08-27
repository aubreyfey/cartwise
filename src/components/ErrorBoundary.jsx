import { Component } from 'react'
import { backupFilename, collectBackup } from '../backup.js'
import { readStored } from '../useLocalStorage.js'

/**
 * Without this, any render error shows a blank white page and the user has no
 * way to get their data out. The one thing this screen must always offer is
 * the export — their remembered prices matter more than the crash.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, saved: false }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('CartWise crashed:', error, info?.componentStack)
  }

  download = () => {
    try {
      const blob = new Blob([JSON.stringify(collectBackup(readStored), null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backupFilename()
      a.click()
      URL.revokeObjectURL(url)
      this.setState({ saved: true })
    } catch {
      this.setState({ saved: false })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="app">
        <section className="crash">
          <h1 className="crash__title">Something broke</h1>
          <p className="crash__lead">
            CartWise hit an error and stopped. Your lists and prices are still
            saved on this device — save a copy before you do anything else.
          </p>

          <div className="crash__actions">
            <button className="btn btn--primary" type="button" onClick={this.download}>
              {this.state.saved ? 'Saved ✓' : 'Save my data'}
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>

          <details className="crash__details">
            <summary>What went wrong</summary>
            <pre>{String(this.state.error?.stack || this.state.error)}</pre>
          </details>
        </section>
      </div>
    )
  }
}
