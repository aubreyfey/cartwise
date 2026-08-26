// Expiry reminders.
//
// An important limitation, stated plainly because the UI has to say it too:
// a web app cannot wake itself up. Without a push server there is no way to
// deliver a notification while the app is closed — the browser simply is not
// running our code. What we can do is check every time the app is opened and
// tell you then, which for a fridge is genuinely useful: you open the list
// before you shop, and that is exactly when knowing what needs eating helps.
//
// Real background delivery needs a server sending Web Push, which would mean
// the reminder times leaving the device. That is a deliberate trade this app
// has not made.

const KEY = 'cartwise.lastReminder'

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

export const notificationPermission = () =>
  notificationsSupported() ? Notification.permission : 'unsupported'

export async function askForNotifications() {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/** 'YYYY-MM-DD' for local today, used to notify at most once a day. */
function todayKey(now = Date.now()) {
  const d = new Date(now)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function alreadyRemindedToday(now = Date.now()) {
  try {
    return window.localStorage.getItem(KEY) === todayKey(now)
  } catch {
    return false
  }
}

export function markRemindedToday(now = Date.now()) {
  try {
    window.localStorage.setItem(KEY, todayKey(now))
  } catch {
    // Not being able to remember means at worst a second reminder.
  }
}

/**
 * Show one summary notification rather than one per item — six separate
 * banners for six yoghurts is how an app gets its notifications switched off.
 * Returns true if something was shown.
 */
export function showReminder({ title, body, base = '/' }, now = Date.now()) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  if (!body) return false
  if (alreadyRemindedToday(now)) return false

  try {
    // eslint-disable-next-line no-new
    new Notification(title, {
      body,
      icon: `${base}icon.svg`.replace(/\/{2,}/g, '/'),
      badge: `${base}icon.svg`.replace(/\/{2,}/g, '/'),
      tag: 'cartwise-expiry',
    })
    markRemindedToday(now)
    return true
  } catch {
    return false
  }
}
