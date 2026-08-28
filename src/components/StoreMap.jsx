import { useEffect, useRef, useState } from 'react'
import { boundsOf, formatDistance, isLocation } from '../geo.js'

// OpenStreetMap's own tiles. Not the prettiest choice on offer — CARTO's
// Positron is closer to the pale Apple Maps look, and Esri's Light Gray
// closer still — but Positron now watermarks "API KEY REQUIRED" across every
// tile, and Esri's terms for keyless use in an app that intends to make money
// are not clear enough to build on. These are ODbL, free, and unambiguous.
//
// The pale look is then done in CSS: saturation down, contrast eased, a touch
// brighter. Standard OSM is busy and colourful; desaturated it reads as the
// quiet canvas this screen wants, and the map stays legitimate.
//
// Attribution is a licence condition, not decoration — it stays on the map.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/**
 * Where your shops are.
 *
 * Leaflet and its stylesheet are imported dynamically: together they are about
 * 45 KB, and someone who never opens this screen should not carry them. That
 * also means this is the one screen in CartWise that needs a connection —
 * tiles come from a server — so it says so plainly when it cannot reach one
 * rather than showing grey squares.
 */
export default function StoreMap({ stores = [], here = null, onPick }) {
  const holder = useRef(null)
  const map = useRef(null)
  const [state, setState] = useState('loading')

  const points = stores.filter((s) => isLocation(s.location))

  useEffect(() => {
    let cancelled = false

    async function draw() {
      if (points.length === 0 && !isLocation(here)) {
        setState('empty')
        return
      }

      let L
      try {
        // The stylesheet has to land before the map is built or the tiles
        // stack up the page instead of tiling.
        await import('leaflet/dist/leaflet.css')
        L = (await import('leaflet')).default
      } catch {
        if (!cancelled) setState('offline')
        return
      }
      if (cancelled || !holder.current) return

      if (!map.current) {
        map.current = L.map(holder.current, {
          zoomControl: false,
          attributionControl: true,
          // A small map inside a scrolling page: scroll should scroll the
          // page, not zoom the map out from under the finger.
          scrollWheelZoom: false,
          tap: true,
        })

        L.tileLayer(TILES, {
          attribution: ATTRIBUTION,
          maxZoom: 19,
        })
          .on('tileerror', () => {
            if (!cancelled) setState('offline')
          })
          .addTo(map.current)
      }

      const layer = L.layerGroup().addTo(map.current)

      for (const store of points) {
        const marker = L.marker([store.location.lat, store.location.lon], {
          icon: L.divIcon({
            className: 'mapmark',
            html: `<span class="mapmark__pin"></span><span class="mapmark__label">${
              store.name.replace(/[<>&]/g, '')
            }</span>`,
            iconSize: [0, 0],
          }),
          keyboard: true,
          title: store.name,
        }).addTo(layer)

        if (onPick) marker.on('click', () => onPick(store))
      }

      if (isLocation(here)) {
        L.marker([here.lat, here.lon], {
          icon: L.divIcon({ className: 'mapmark mapmark--you', html: '<span class="mapmark__you"></span>', iconSize: [0, 0] }),
          title: 'You',
        }).addTo(layer)
      }

      const box = boundsOf([...points.map((s) => s.location), here].filter(Boolean))
      if (box) {
        map.current.fitBounds(
          [
            [box.south, box.west],
            [box.north, box.east],
          ],
          { padding: [24, 24], maxZoom: 16 },
        )
      }

      setState('ready')
    }

    draw()
    return () => {
      cancelled = true
    }
    // Re-drawn when the shops or your position change.
  }, [stores.length, here?.lat, here?.lon])

  useEffect(
    () => () => {
      map.current?.remove()
      map.current = null
    },
    [],
  )

  if (state === 'empty') {
    return (
      <p className="mapbox__note">
        No shops have a location saved yet. Open a shop and tap{' '}
        <strong>Save this location</strong> while you are standing in it.
      </p>
    )
  }

  return (
    <div className="mapbox">
      <div className="mapbox__canvas" ref={holder} role="img" aria-label="Map of your shops" />
      {state === 'offline' && (
        <p className="mapbox__note mapbox__note--offline">
          The map needs a connection — it is the one screen here that does.
          Distances still work offline.
        </p>
      )}
    </div>
  )
}
