// Invite codes are read out loud or typed by hand, so the alphabet leaves out
// every pair people confuse: O/0, I/1/L, S/5, B/8, Z/2, U/V. What is left is
// unambiguous in speech and on a screen.
const ALPHABET = 'ACDEFGHJKMNPQRTWXY3467'
const LENGTH = 6

export const INVITE_TTL_DAYS = 7

/** A fresh code. Uses crypto so codes are not guessable from one another. */
export function makeInviteCode(random = cryptoRandom) {
  let code = ''
  for (let i = 0; i < LENGTH; i += 1) {
    code += ALPHABET[random(ALPHABET.length)]
  }
  return code
}

function cryptoRandom(max) {
  if (globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1)
    // Reject the tail of the range so every letter is equally likely; modulo
    // on its own would quietly favour the first few characters.
    const limit = Math.floor(0xffffffff / max) * max
    let n
    do {
      globalThis.crypto.getRandomValues(buf)
      n = buf[0]
    } while (n >= limit)
    return n % max
  }
  return Math.floor(Math.random() * max)
}

/**
 * Tidy up what someone typed: uppercase, and drop the spaces, dashes and
 * punctuation people add when reading a code aloud.
 *
 * Deliberately no "did you mean" folding of excluded characters. Since the
 * alphabet already leaves out every confusable pair, a character outside it
 * means a genuine mistake, and guessing which letter was intended would
 * silently produce a different valid-looking code. Better to hand back
 * something that fails `isValidInviteCode` and say so plainly.
 */
export function normalizeInviteCode(input) {
  return String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export const isValidInviteCode = (code) =>
  typeof code === 'string' &&
  code.length === LENGTH &&
  [...code].every((c) => ALPHABET.includes(c))

export function inviteExpiry(from = Date.now()) {
  return new Date(from + INVITE_TTL_DAYS * 86400000).toISOString()
}

/** Human wording for how long an invite has left. */
export function inviteTimeLeft(expiresAt, now = Date.now()) {
  const ms = new Date(expiresAt).getTime() - now
  if (!Number.isFinite(ms) || ms <= 0) return 'expired'
  const hours = Math.floor(ms / 3600000)
  if (hours < 1) return 'under an hour left'
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`
  const days = Math.round(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}
