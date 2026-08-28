import { useEffect, useState } from 'react'
import Icon from '../icons.jsx'

const DISMISSED = 'cartwise.installHintSeen'

/** Already added to the home screen? Then there is nothing to suggest. */
function isInstalled() {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  } catch {
    return false
  }
}

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent)

/**
 * How to get CartWise onto the home screen.
 *
 * This is the difference between an app someone shops with and a tab they
 * forget. Android and desktop Chrome fire beforeinstallprompt and we can just
 * ask; iOS Safari never has, and never will — there it is Share → Add to Home
 * Screen, a gesture nobody finds unaccompanied. So on iOS this shows the
 * steps rather than a button that cannot work.
 */
export default function InstallHint() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(DISMISSED) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onPrompt = (e) => {
      // Keep the event so the install can happen on a real user gesture.
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (dismissed || isInstalled()) return null

  // Nothing to say on a desktop browser that has not offered an install.
  const ios = isIOS()
  if (!ios && !prompt) return null

  const close = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISSED, 'true')
    } catch {
      // Dismissed for this session either way.
    }
  }

  return (
    <section className="install">
      <span className="install__icon" aria-hidden="true">
        <Icon name="cart" size={18} strokeWidth={1.9} />
      </span>

      <span className="install__text">
        <strong>Put CartWise on your home screen</strong>
        {ios ? (
          <span>
            Tap <strong>Share</strong> in Safari, then{' '}
            <strong>Add to Home Screen</strong>. It opens like an app and works
            in the shop with no signal.
          </span>
        ) : (
          <span>It opens like an app and works in the shop with no signal.</span>
        )}
      </span>

      {!ios && prompt && (
        <button
          className="btn btn--primary btn--small"
          type="button"
          onClick={async () => {
            prompt.prompt()
            await prompt.userChoice
            setPrompt(null)
            close()
          }}
        >
          Install
        </button>
      )}

      <button className="install__close" type="button" onClick={close} aria-label="Dismiss">
        ×
      </button>
    </section>
  )
}
