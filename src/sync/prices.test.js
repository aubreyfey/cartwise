// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { fromConsensusRow, toRow } from './prices.js'
import { makeReport } from '../community.js'

const NOW = new Date('2026-08-27T16:42:31').getTime()

const report = () =>
  makeReport({
    product: { name: 'Alaska Condensed Milk', barcode: '4800361410816' },
    storeName: 'Gaisano',
    price: 42.5,
    unit: 'pc',
    at: NOW,
  })

describe('toRow', () => {
  it('sends nothing that identifies anyone', () => {
    // The wire format is the last place a leak can be introduced, so it is
    // pinned separately from makeReport.
    const row = toRow(report())
    const banned = ['id', 'user_id', 'device_id', 'trip_id', 'list_id', 'purchase_id', 'created_at']
    for (const field of banned) {
      assert.ok(!(field in row), `${field} must never be sent`)
    }
  })

  it('sends a plain date, not a time', () => {
    // The column is a DATE, so a precise time cannot be stored — but it must
    // not even leave the device.
    const row = toRow(report())
    assert.match(row.reported_on, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(!row.reported_on.includes(':'), 'no clock time')
  })

  it('maps every column the table expects', () => {
    const row = toRow(report())
    assert.deepEqual(Object.keys(row).sort(), [
      'currency', 'exact_match', 'price', 'product_key', 'product_name',
      'reported_on', 'store_key', 'store_name', 'unit',
    ])
  })

  it('carries whether the product match was exact', () => {
    assert.equal(toRow(report()).exact_match, true)
    const loose = makeReport({ product: { name: 'Milk' }, storeName: 'X', price: 10, at: NOW })
    assert.equal(toRow(loose).exact_match, false)
  })

  it('is null for a report that was never made', () => {
    assert.equal(toRow(null), null)
  })
})

describe('fromConsensusRow', () => {
  const row = {
    product_key: 'ean:4800361410816',
    exact_match: true,
    store_key: 'store:gaisano',
    store_name: 'Gaisano',
    product_name: 'Alaska Condensed Milk',
    unit: 'pc',
    currency: 'PHP',
    price: '42.50',
    sightings: '6',
    last_reported_on: '2026-08-26',
  }

  it('reads back into the same shape the local reports use', () => {
    // So estimateBasket cannot tell a community price from one of your own,
    // which is the point — one code path, two sources.
    const mapped = fromConsensusRow(row)
    assert.equal(mapped.productKey, 'ean:4800361410816')
    assert.equal(mapped.storeKey, 'store:gaisano')
    assert.equal(typeof mapped.price, 'number')
    assert.equal(mapped.price, 42.5)
  })

  it('turns the numeric strings Postgres returns into numbers', () => {
    // node-postgres hands back numeric as a string; a string price would
    // silently concatenate in every total downstream.
    const mapped = fromConsensusRow(row)
    assert.equal(typeof mapped.price, 'number')
    assert.equal(typeof mapped.sightings, 'number')
    assert.equal(mapped.sightings, 6)
  })

  it('parses the date locally rather than as UTC', () => {
    // new Date('2026-08-26') is midnight UTC, which is the previous day west
    // of Greenwich — the same bug that made things expire a day early.
    const mapped = fromConsensusRow(row)
    const d = new Date(mapped.reportedAt)
    assert.equal(d.getDate(), 26)
    assert.equal(d.getMonth(), 7)
  })

  it('marks the price as coming from the community', () => {
    assert.equal(fromConsensusRow(row).community, true)
  })

  it('is null for nothing', () => {
    assert.equal(fromConsensusRow(null), null)
  })
})
