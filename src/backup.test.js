// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  BACKUP_VERSION,
  backupFilename,
  collectBackup,
  describeBackup,
  validateBackup,
} from './backup.js'
import { completeTrip, insights } from './trips.js'

const store = {
  'cartwise.carts': [{ id: 'c1', name: 'Weekly', items: [{ id: 'i1', name: 'Milk' }] }],
  'cartwise.vault': [{ id: 'v1', name: 'Milk' }],
  'cartwise.trips': [],
  'cartwise.currency': 'PHP',
}
const read = (key) => store[key] ?? null

describe('backup export', () => {
  it('collects only the keys it knows about, stamped and versioned', () => {
    const backup = collectBackup(read)
    assert.equal(backup.app, 'cartwise')
    assert.equal(backup.version, BACKUP_VERSION)
    assert.ok(backup.exportedAt)
    assert.deepEqual(Object.keys(backup.data).sort(), [
      'cartwise.carts',
      'cartwise.currency',
      'cartwise.trips',
      'cartwise.vault',
    ])
  })

  it('names the file by date', () => {
    assert.equal(backupFilename(new Date(2026, 0, 5)), 'cartwise-2026-01-05.json')
  })

  it('summarises what is inside', () => {
    const text = describeBackup(collectBackup(read).data)
    assert.match(text, /1 list/)
    assert.match(text, /1 item/)
    assert.match(text, /1 in the Vault/)
    assert.match(text, /0 trips/)
  })
})

describe('backup validation', () => {
  const good = () => collectBackup(read)

  it('accepts its own output', () => {
    assert.equal(validateBackup(good()).ok, true)
  })

  it('rejects anything that is not a Cartwise backup', () => {
    for (const bad of [null, undefined, 42, 'text', {}, { app: 'other', version: 1, data: {} }]) {
      assert.equal(validateBackup(bad).ok, false)
    }
  })

  it('refuses a backup from a newer version', () => {
    const future = { ...good(), version: BACKUP_VERSION + 1 }
    const result = validateBackup(future)
    assert.equal(result.ok, false)
    assert.match(result.reason, /newer version/)
  })

  it('rejects a damaged carts array before it can white-screen the app', () => {
    assert.equal(validateBackup({ ...good(), data: { 'cartwise.carts': 'nope' } }).ok, false)
    assert.equal(
      validateBackup({ ...good(), data: { 'cartwise.carts': [{ id: 'x' }] } }).ok,
      false,
      'a cart with no items array is damaged',
    )
    assert.equal(
      validateBackup({ ...good(), data: { 'cartwise.carts': [null] } }).ok,
      false,
    )
  })

  it('refuses unknown keys rather than writing them to storage', () => {
    const sneaky = { ...good(), data: { 'evil.key': 1 } }
    const result = validateBackup(sneaky)
    assert.equal(result.ok, false)
    assert.match(result.reason, /Unexpected data/)
  })

  it('accepts an empty but well-formed backup', () => {
    assert.equal(validateBackup({ app: 'cartwise', version: 1, data: {} }).ok, true)
  })
})

describe('impulse tracking', () => {
  const cart = {
    id: 'c1',
    name: 'Weekly',
    budget: 100,
    items: [
      { id: '1', name: 'Milk', category: 'dairy', qty: 1, price: 10, unit: 'pc', checked: true },
      { id: '2', name: 'Crisps', category: 'snacks', qty: 2, price: 5, unit: 'bag', checked: true, impulse: true },
      { id: '3', name: 'Rice', category: 'pantry', qty: 1, price: 20, unit: 'bag', checked: false },
    ],
  }

  it('separates what you planned from what you grabbed', () => {
    const trip = completeTrip(cart, null, 1000)
    assert.equal(trip.impulseCount, 1)
    assert.equal(trip.impulseTotal, 10, '2 bags at 5')
    assert.equal(trip.plannedBought, 1)
    assert.equal(trip.total, 20)
  })

  it('reports the share of items that were on the list', () => {
    const trip = completeTrip(cart, null, 1000)
    const stats = insights([trip])
    assert.equal(stats.impulseItems, 1)
    assert.equal(stats.impulseSpend, 10)
    assert.equal(stats.plannedShare, 0.5, '1 of 2 bought items was planned')
  })

  it('leaves pre-tracking trips out rather than counting them as all-planned', () => {
    const legacy = {
      id: 'old', cartName: 'Weekly', storeName: null, completedAt: 1, budget: 0, total: 50,
      items: [{ name: 'Bread', category: 'bakery', qty: 1, price: 50 }],
    }
    const stats = insights([legacy, completeTrip(cart, null, 1000)])
    assert.equal(stats.tripCount, 2)
    assert.equal(stats.trackedTrips, 1, 'only the new trip has impulse data')
    assert.equal(stats.plannedShare, 0.5, 'the legacy trip did not inflate it')
  })

  it('gives no share at all when nothing has been tracked', () => {
    const legacy = {
      id: 'old', cartName: 'W', storeName: null, completedAt: 1, budget: 0, total: 5,
      items: [{ name: 'Bread', category: 'bakery', qty: 1, price: 5 }],
    }
    assert.equal(insights([legacy]).plannedShare, null)
  })
})
