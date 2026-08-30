import { useState } from 'react'
import SplashScreen from './SplashScreen.jsx'

/**
 * The app, with a launch screen laid over it.
 *
 * Deliberately a sibling of the app rather than something the app renders.
 * The app has several early returns — onboarding, the tour, a list, each tab —
 * and a splash owned by one of them would be missing from the others. Putting
 * it here means it covers whatever the app happens to be showing, and it means
 * the app underneath is already mounted and interactive the moment it lifts.
 */
export default function Launch({ children }) {
  const [showing, setShowing] = useState(true)

  return (
    <>
      {children}
      {showing && <SplashScreen onDone={() => setShowing(false)} />}
    </>
  )
}
