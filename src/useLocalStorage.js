import { useEffect, useState } from 'react'

/**
 * useState that persists to localStorage under `key`.
 *
 * `initialValue` may be a function, as with useState — used for the one-time
 * migration of older storage layouts. Falls back to in-memory state if
 * storage is unavailable (private mode, blocked cookies) rather than throwing.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const fallback = () =>
      typeof initialValue === 'function' ? initialValue() : initialValue

    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? fallback() : JSON.parse(stored)
    } catch {
      return fallback()
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or unavailable — keep working from memory.
    }
  }, [key, value])

  return [value, setValue]
}

/** Read a raw JSON value from storage without subscribing to it. */
export function readStored(key, fallback = null) {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? fallback : JSON.parse(stored)
  } catch {
    return fallback
  }
}

export function removeStored(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // nothing to do
  }
}
