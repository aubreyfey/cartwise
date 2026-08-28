import { useEffect, useState } from 'react'

/**
 * Storage writes can fail — the quota is full, or the browser is in a mode
 * that blocks writes entirely. Failing quietly is the worst option available:
 * the app carries on from memory, the screen shows the trip saved, and the
 * next reload has never heard of it. That is silent data loss.
 *
 * So a failed write announces itself, and the app puts a warning on screen.
 * The event is fired at most once per key per session; a full disk fails on
 * every write, and a banner that re-fires forty times a second helps nobody.
 */
export const STORAGE_FAILED = 'cartwise:storage-failed'

const announced = new Set()

function announceFailure(key, error) {
  if (announced.has(key)) return
  announced.add(key)

  const quota =
    error?.name === 'QuotaExceededError' ||
    error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error?.code === 22

  try {
    window.dispatchEvent(
      new CustomEvent(STORAGE_FAILED, {
        detail: { key, reason: quota ? 'full' : 'blocked' },
      }),
    )
  } catch {
    // No window to tell. Nothing further we can do from here.
  }
}

/** Used by tests, and after a successful clear-out. */
export const resetStorageWarnings = () => announced.clear()

/**
 * Write one value, announcing a failure rather than swallowing it.
 *
 * The hook's effect is a one-line call to this so that the failure path is
 * ordinary code the tests can run, instead of something sealed inside a React
 * effect and only reachable by reimplementing it — which would test the copy,
 * not the original.
 */
export function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (error) {
    announceFailure(key, error)
    const quota =
      error?.name === 'QuotaExceededError' ||
      error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error?.code === 22
    return { ok: false, reason: quota ? 'full' : 'blocked' }
  }
}

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
    // Keeps working from memory when this fails, but says so — this session's
    // changes will not survive a reload, and the user is the only one who can
    // do anything about it.
    writeStored(key, value)
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
