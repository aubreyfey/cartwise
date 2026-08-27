// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_CATEGORIES,
  DEFAULT_IDS,
  FALLBACK_ID,
  activeCategories,
  addCustomCategory,
  allCategories,
  countUnder,
  deleteCustomCategory,
  emptyLibrary,
  isCustom,
  labelFor,
  normaliseLibrary,
  renameCategory,
  setCategoryActive,
} from './categoryLibrary.js'
import { CATEGORIES as BUILT_IN } from './categories.js'

describe('default categories', () => {
  it('keeps every original id, because those ids are written into saved data', () => {
    // Renaming or dropping one of these would silently reclassify every item,
    // Vault entry, pantry entry and archived trip already filed under it.
    for (const original of BUILT_IN) {
      assert.ok(DEFAULT_IDS.includes(original.id), `${original.id} survives`)
    }
  })

  it('has no duplicate ids', () => {
    assert.equal(new Set(DEFAULT_IDS).size, DEFAULT_IDS.length)
  })

  it('gives every category a label and a sticker', () => {
    for (const c of DEFAULT_CATEGORIES) {
      assert.ok(c.label, `${c.id} has a label`)
      assert.ok(c.sticker, `${c.id} has a sticker`)
    }
  })
})

describe('normaliseLibrary', () => {
  it('turns anything unusable into an empty library', () => {
    for (const junk of [null, undefined, 'library', 42, []]) {
      assert.deepEqual(normaliseLibrary(junk), emptyLibrary())
    }
  })

  it('drops a custom category with no name', () => {
    const lib = normaliseLibrary({ custom: [{ id: 'c-1', label: '   ' }, { id: 'c-2', label: 'Pets' }] })
    assert.deepEqual(lib.custom.map((c) => c.label), ['Pets'])
  })

  it('drops a custom entry whose id is not a custom id', () => {
    // Otherwise a stored blob could shadow a built-in and take its items.
    const lib = normaliseLibrary({ custom: [{ id: 'produce', label: 'Hijack' }] })
    assert.deepEqual(lib.custom, [])
  })

  it('drops a rename pointing at a category that does not exist', () => {
    assert.deepEqual(normaliseLibrary({ labels: { nope: 'Ghost' } }).labels, {})
  })

  it('refuses to archive the fallback', () => {
    // An item whose aisle is hidden has to have somewhere to go.
    assert.deepEqual(normaliseLibrary({ archived: [FALLBACK_ID] }).archived, [])
  })

  it('deduplicates the archive', () => {
    assert.deepEqual(normaliseLibrary({ archived: ['frozen', 'frozen'] }).archived, ['frozen'])
  })
})

describe('allCategories', () => {
  it('lists everything, in the order given', () => {
    const order = ['dairy', 'produce']
    const ids = allCategories(emptyLibrary(), order).map((c) => c.id)
    assert.equal(ids[0], 'dairy')
    assert.equal(ids[1], 'produce')
    assert.equal(ids.length, DEFAULT_IDS.length, 'and everything else still appears')
  })

  it('shows a custom category even when the order has never heard of it', () => {
    // Otherwise a new category vanishes the instant it is created.
    const lib = addCustomCategory(emptyLibrary(), 'Pet supplies')
    const ids = allCategories(lib, DEFAULT_IDS).map((c) => c.id)
    assert.equal(ids.length, DEFAULT_IDS.length + 1)
    assert.ok(ids.some(isCustom))
  })

  it('marks what is switched off', () => {
    const lib = setCategoryActive(emptyLibrary(), 'frozen', false)
    const frozen = allCategories(lib, DEFAULT_IDS).find((c) => c.id === 'frozen')
    assert.equal(frozen.active, false)
  })

  it('never repeats a category', () => {
    const ids = allCategories(emptyLibrary(), ['produce', 'produce', 'dairy']).map((c) => c.id)
    assert.equal(new Set(ids).size, ids.length)
  })
})

describe('activeCategories', () => {
  it('leaves out the archived ones', () => {
    const lib = setCategoryActive(emptyLibrary(), 'frozen', false)
    assert.ok(!activeCategories(lib, DEFAULT_IDS).some((c) => c.id === 'frozen'))
  })

  it('always includes the fallback', () => {
    const lib = setCategoryActive(emptyLibrary(), FALLBACK_ID, false)
    assert.ok(activeCategories(lib, DEFAULT_IDS).some((c) => c.id === FALLBACK_ID))
  })
})

describe('renaming', () => {
  it('renames a built-in by label, keeping its id', () => {
    const lib = renameCategory(emptyLibrary(), 'produce', 'Fresh Produce')
    assert.equal(labelFor(lib, 'produce'), 'Fresh Produce')
    assert.ok(DEFAULT_IDS.includes('produce'), 'id untouched')
  })

  it('puts the shipped name back when the override is cleared', () => {
    let lib = renameCategory(emptyLibrary(), 'produce', 'Fresh Produce')
    lib = renameCategory(lib, 'produce', '   ')
    assert.equal(labelFor(lib, 'produce'), 'Produce')
  })

  it('renames a custom category in place', () => {
    let lib = addCustomCategory(emptyLibrary(), 'Pets')
    const id = lib.custom[0].id
    lib = renameCategory(lib, id, 'Pet supplies')
    assert.equal(labelFor(lib, id), 'Pet supplies')
  })

  it('refuses to blank a custom category’s only name', () => {
    let lib = addCustomCategory(emptyLibrary(), 'Pets')
    const id = lib.custom[0].id
    lib = renameCategory(lib, id, '')
    assert.equal(labelFor(lib, id), 'Pets')
  })

  it('caps a very long name rather than breaking the row', () => {
    const lib = renameCategory(emptyLibrary(), 'produce', 'x'.repeat(200))
    assert.ok(labelFor(lib, 'produce').length <= 40)
  })
})

describe('custom categories', () => {
  it('creates one with an id that cannot collide with a built-in', () => {
    const lib = addCustomCategory(emptyLibrary(), 'Pets')
    assert.ok(isCustom(lib.custom[0].id))
    assert.ok(!DEFAULT_IDS.includes(lib.custom[0].id))
  })

  it('ignores an empty name', () => {
    assert.deepEqual(addCustomCategory(emptyLibrary(), '  ').custom, [])
  })

  it('deletes one and reports what has to be reassigned', () => {
    let lib = addCustomCategory(emptyLibrary(), 'Pets')
    const id = lib.custom[0].id
    const { library, reassignFrom } = deleteCustomCategory(lib, id)
    assert.equal(reassignFrom, id)
    assert.deepEqual(library.custom, [])
  })

  it('refuses to delete a built-in', () => {
    // Its id is load-bearing; archiving is the only thing on offer.
    const { library, reassignFrom } = deleteCustomCategory(emptyLibrary(), 'produce')
    assert.equal(reassignFrom, null)
    assert.deepEqual(library, emptyLibrary())
  })
})

describe('countUnder', () => {
  it('counts across lists, the Vault and the pantry', () => {
    const data = {
      carts: [{ items: [{ category: 'dairy' }, { category: 'produce' }] }],
      vault: [{ category: 'dairy' }],
      pantry: [{ category: 'dairy' }],
    }
    assert.equal(countUnder('dairy', data), 3)
    assert.equal(countUnder('frozen', data), 0)
  })

  it('copes with nothing passed', () => {
    assert.equal(countUnder('dairy'), 0)
  })
})
