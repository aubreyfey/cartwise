// Sync is optional and off by default.
//
// Cartwise works completely without an account: lists, Vault, trips, expiry
// and stickers all live on the device. Signing in adds one thing — sharing a
// list with the people you live with — and nothing else moves off the phone.
//
// If these two variables are absent the app behaves exactly as it did before
// any of this existed: no network calls, no sign-in button, no dead UI.

const url = import.meta.env?.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * The anon key is meant to be public — it identifies the project, and every
 * table is guarded by row-level security in supabase/schema.sql. It is not a
 * secret and putting it in the bundle is the intended design. The service
 * role key is the secret one, and it must never appear in this codebase.
 */
export const syncConfig = {
  url: url.trim(),
  anonKey: anonKey.trim(),
}

export const syncAvailable = () =>
  syncConfig.url.startsWith('https://') && syncConfig.anonKey.length > 20

/** What to tell the user when they ask why sharing is missing. */
export function syncStatusMessage() {
  if (syncAvailable()) return null
  if (!syncConfig.url && !syncConfig.anonKey) {
    return 'Sharing is not set up on this build. Everything still works on this device.'
  }
  return 'Sharing is misconfigured on this build. Everything still works on this device.'
}
