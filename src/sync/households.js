import { getClient } from './client.js'
import { inviteExpiry, makeInviteCode, normalizeInviteCode, isValidInviteCode } from './invites.js'

// Every call returns { ok, ... } instead of throwing. These all cross a
// network on a phone in a supermarket, so failure is ordinary and the UI
// needs wording, not exceptions.

const offline = { ok: false, reason: 'Sharing is unavailable right now.' }

/** Postgres errors are for logs; these are for people. */
function friendly(error) {
  if (!error) return 'Something went wrong.'
  const message = String(error.message ?? error)
  if (/JWT|not signed in|401/i.test(message)) return 'You have been signed out. Sign in again.'
  if (/Failed to fetch|NetworkError/i.test(message)) return 'No connection.'
  if (/duplicate key/i.test(message)) return 'That already exists.'
  if (/invite not found/i.test(message)) return "That code doesn't match any invite."
  if (/invite already used/i.test(message)) return 'That invite has already been used.'
  if (/invite expired/i.test(message)) return 'That invite has expired. Ask for a new one.'
  return message
}

export async function listHouseholds() {
  const supabase = await getClient()
  if (!supabase) return offline

  const { data, error } = await supabase
    .from('household_members')
    .select('role, household_id, households(id, name, created_at)')
    .order('joined_at', { ascending: true })

  if (error) return { ok: false, reason: friendly(error) }

  return {
    ok: true,
    households: (data ?? [])
      .filter((row) => row.households)
      .map((row) => ({
        id: row.households.id,
        name: row.households.name,
        role: row.role,
      })),
  }
}

export async function createHousehold(name) {
  const trimmed = String(name ?? '').trim()
  if (trimmed.length < 1) return { ok: false, reason: 'Give it a name.' }
  if (trimmed.length > 60) return { ok: false, reason: 'That name is too long.' }

  const supabase = await getClient()
  if (!supabase) return offline

  // A function, not two inserts: the household and the creator's membership
  // must land together or not at all, otherwise row-level security hides the
  // household from the very person who just made it.
  const { data, error } = await supabase.rpc('create_household', {
    household_name: trimmed,
  })
  if (error) return { ok: false, reason: friendly(error) }
  return { ok: true, householdId: data }
}

export async function leaveHousehold(householdId) {
  const supabase = await getClient()
  if (!supabase) return offline

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) return { ok: false, reason: 'You have been signed out.' }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId)

  if (error) return { ok: false, reason: friendly(error) }
  return { ok: true }
}

export async function listMembers(householdId) {
  const supabase = await getClient()
  if (!supabase) return offline

  const { data, error } = await supabase
    .from('household_members')
    .select('user_id, role, display_name, joined_at')
    .eq('household_id', householdId)
    .order('joined_at', { ascending: true })

  if (error) return { ok: false, reason: friendly(error) }
  return { ok: true, members: data ?? [] }
}

/**
 * Mint an invite. Codes are generated here rather than in the database so the
 * user sees one instantly; a collision just fails the insert and we try again.
 */
export async function createInvite(householdId, attempts = 3) {
  const supabase = await getClient()
  if (!supabase) return offline

  for (let i = 0; i < attempts; i += 1) {
    const code = makeInviteCode()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return { ok: false, reason: 'You have been signed out.' }

    const { error } = await supabase.from('household_invites').insert({
      code,
      household_id: householdId,
      created_by: userId,
      expires_at: inviteExpiry(),
    })

    if (!error) return { ok: true, code, expiresAt: inviteExpiry() }
    if (!/duplicate key/i.test(String(error.message))) {
      return { ok: false, reason: friendly(error) }
    }
    // Collided with an existing code — loop and mint another.
  }
  return { ok: false, reason: 'Could not create an invite. Try again.' }
}

export async function redeemInvite(rawCode) {
  const code = normalizeInviteCode(rawCode)
  if (!isValidInviteCode(code)) {
    return { ok: false, reason: 'That is not a valid invite code.' }
  }

  const supabase = await getClient()
  if (!supabase) return offline

  const { data, error } = await supabase.rpc('redeem_invite', { invite_code: code })
  if (error) return { ok: false, reason: friendly(error) }
  return { ok: true, householdId: data }
}

export async function activeInvites(householdId) {
  const supabase = await getClient()
  if (!supabase) return offline

  const { data, error } = await supabase
    .from('household_invites')
    .select('code, expires_at, used_by')
    .eq('household_id', householdId)
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return { ok: false, reason: friendly(error) }
  return { ok: true, invites: data ?? [] }
}
