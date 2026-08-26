import { useCallback, useEffect, useState } from 'react'
import { onAuthChange, sendMagicLink, signOut } from '../sync/auth.js'
import { syncAvailable } from '../sync/config.js'
import {
  activeInvites,
  createHousehold,
  createInvite,
  leaveHousehold,
  listHouseholds,
  listMembers,
  redeemInvite,
} from '../sync/households.js'
import { inviteTimeLeft } from '../sync/invites.js'
import Icon from '../icons.jsx'

export default function AccountPanel() {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  const [households, setHouseholds] = useState([])
  const [members, setMembers] = useState({})
  const [invites, setInvites] = useState({})
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  // Subscribing to auth also tells us the initial state, so there is no
  // separate "am I signed in yet" fetch to race against it.
  useEffect(() => {
    const unsubscribe = onAuthChange((next) => {
      setSession(next)
      setReady(true)
    })
    return unsubscribe
  }, [])

  const refresh = useCallback(async () => {
    const result = await listHouseholds()
    if (!result.ok) {
      setStatus({ tone: 'bad', text: result.reason })
      return
    }
    setHouseholds(result.households)

    const nextMembers = {}
    const nextInvites = {}
    for (const h of result.households) {
      const [m, i] = await Promise.all([listMembers(h.id), activeInvites(h.id)])
      if (m.ok) nextMembers[h.id] = m.members
      if (i.ok) nextInvites[h.id] = i.invites
    }
    setMembers(nextMembers)
    setInvites(nextInvites)
  }, [])

  useEffect(() => {
    if (session) refresh()
  }, [session, refresh])

  if (!syncAvailable()) return null

  async function handleSend(event) {
    event.preventDefault()
    setBusy(true)
    setStatus(null)
    const result = await sendMagicLink(email)
    setBusy(false)
    if (!result.ok) {
      setStatus({ tone: 'bad', text: result.reason })
      return
    }
    setSent(true)
  }

  async function run(action, successText) {
    setBusy(true)
    setStatus(null)
    const result = await action()
    setBusy(false)
    if (!result.ok) {
      setStatus({ tone: 'bad', text: result.reason })
      return false
    }
    if (successText) setStatus({ tone: 'good', text: successText })
    await refresh()
    return true
  }

  return (
    <section className="account">
      <button
        className="account__toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="account__label">
          <Icon name="users" size={16} /> Sharing
        </span>
        <span className="account__who">
          {!ready ? '' : session ? session.user?.email : 'Not signed in'}
        </span>
        <span className={`insights__chevron ${open ? 'insights__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="account__body">
          {!session ? (
            <>
              <p className="account__hint">
                Sign in to share a list with the people you live with. Everything
                else — your prices, trips and stickers — stays on this device
                either way.
              </p>

              {sent ? (
                <p className="account__status account__status--good">
                  Check your email. The link signs you in on this device.
                </p>
              ) : (
                <form className="account__form" onSubmit={handleSend}>
                  <input
                    className="add-form__name"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    autoComplete="email"
                  />
                  <button className="btn btn--primary" type="submit" disabled={busy}>
                    {busy ? 'Sending…' : 'Email me a link'}
                  </button>
                </form>
              )}
              <p className="account__fineprint">
                No password. We email you a link instead.
              </p>
            </>
          ) : (
            <>
              {households.length === 0 && (
                <p className="account__hint">
                  You are not in a household yet. Make one and invite whoever
                  shops with you, or enter a code someone gave you.
                </p>
              )}

              <ul className="household-list">
                {households.map((h) => (
                  <li key={h.id} className="household">
                    <div className="household__head">
                      <span className="household__name">{h.name}</span>
                      <span className="household__role">{h.role}</span>
                    </div>

                    <p className="household__members">
                      {(members[h.id] ?? []).length}{' '}
                      {(members[h.id] ?? []).length === 1 ? 'person' : 'people'}
                    </p>

                    {(invites[h.id] ?? []).length > 0 && (
                      <div className="household__invites">
                        {invites[h.id].map((inv) => (
                          <span className="invite-code" key={inv.code}>
                            <code>{inv.code}</code>
                            <span className="invite-code__ttl">
                              {inviteTimeLeft(inv.expires_at)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="household__actions">
                      <button
                        className="btn btn--ghost"
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => createInvite(h.id), 'Invite code created.')}
                      >
                        Invite someone
                      </button>
                      <button
                        className="btn btn--ghost btn--danger"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Leave "${h.name}"?`)) {
                            run(() => leaveHousehold(h.id), 'Left the household.')
                          }
                        }}
                      >
                        Leave
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="account__row">
                <input
                  className="field__input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Household name"
                  aria-label="New household name"
                />
                <button
                  className="btn btn--ghost"
                  type="button"
                  disabled={busy || !newName.trim()}
                  onClick={async () => {
                    if (await run(() => createHousehold(newName), 'Household created.')) {
                      setNewName('')
                    }
                  }}
                >
                  Create
                </button>
              </div>

              <div className="account__row">
                <input
                  className="field__input"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Invite code"
                  aria-label="Invite code"
                  autoCapitalize="characters"
                />
                <button
                  className="btn btn--ghost"
                  type="button"
                  disabled={busy || !joinCode.trim()}
                  onClick={async () => {
                    if (await run(() => redeemInvite(joinCode), 'Joined.')) setJoinCode('')
                  }}
                >
                  Join
                </button>
              </div>

              <button
                className="btn btn--ghost account__signout"
                type="button"
                onClick={async () => {
                  await signOut()
                  setHouseholds([])
                  setSent(false)
                  setStatus(null)
                }}
              >
                Sign out
              </button>
            </>
          )}

          {status && (
            <p className={`account__status account__status--${status.tone}`}>{status.text}</p>
          )}
        </div>
      )}
    </section>
  )
}
