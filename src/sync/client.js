import { syncAvailable, syncConfig } from './config.js'

// The Supabase client is ~120 KB. Importing it at module scope would put that
// in the main bundle for everyone, including the majority who never sign in.
// So it is fetched dynamically, the first time sharing is actually used, and
// an unconfigured build never downloads it at all.
let clientPromise = null

export async function getClient() {
  if (!syncAvailable()) return null
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(syncConfig.url, syncConfig.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            // The magic link returns here with the session in the URL;
            // letting the client consume it is what completes sign-in.
            detectSessionInUrl: true,
            storageKey: 'cartwise.auth',
          },
        }),
      )
      .catch(() => {
        // Offline, or the chunk failed to load. Reset so a later attempt can
        // retry rather than being stuck with a rejected promise forever.
        clientPromise = null
        return null
      })
  }
  return clientPromise
}

/**
 * Strip the auth fragment Supabase leaves behind after a magic link, so a
 * refresh or a copied URL does not carry tokens around.
 */
export function cleanAuthUrl() {
  if (typeof window === 'undefined') return
  const { hash, search, pathname } = window.location
  if (hash.includes('access_token') || search.includes('code=')) {
    window.history.replaceState({}, '', pathname)
  }
}
