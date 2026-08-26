// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CURRENCIES, currencySymbol, formatMoney, getCurrency, setCurrency } from './currency.js'
import { findByBarcode, rememberBarcode, rememberItem } from './vault.js'

describe('currency list', () => {
  it('has no duplicate codes and every code is valid for Intl', () => {
    const codes = CURRENCIES.map((c) => c.code)
    assert.equal(new Set(codes).size, codes.length, 'no duplicates')
    for (const code of codes) {
      assert.doesNotThrow(
        () => new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(1),
        `${code} should be a real ISO 4217 code`,
      )
    }
  })
})

describe('switching currency', () => {
  it('changes how money prints', () => {
    setCurrency('PHP')
    assert.equal(getCurrency(), 'PHP')
    assert.match(formatMoney(1234.5), /1,234\.50/)
    assert.ok(formatMoney(1234.5).includes('₱'), 'shows the peso sign')

    setCurrency('USD')
    assert.ok(formatMoney(1234.5).includes('$'))
  })

  it('follows each currency own decimal rules', () => {
    setCurrency('JPY')
    // Yen has no minor unit — "¥1,235", not "¥1,234.50".
    assert.ok(!formatMoney(1234.5).includes('.'), 'yen prints whole')

    setCurrency('USD')
    assert.ok(formatMoney(1234.5).includes('.50'))
  })

  it('ignores codes that are not on the list', () => {
    setCurrency('USD')
    setCurrency('XYZ')
    assert.equal(getCurrency(), 'USD', 'unchanged')
    setCurrency('')
    assert.equal(getCurrency(), 'USD')
  })

  it('still formats junk without throwing', () => {
    setCurrency('EUR')
    assert.equal(typeof formatMoney(NaN), 'string')
    assert.equal(typeof formatMoney(undefined), 'string')
    setCurrency('USD')
  })

  it('gives a symbol for every listed currency', () => {
    for (const { code } of CURRENCIES) {
      const symbol = currencySymbol(code)
      assert.ok(symbol && symbol.length > 0, `${code} has a symbol`)
    }
  })
})

describe('barcodes', () => {
  const stocked = () => {
    const v = rememberItem([], {
      name: 'Corned Beef',
      category: 'meat',
      price: 2.4,
      qty: 1,
      unit: 'can',
      storeId: 's1',
    })
    return rememberBarcode(v, 'Corned Beef', '4800016641107')
  }

  it('finds an item by its code', () => {
    const vault = stocked()
    assert.equal(findByBarcode(vault, '4800016641107').name, 'Corned Beef')
    assert.equal(findByBarcode(vault, '  4800016641107  ').name, 'Corned Beef', 'trimmed')
  })

  it('keeps leading zeros significant', () => {
    let v = rememberItem([], { name: 'Milk', category: 'dairy', price: 1, qty: 1 })
    v = rememberBarcode(v, 'Milk', '0012345678905')
    assert.equal(findByBarcode(v, '0012345678905').name, 'Milk')
    assert.equal(findByBarcode(v, '12345678905'), null, 'not the same code')
  })

  it('returns null for a code it has never seen', () => {
    const vault = stocked()
    assert.equal(findByBarcode(vault, '9999999999999'), null)
    assert.equal(findByBarcode(vault, ''), null)
    assert.equal(findByBarcode(vault, null), null)
  })

  it('moves a code rather than letting two items share it', () => {
    let vault = stocked()
    vault = rememberItem(vault, { name: 'Luncheon Meat', category: 'meat', price: 2, qty: 1 })
    vault = rememberBarcode(vault, 'Luncheon Meat', '4800016641107')

    const holders = vault.filter((v) => v.barcode === '4800016641107')
    assert.equal(holders.length, 1, 'exactly one item owns the code')
    assert.equal(holders[0].name, 'Luncheon Meat')
    assert.equal(findByBarcode(vault, '4800016641107').name, 'Luncheon Meat')
  })

  it('does nothing when the named item is not in the vault', () => {
    const vault = stocked()
    assert.deepEqual(rememberBarcode(vault, 'Nothing Here', '111'), vault)
  })
})
