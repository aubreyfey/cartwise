// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { searchCatalogue, toListItem } from './catalogue.js'

const guess = (name) => (/milk|cheese/i.test(name) ? 'dairy' : 'other')

// The shape loadCatalogue produces, built by hand so the tests do not need a
// network or a fixture file.
const rows = [
  { barcode: '4800361410816', name: 'Bear Brand Powdered Milk', brand: 'Bear Brand', size: '33 g' },
  { barcode: '0750515018402', name: 'SkyFlakes Crackers', brand: 'SkyFlakes', size: '25 g' },
  { barcode: '4806502720615', name: 'Gardenia White Bread Classic', brand: 'Gardenia', size: '600 g' },
  { barcode: '4800016644931', name: 'Alaska Condensed Milk', brand: 'Alaska', size: '300 mL' },
  { barcode: '1111111111111', name: 'Milkfish Bangus', brand: '', size: '' },
].map((r) => ({
  ...r,
  brand: r.brand || null,
  size: r.size || null,
  haystack: `${r.name} ${r.brand}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
}))

describe('searchCatalogue', () => {
  it('finds a product by name', () => {
    const hits = searchCatalogue(rows, 'skyflakes')
    assert.equal(hits.length, 1)
    assert.equal(hits[0].barcode, '0750515018402')
  })

  it('finds several and puts the closest first', () => {
    const names = searchCatalogue(rows, 'milk').map((r) => r.name)
    // "Milkfish" starts with the query; the others merely contain it.
    assert.equal(names[0], 'Milkfish Bangus')
    assert.ok(names.includes('Alaska Condensed Milk'))
  })

  it('matches on the brand as well as the name', () => {
    assert.equal(searchCatalogue(rows, 'gardenia')[0].brand, 'Gardenia')
  })

  it('ignores case and punctuation', () => {
    assert.equal(searchCatalogue(rows, '  ALASKA! ').length, 1)
  })

  it('says nothing for one letter', () => {
    // Otherwise every keystroke of a long name walks nine thousand rows.
    assert.deepEqual(searchCatalogue(rows, 'm'), [])
    assert.deepEqual(searchCatalogue(rows, ''), [])
  })

  it('copes with no catalogue loaded', () => {
    assert.deepEqual(searchCatalogue(null, 'milk'), [])
    assert.deepEqual(searchCatalogue([], 'milk'), [])
  })

  it('respects the limit', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      barcode: String(i).padStart(13, '0'),
      name: `Milk Variant ${i}`,
      brand: null,
      size: null,
      haystack: `milk variant ${i}`,
    }))
    assert.equal(searchCatalogue(many, 'milk', { limit: 10 }).length, 10)
  })
})

describe('toListItem', () => {
  it('carries the barcode, so the next scan of it is instant', () => {
    const item = toListItem(rows[0], guess)
    assert.equal(item.barcode, '4800361410816')
  })

  it('never invents a price', () => {
    // Open Food Facts has none. A made-up one would poison the budget and
    // teach the Vault a lie.
    const item = toListItem(rows[0], guess)
    assert.equal(item.price, null)
  })

  it('does not repeat a brand already at the front of the name', () => {
    // "Bear Brand Powdered Milk", not "Bear Brand Bear Brand Powdered Milk".
    assert.equal(toListItem(rows[0], guess).name, 'Bear Brand Powdered Milk')
  })

  it('prefixes a brand that is missing from the name', () => {
    const row = { ...rows[1], name: 'Crackers', haystack: 'crackers skyflakes' }
    assert.equal(toListItem(row, guess).name, 'SkyFlakes Crackers')
  })

  it('guesses the aisle from the full label', () => {
    assert.equal(toListItem(rows[3], guess).category, 'dairy')
  })

  it('keeps the package size', () => {
    assert.equal(toListItem(rows[3], guess).packageSize, '300 mL')
  })

  it('starts at a quantity of one', () => {
    assert.equal(toListItem(rows[0], guess).qty, 1)
  })
})
