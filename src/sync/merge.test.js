// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  TOMBSTONE_TTL_MS,
  fromRemoteItem,
  mergeItems,
  pruneTombstones,
  toRemoteItem,
} from './merge.js'

const item = (id, updatedAt, extra = {}) => ({
  id,
  name: id,
  qty: 1,
  unit: 'pc',
  price: 10,
  checked: false,
  deleted: false,
  updatedAt,
  ...extra,
})

const names = (rows) => rows.map((r) => r.id).sort()

describe('mergeItems', () => {
  it('keeps the newer of two versions', () => {
    const { merged } = mergeItems(
      [item('milk', 200, { checked: true })],
      [item('milk', 100, { checked: false })],
    )
    assert.equal(merged.length, 1)
    assert.equal(merged[0].checked, true, 'the newer local edit won')
  })

  it('lets the server win when it is newer', () => {
    const { merged, toPush } = mergeItems(
      [item('milk', 100, { checked: false })],
      [item('milk', 300, { checked: true })],
    )
    assert.equal(merged[0].checked, true)
    assert.deepEqual(toPush, [], 'nothing to send back')
  })

  it('breaks ties the same way on both devices', () => {
    // Same timestamp: remote wins. If it preferred local, each phone would
    // keep its own copy and re-push it on every sync, forever.
    const local = item('milk', 500, { name: 'local' })
    const remote = item('milk', 500, { name: 'remote' })
    assert.equal(mergeItems([local], [remote]).merged[0].name, 'remote')
    assert.equal(mergeItems([remote], [local]).merged[0].name, 'local')
  })

  it('adds rows the server has that we do not', () => {
    const { merged, toPush } = mergeItems([], [item('eggs', 100)])
    assert.deepEqual(names(merged), ['eggs'])
    assert.deepEqual(toPush, [])
  })

  it('pushes rows we have that the server does not', () => {
    const { merged, toPush } = mergeItems([item('eggs', 100)], [])
    assert.deepEqual(names(merged), ['eggs'])
    assert.deepEqual(names(toPush), ['eggs'])
  })

  it('honours a remote deletion', () => {
    const { merged } = mergeItems(
      [item('milk', 100)],
      [item('milk', 200, { deleted: true })],
    )
    assert.deepEqual(merged, [], 'deleted remotely, and that edit is newer')
  })

  it('resurrects a row we edited after it was deleted elsewhere', () => {
    const { merged, toPush } = mergeItems(
      [item('milk', 400, { checked: true })],
      [item('milk', 200, { deleted: true })],
    )
    assert.equal(merged.length, 1, 'our later edit wins')
    assert.deepEqual(names(toPush), ['milk'])
  })

  it('pushes a local deletion the server has never seen', () => {
    // Without this the row simply reappears on the next sync from another
    // device that still has it.
    const { merged, toPush } = mergeItems([item('milk', 300, { deleted: true })], [])
    assert.deepEqual(merged, [], 'not shown')
    assert.deepEqual(names(toPush), ['milk'], 'but the tombstone is sent')
  })

  it('treats a missing timestamp as the oldest possible', () => {
    const stale = { id: 'milk', name: 'no clock', deleted: false }
    const { merged } = mergeItems([stale], [item('milk', 1)])
    assert.equal(merged[0].name, 'milk', 'the timestamped row won')
  })

  it('ignores rows with no id rather than crashing', () => {
    const { merged } = mergeItems([{ name: 'junk' }, null], [item('milk', 1)])
    assert.deepEqual(names(merged), ['milk'])
  })

  it('is stable when both sides already agree', () => {
    const rows = [item('milk', 100), item('eggs', 200)]
    const { merged, toPush } = mergeItems(rows, rows)
    assert.deepEqual(names(merged), ['eggs', 'milk'])
    assert.deepEqual(toPush, [], 'a settled list generates no traffic')
  })

  it('copes with both sides empty', () => {
    assert.deepEqual(mergeItems([], []), { merged: [], toPush: [] })
    assert.deepEqual(mergeItems(), { merged: [], toPush: [] })
  })
})

describe('tombstones', () => {
  const now = 1_000_000_000_000

  it('keeps recent deletions so offline devices learn about them', () => {
    const kept = pruneTombstones([item('milk', now - 86400000, { deleted: true })], now)
    assert.equal(kept.length, 1)
  })

  it('drops deletions old enough that everyone has seen them', () => {
    const dropped = pruneTombstones(
      [item('milk', now - TOMBSTONE_TTL_MS - 1, { deleted: true })],
      now,
    )
    assert.deepEqual(dropped, [])
  })

  it('never drops a live row however old', () => {
    const kept = pruneTombstones([item('milk', 0, { deleted: false })], now)
    assert.equal(kept.length, 1)
  })
})

describe('wire format', () => {
  it('keeps an unknown price null rather than turning it into free', () => {
    const wire = toRemoteItem({ id: 'a', name: 'Yogurt', price: null }, 'list-1')
    assert.equal(wire.price, null)
    assert.equal(fromRemoteItem({ id: 'a', name: 'Yogurt', price: null }).price, null)
  })

  it('round-trips a normal row', () => {
    const local = item('milk', 0, { name: 'Fresh Milk', qty: 2, unit: 'bottle', price: 89 })
    const back = fromRemoteItem({
      ...toRemoteItem(local, 'list-1'),
      updated_at: '2026-08-26T09:00:00.000Z',
    })
    assert.equal(back.name, 'Fresh Milk')
    assert.equal(back.qty, 2)
    assert.equal(back.unit, 'bottle')
    assert.equal(back.price, 89)
    assert.equal(back.updatedAt, new Date('2026-08-26T09:00:00.000Z').getTime())
  })

  it('turns Postgres numeric strings back into numbers', () => {
    // node-postgres hands numeric(12,2) back as a string; left alone it would
    // make every total string-concatenate instead of adding up.
    const back = fromRemoteItem({ id: 'a', name: 'x', qty: '0.510', price: '220.00' })
    assert.equal(back.qty, 0.51)
    assert.equal(back.price, 220)
    assert.equal(typeof back.qty, 'number')
  })
})
