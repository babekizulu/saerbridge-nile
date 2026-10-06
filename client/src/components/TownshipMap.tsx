import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Area } from '../types/domain'
const nationalBounds: L.LatLngBoundsExpression = [
  [-35.2, 16.2],
  [-22.0, 33.2],
]
export default function TownshipMap({
  areas,
  onSelect,
}: {
  areas: Area[]
  onSelect: (slug: string) => void
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null)
  const [tilesFailed, setTilesFailed] = useState(false)
  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, {
      scrollWheelZoom: false,
      minZoom: 4,
      maxZoom: 13,
      zoomControl: true,
    })
    map.current = instance
    instance.fitBounds(nationalBounds, { padding: [12, 12] })
    L.tileLayer(
      import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    )
      .on('tileerror', () => setTilesFailed(true))
      .addTo(instance)
    const observer = new ResizeObserver(() => instance.invalidateSize())
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      instance.remove()
      map.current = null
    }
  }, [])
  useEffect(() => {
    if (!map.current) return
    const group = L.layerGroup().addTo(map.current)
    areas.forEach((area) => {
      const label = document.createElement('span')
      label.textContent = area.name
      L.marker([area.latitude, area.longitude], {
        title: area.name,
        alt: `${area.name}: approximate township marker`,
        keyboard: true,
        icon: L.divIcon({
          className: 'township-marker',
          html: '<span aria-hidden="true"></span>',
          iconSize: [24, 24],
        }),
      })
        .bindTooltip(label)
        .on('click', () => {
          onSelect(area.slug)
          map.current?.setView([area.latitude, area.longitude], 11)
        })
        .addTo(group)
    })
    return () => {
      group.remove()
    }
  }, [areas, onSelect])
  return (
    <>
      <div className="map-toolbar">
        <span className="eyebrow">South Africa · Township research</span>
        <button onClick={() => map.current?.fitBounds(nationalBounds)}>Whole country</button>
        <button
          disabled={!areas.length}
          onClick={() =>
            map.current?.fitBounds(L.latLngBounds(areas.map((a) => [a.latitude, a.longitude])), {
              padding: [60, 60],
              maxZoom: 11,
            })
          }
        >
          Pilot townships
        </button>
      </div>
      <div
        ref={container}
        className="national-map"
        role="region"
        aria-label="Interactive map of South Africa. Arrow keys pan, plus and minus zoom. Township links are also available below."
      />
      {tilesFailed && (
        <p role="status">
          Some map tiles could not load. The township list below remains available.
        </p>
      )}
      <p className="chart-note">
        Area markers are approximate, never participant locations. Only townships with released
        research appear. No marker means no published coverage, not an absence of needs.{' '}
        <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">
          Report a map issue
        </a>
        .
      </p>
    </>
  )
}
