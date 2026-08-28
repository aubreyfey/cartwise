// Where a shop is, and how far that is from you.
//
// Locations are opt-in and per-shop, not per-trip. That distinction is the
// whole privacy design: "Savemore is at these coordinates" is a fact about a
// supermarket, and saving it once makes every future trip there useful. A
// coordinate stamped on every individual trip would be a movement record —
// where you were and when — which is a different and much heavier thing to
// hold, and CartWise has no use for it.
//
// Nothing here ever leaves the device. Community price reports carry the shop
// name and the day, never a coordinate.

const EARTH_KM = 6371

export const GEO_UNAVAILABLE = 'unavailable'
export const GEO_DENIED = 'denied'

/** Is a stored location usable? Guards against half-written or ancient data. */
export function isLocation(value) {
  return (
    !!value &&
    typeof value.lat === 'number' &&
    typeof value.lon === 'number' &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lon) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lon) <= 180 &&
    // 0,0 is in the Atlantic and is what a broken sensor returns.
    !(value.lat === 0 && value.lon === 0)
  )
}

/**
 * Straight-line distance in kilometres. Haversine — good to a few metres at
 * grocery-shop range, which is far better than the accuracy of the fix it is
 * computed from.
 */
export function distanceKm(a, b) {
  if (!isLocation(a) || !isLocation(b)) return null

  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Distance as something to read.
 *
 * Deliberately vague past a couple of kilometres: this is a straight line, not
 * a route, and "4 km" invites a precision the number does not have. Under a
 * kilometre it is rounded to fifty metres for the same reason.
 */
export function formatDistance(km) {
  if (km === null || !Number.isFinite(km)) return null
  if (km < 0.1) return 'here'
  if (km < 1) return `${Math.round((km * 1000) / 50) * 50} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/**
 * Ask the device where it is.
 *
 * Resolves to a location, or rejects with a reason the caller can show. Never
 * called on load — only when someone taps something that needs it, because a
 * permission prompt nobody asked for is how an app loses that permission for
 * good.
 */
export function currentLocation({ timeout = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error(GEO_UNAVAILABLE))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const location = {
          lat: Number(latitude.toFixed(5)),
          // Five decimals is about a metre. More would be false precision and
          // a slightly more identifying number for no benefit.
          lon: Number(longitude.toFixed(5)),
          accuracy: Math.round(accuracy ?? 0),
          savedAt: Date.now(),
        }
        if (!isLocation(location)) {
          reject(new Error(GEO_UNAVAILABLE))
          return
        }
        resolve(location)
      },
      (error) => reject(new Error(error.code === 1 ? GEO_DENIED : GEO_UNAVAILABLE)),
      { enableHighAccuracy: true, timeout, maximumAge: 60_000 },
    )
  })
}

/** Shops that know where they are. */
export const locatedStores = (stores = []) => stores.filter((s) => isLocation(s.location))

/**
 * Shops with their distance from a point, nearest first. Shops with no saved
 * location are kept, at the end, with a null distance — they are still shops
 * you use, and dropping them would make the list lie about what you have.
 */
export function storesByDistance(stores = [], from = null) {
  const rows = stores.map((store) => ({
    store,
    km: isLocation(from) ? distanceKm(from, store.location) : null,
  }))

  return rows.sort((a, b) => {
    if (a.km === null && b.km === null) return a.store.name.localeCompare(b.store.name)
    if (a.km === null) return 1
    if (b.km === null) return -1
    return a.km - b.km
  })
}

/**
 * A bounding box around some points, with padding, for framing a map.
 * Returns null when there is nothing to frame.
 */
export function boundsOf(locations = []) {
  const points = locations.filter(isLocation)
  if (points.length === 0) return null

  const lats = points.map((p) => p.lat)
  const lons = points.map((p) => p.lon)

  // A single point has no extent, so give it one — otherwise the map zooms to
  // its maximum and shows one building.
  const padLat = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.25, 0.004)
  const padLon = Math.max((Math.max(...lons) - Math.min(...lons)) * 0.25, 0.004)

  return {
    south: Math.min(...lats) - padLat,
    north: Math.max(...lats) + padLat,
    west: Math.min(...lons) - padLon,
    east: Math.max(...lons) + padLon,
  }
}
