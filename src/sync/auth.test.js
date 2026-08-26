// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { looksLikeEmail } from './auth.js'
import { syncAvailable, syncConfig, syncStatusMessage } from './config.js'

describe('email check', () => {
  it('accepts ordinary and awkward-but-valid addresses', () => {
    for (const good of [
      'a@b.co',
      'aubrey.fey@example.com',
      'name+tag@sub.domain.example',
      "o'brien@example.com",
      '  spaced@example.com  ',
    ]) {
      assert.equal(looksLikeEmail(good), true, good)
    }
  })

  it('rejects what is obviously not an address', () => {
    for (const bad of ['', '   ', 'nope', 'a@b', '@b.co', 'a b@c.co', null, undefined, 42]) {
      assert.equal(looksLikeEmail(bad), false, String(bad))
    }
  })

  it('rejects an address longer than the spec allows', () => {
    assert.equal(looksLikeEmail('a'.repeat(250) + '@b.co'), false)
  })
})

describe('sync configuration', () => {
  it('is off when nothing is configured, and says so without alarming anyone', () => {
    // The test environment has no VITE_ vars, which is exactly the state of a
    // build made without a Supabase project.
    assert.equal(syncAvailable(), false)
    const message = syncStatusMessage()
    assert.match(message, /still works on this device/)
  })

  it('reports empty config rather than guessing', () => {
    assert.equal(syncConfig.url, '')
    assert.equal(syncConfig.anonKey, '')
  })
})
