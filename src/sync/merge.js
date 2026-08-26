// Merging a shared list.
//
// Two phones edit the same list, sometimes with one of them offline. When
// they meet again, every row has to resolve to a single answer, and the same
// pair of inputs must always give the same output regardless of which device
// does the merging — otherwise the two ends disagree forever and push each
// other's versions back and forth.
//
// The rule is last-write-wins on `updatedAt`, with deletion as an ordinary
// field rather than an absence. A row that has gone from the server is not
// the same as a row that was deleted: the first means "I have not seen it",
// the second means "it is gone".

/**
 * Does the local row win?
 *
 * Ties go to remote. Two edits in the same millisecond are vanishingly rare,
 * but "prefer newer, else prefer remote" is deterministic on both devices,
 * whereas preferring local would have each phone keep its own copy and
 * re-push it on every sync, forever.
 *
 * Returns a boolean rather than the winning object on purpose: comparing the
 * result by identity (`winner === local`) gives the wrong answer whenever the
 * two sides are the same object, which is easy to arrange by accident.
 */
function localWins(local, remote) {
  return (local.updatedAt ?? 0) > (remote.updatedAt ?? 0)
}

/**
 * Combine local and remote rows.
 *
 * Returns `merged` (what to show, deleted rows removed) and `toPush` (rows
 * whose local version won and so the server has not got yet).
 */
export function mergeItems(localItems = [], remoteItems = []) {
  const pairs = new Map()

  for (const item of localItems) {
    if (!item?.id) continue
    pairs.set(item.id, { local: item, remote: null })
  }
  for (const item of remoteItems) {
    if (!item?.id) continue
    const existing = pairs.get(item.id)
    if (existing) existing.remote = item
    else pairs.set(item.id, { local: null, remote: item })
  }

  const merged = []
  const toPush = []

  for (const { local, remote } of pairs.values()) {
    if (local && !remote) {
      // The server has never seen this row. Even a locally-deleted one gets
      // pushed, so the deletion reaches the other devices instead of the row
      // reappearing on them.
      toPush.push(local)
      if (!local.deleted) merged.push(local)
      continue
    }

    if (!local && remote) {
      if (!remote.deleted) merged.push(remote)
      continue
    }

    const fromLocal = localWins(local, remote)
    const winner = fromLocal ? local : remote
    if (!winner.deleted) merged.push(winner)
    if (fromLocal) toPush.push(local)
  }

  return { merged, toPush }
}

/**
 * Rows that have been deleted and seen by everyone can eventually be dropped,
 * but not immediately: a phone that has been off for a week still needs the
 * tombstone to learn about the deletion. A fortnight is comfortably longer
 * than any realistic offline gap for a grocery list.
 */
export const TOMBSTONE_TTL_MS = 14 * 86400000

export function pruneTombstones(items = [], now = Date.now()) {
  return items.filter(
    (item) => !item?.deleted || now - (item.updatedAt ?? 0) < TOMBSTONE_TTL_MS,
  )
}

/** Shape a local item for the wire. */
export function toRemoteItem(item, listId) {
  return {
    id: item.id,
    list_id: listId,
    name: item.name,
    category: item.category ?? 'other',
    qty: item.qty ?? 1,
    unit: item.unit ?? 'pc',
    // Null means unknown, and must stay null rather than becoming zero.
    price: item.price ?? null,
    checked: !!item.checked,
    impulse: !!item.impulse,
    deleted: !!item.deleted,
  }
}

/** Shape a wire row for local use. */
export function fromRemoteItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? 'other',
    qty: Number(row.qty ?? 1),
    unit: row.unit ?? 'pc',
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    checked: !!row.checked,
    impulse: !!row.impulse,
    deleted: !!row.deleted,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
  }
}
