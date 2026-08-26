import { cleanAuthUrl, getClient } from './client.js'

/**
 * Email is checked with a deliberately loose pattern. The only authority on
 * whether an address works is whether the mail arrives, and a strict regex
 * mostly succeeds at rejecting valid unusual addresses.
 */
export function looksLikeEmail(value) {
  const trimmed = String(value ?? '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254
}

/**
 * Send a sign-in link. Resolves to `{ ok }` rather than throwing, because
 * every failure here is something the user needs worded, not a stack trace.
 */
export async function sendMagicLink(email) {
  if (!looksLikeEmail(email)) {
    return { ok: false, reason: 'That does not look like an email address.' }
  }
  const supabase = await getClient()
  if (!supabase) return { ok: false, reason: 'Sharing is not available right now.' }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  })

  if (error) {
    // Rate limiting is the common one and deserves plain wording.
    if (/rate|too many/i.test(error.message)) {
      return { ok: false, reason: 'Too many attempts. Wait a minute and try again.' }
    }
    return { ok: false, reason: error.message }
  }
  return { ok: true }
}

export async function signOut() {
  const supabase = await getClient()
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function currentSession() {
  const supabase = await getClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

/**
 * Subscribe to sign-in and sign-out.
 *
 * Returns an unsubscribe function synchronously even though the client loads
 * asynchronously — a component that mounts and unmounts quickly must be able
 * to clean up without awaiting anything, or it leaks a subscription.
 */
export function onAuthChange(handler) {
  let unsubscribe = null
  let cancelled = false

  getClient().then((supabase) => {
    if (!supabase || cancelled) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cleanAuthUrl()
      handler(session ?? null)
    })
    unsubscribe = () => data?.subscription?.unsubscribe?.()
  })

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}
