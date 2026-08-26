import { useRef, useState } from 'react'
import {
  backupFilename,
  collectBackup,
  describeBackup,
  validateBackup,
} from '../backup.js'
import { readStored } from '../useLocalStorage.js'

export default function DataPanel({ onRestore }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const [pending, setPending] = useState(null)
  const fileRef = useRef(null)

  function exportData() {
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
      setStatus({ tone: 'good', text: 'Saved to your downloads.' })
    } catch {
      setStatus({ tone: 'bad', text: "Couldn't save the file." })
    }
  }

  async function pickFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // let the same file be picked twice
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text())
      const result = validateBackup(parsed)
      if (!result.ok) {
        setStatus({ tone: 'bad', text: result.reason })
        setPending(null)
        return
      }
      // Restoring replaces everything, so it asks first rather than
      // silently overwriting a year of prices.
      setPending(result.data)
      setStatus(null)
    } catch {
      setStatus({ tone: 'bad', text: "That file isn't readable JSON." })
      setPending(null)
    }
  }

  function confirmRestore() {
    onRestore(pending)
    setPending(null)
    setStatus({ tone: 'good', text: 'Restored.' })
  }

  return (
    <section className="datapanel">
      <button
        className="datapanel__toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="datapanel__label">
          <span aria-hidden="true">💾</span> Backup
        </span>
        <span className={`insights__chevron ${open ? 'insights__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="datapanel__body">
          <p className="datapanel__hint">
            Everything is stored on this device only. Clearing your browser data
            would erase it, so keep a copy somewhere safe.
          </p>

          <div className="datapanel__actions">
            <button className="btn btn--ghost" type="button" onClick={exportData}>
              Save a copy
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              Restore
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={pickFile}
              hidden
            />
          </div>

          {pending && (
            <div className="datapanel__confirm">
              <p>
                Restore <strong>{describeBackup(pending)}</strong>? This replaces
                everything currently on this device.
              </p>
              <div className="datapanel__actions">
                <button className="btn btn--primary" type="button" onClick={confirmRestore}>
                  Replace everything
                </button>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => setPending(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status && (
            <p className={`datapanel__status datapanel__status--${status.tone}`}>
              {status.text}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
