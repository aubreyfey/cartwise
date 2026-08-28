import { useEffect, useRef, useState } from 'react'
import {
  backupFilename,
  collectBackup,
  describeBackup,
  validateBackup,
} from '../backup.js'
import {
  canPersist,
  formatBytes,
  persistenceState,
  requestPersistence,
  storageEstimate,
} from '../persistence.js'
import { readStored } from '../useLocalStorage.js'
import Icon from '../icons.jsx'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export default function DataPanel({ onRestore, lastBackupAt = null, onBackedUp }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const [pending, setPending] = useState(null)
  const [durable, setDurable] = useState(null)
  const [usage, setUsage] = useState(null)
  const fileRef = useRef(null)

  // Read the real state rather than assuming it. Both calls are cheap and
  // neither prompts.
  useEffect(() => {
    if (!open) return
    let live = true
    persistenceState().then((s) => live && setDurable(s))
    storageEstimate().then((e) => live && setUsage(e))
    return () => {
      live = false
    }
  }, [open])

  async function askForDurability() {
    const result = await requestPersistence()
    setDurable(result)
    setStatus(
      result === 'granted'
        ? { tone: 'good', text: 'This browser has agreed to keep your data.' }
        : {
            tone: 'bad',
            text: 'This browser would not promise. Install CartWise to your home screen, and keep a saved copy.',
          },
    )
  }

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
      onBackedUp?.(Date.now())
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
          <Icon name="save" size={16} /> Backup
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

          {/* Browsers treat site storage as disposable: Chrome evicts it when
              the disk fills, and Safari deletes it after seven days away
              unless the app is on the home screen. Saying which of those you
              are in beats a reassuring sentence that might not be true. */}
          {canPersist() && durable && (
            <div className={`durable durable--${durable}`}>
              <p className="durable__line">
                {durable === 'granted' ? (
                  <>
                    <strong>This browser has agreed to keep your data.</strong> It
                    won't be cleared to free up space. Clearing site data by hand
                    still erases it.
                  </>
                ) : (
                  <>
                    <strong>This browser hasn't promised to keep your data.</strong>{' '}
                    It can be cleared when storage runs low, and on iPhone after
                    seven days without opening CartWise.
                  </>
                )}
              </p>
              {durable !== 'granted' && (
                <button className="btn btn--ghost btn--small" type="button" onClick={askForDurability}>
                  Ask it to keep my data
                </button>
              )}
            </div>
          )}

          <p className="datapanel__hint">
            {lastBackupAt
              ? `Last saved copy: ${dateFormat.format(new Date(lastBackupAt))}.`
              : 'You have never saved a copy.'}
            {usage && formatBytes(usage.usage) && ` CartWise is using ${formatBytes(usage.usage)}.`}
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
