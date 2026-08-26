// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  inviteExpiry,
  inviteTimeLeft,
  isValidInviteCode,
  makeInviteCode,
  normalizeInviteCode,
} from './invites.js'

describe('invite codes', () => {
  it('are six characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = makeInviteCode()
      assert.equal(code.length, 6)
      assert.equal(isValidInviteCode(code), true, code)
    }
  })

  it('never contain a character people confuse', () => {
    // O/0, I/1/L, S/5, B/8, Z/2, U/V are all excluded by design.
    const banned = /[OIL01SB8Z2UV5]/
    for (let i = 0; i < 200; i += 1) {
      assert.equal(banned.test(makeInviteCode()), false)
    }
  })

  it('use the whole alphabet rather than favouring the start of it', () => {
    // A modulo without rejection sampling biases towards early characters;
    // over this many draws that bias would show up as missing letters.
    const seen = new Set()
    for (let i = 0; i < 3000; i += 1) {
      for (const c of makeInviteCode()) seen.add(c)
    }
    assert.equal(seen.size, 22, `saw ${seen.size} distinct characters`)
  })

  it('are not repeated in a small sample', () => {
    const codes = new Set()
    for (let i = 0; i < 500; i += 1) codes.add(makeInviteCode())
    assert.ok(codes.size > 495, `only ${codes.size} unique out of 500`)
  })
})

describe('normalising a typed code', () => {
  it('strips the punctuation people add when reading aloud', () => {
    assert.equal(normalizeInviteCode(' k7q-m3x '), 'K7QM3X')
    assert.equal(normalizeInviteCode('K7Q M3X'), 'K7QM3X')
    assert.equal(normalizeInviteCode('k7q.m3x'), 'K7QM3X')
  })

  it('leaves a correctly typed code untouched', () => {
    const code = makeInviteCode()
    assert.equal(normalizeInviteCode(code), code)
  })

  it('does not invent a valid code from an invalid one', () => {
    // 'O' is not in the alphabet. Guessing it meant 'Q' would silently point
    // at a different, possibly real, invite.
    const result = normalizeInviteCode('OOOOOO')
    assert.equal(isValidInviteCode(result), false)
  })

  it('copes with nothing', () => {
    assert.equal(normalizeInviteCode(null), '')
    assert.equal(normalizeInviteCode(undefined), '')
    assert.equal(isValidInviteCode(''), false)
  })
})

describe('isValidInviteCode', () => {
  it('rejects the wrong length and the wrong characters', () => {
    assert.equal(isValidInviteCode('K7QM3'), false, 'too short')
    assert.equal(isValidInviteCode('K7QM3XX'), false, 'too long')
    assert.equal(isValidInviteCode('K7QM3O'), false, 'excluded letter')
    assert.equal(isValidInviteCode('k7qm3x'), false, 'lower case')
    assert.equal(isValidInviteCode(null), false)
    assert.equal(isValidInviteCode(123456), false)
  })
})

describe('expiry wording', () => {
  const now = new Date(2026, 5, 1, 12, 0).getTime()

  it('counts down in units people use', () => {
    assert.equal(inviteTimeLeft(new Date(now + 30 * 60000).toISOString(), now), 'under an hour left')
    assert.equal(inviteTimeLeft(new Date(now + 3600000).toISOString(), now), '1 hour left')
    assert.equal(inviteTimeLeft(new Date(now + 5 * 3600000).toISOString(), now), '5 hours left')
    assert.equal(inviteTimeLeft(new Date(now + 48 * 3600000).toISOString(), now), '2 days left')
  })

  it('says so once it has expired', () => {
    assert.equal(inviteTimeLeft(new Date(now - 1000).toISOString(), now), 'expired')
    assert.equal(inviteTimeLeft('not a date', now), 'expired')
  })

  it('mints an expiry a week out', () => {
    const iso = inviteExpiry(now)
    const days = (new Date(iso).getTime() - now) / 86400000
    assert.equal(days, 7)
  })
})
