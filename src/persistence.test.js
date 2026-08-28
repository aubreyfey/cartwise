// Run with: npm test
import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  backupUrgency,
  canPersist,
  formatBytes,
  persistenceState,
  requestPersistence,
  storageEstimate,
} from './persistence.js'

const DAY = 86_400_000
const NOW = 1_760_000_000_000

// Node 24 defines navigator as a getter-only global, so it has to be replaced
// rather than assigned.
const realNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

const withNavigator = (storage) => {
  Object.defineProperty(globalThis, 'navigator', {
    value: storage === undefined ? undefined : { storage },
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  if (realNavigator) Object.defineProperty(globalThis, 'navigator', realNavigator)
  else delete globalThis.navigator
})

describe('canPersist', () => {
  it('is false where the API is missing', () => {
    withNavigator(undefined)
    assert.equal(canPersist(), false)
    withNavigator({})
    assert.equal(canPersist(), false)
  })

  it('is true where it exists', () => {
    withNavigator({ persist: async () => true, persisted: async () => false })
    assert.equal(canPersist(), true)
  })
})

describe('requestPersistence', () => {
  it('says unavailable rather than pretending, where there is no API', () => {
    withNavigator({})
    return requestPersistence().then((r) => assert.equal(r, 'unavailable'))
  })

  it('does not ask again once already granted', async () => {
    let asked = false
    withNavigator({
      persisted: async () => true,
      persist: async () => {
        asked = true
        return true
      },
    })
    assert.equal(await requestPersistence(), 'granted')
    assert.equal(asked, false)
  })

  it('asks when not yet granted', async () => {
    withNavigator({ persisted: async () => false, persist: async () => true })
    assert.equal(await requestPersistence(), 'granted')
  })

  it('reports a refusal as denied, not as success', async () => {
    withNavigator({ persisted: async () => false, persist: async () => false })
    assert.equal(await requestPersistence(), 'denied')
  })

  it('never throws when the browser errors', async () => {
    withNavigator({
      persisted: async () => {
        throw new Error('nope')
      },
      persist: async () => true,
    })
    assert.equal(await requestPersistence(), 'unavailable')
  })
})

describe('persistenceState', () => {
  it('reports without requesting a change', async () => {
    let asked = false
    withNavigator({
      persisted: async () => false,
      persist: async () => {
        asked = true
        return true
      },
    })
    assert.equal(await persistenceState(), 'denied')
    assert.equal(asked, false)
  })
})

describe('storageEstimate', () => {
  it('reports usage against quota', async () => {
    withNavigator({ estimate: async () => ({ usage: 500, quota: 1000 }) })
    const e = await storageEstimate()
    assert.equal(e.ratio, 0.5)
  })

  it('is null when the browser will not say', async () => {
    withNavigator({})
    assert.equal(await storageEstimate(), null)
    withNavigator({ estimate: async () => ({ usage: 5, quota: 0 }) })
    assert.equal(await storageEstimate(), null)
  })

  it('never throws', async () => {
    withNavigator({
      estimate: async () => {
        throw new Error('nope')
      },
    })
    assert.equal(await storageEstimate(), null)
  })
})

describe('formatBytes', () => {
  it('scales the unit', () => {
    assert.equal(formatBytes(512), '512 B')
    assert.equal(formatBytes(2048), '2 KB')
    assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB')
  })

  it('is null for nonsense', () => {
    assert.equal(formatBytes(null), null)
    assert.equal(formatBytes(-1), null)
    assert.equal(formatBytes(NaN), null)
  })
})

describe('backupUrgency', () => {
  const loaded = { purchases: 60, trips: 4, now: NOW }

  it('stays quiet on an app with nothing to lose', () => {
    // Nagging someone on day one teaches them to dismiss the nag.
    assert.equal(backupUrgency({ trips: 0, purchases: 0, now: NOW }).level, 'none')
    assert.equal(backupUrgency({ trips: 0, purchases: 9, now: NOW }).level, 'none')
  })

  it('is overdue when a real Vault has never been backed up and storage is not durable', () => {
    assert.equal(backupUrgency({ ...loaded, persisted: false }).level, 'overdue')
  })

  it('is softer when the browser has promised to keep the data', () => {
    assert.equal(backupUrgency({ ...loaded, persisted: true }).level, 'due')
  })

  it('goes quiet again for a month after an export', () => {
    assert.equal(backupUrgency({ ...loaded, lastBackupAt: NOW - 3 * DAY }).level, 'none')
    assert.equal(backupUrgency({ ...loaded, lastBackupAt: NOW - 29 * DAY }).level, 'none')
  })

  it('escalates as the backup ages', () => {
    assert.equal(backupUrgency({ ...loaded, lastBackupAt: NOW - 31 * DAY }).level, 'due')
    assert.equal(backupUrgency({ ...loaded, lastBackupAt: NOW - 100 * DAY }).level, 'overdue')
  })

  it('reports the age so the message can be specific', () => {
    assert.equal(backupUrgency({ ...loaded, lastBackupAt: NOW - 45 * DAY }).days, 45)
  })

  it('survives being called with nothing', () => {
    assert.equal(backupUrgency().level, 'none')
  })
})
