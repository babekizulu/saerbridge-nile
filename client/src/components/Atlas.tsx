import { lazy, Suspense, useState } from 'react'
const TownshipMap = lazy(() => import('./TownshipMap'))
import { Link } from 'react-router'
import { Map, ArrowUpRight } from 'lucide-react'
import type { Archive, Area } from '../types/domain'
import { EmptyState, DemoNotice } from './Feedback'

export function AreaCard({ area }: { area: Area }) {
  return (
    <article className="area-card">
      <span className="eyebrow">{area.province}</span>
      <h3>
        <Link to={`/areas/${area.slug}`}>
          {area.name}
          <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
      </h3>
      <p>{area.municipality}</p>
      <div className="card-bottom">
        <span>{area.provenance.interviews} interviews</span>
        <span className="mono">Wave {area.provenance.wave}</span>
      </div>
    </article>
  )
}
export function Atlas({ archive, query = '' }: { archive: Archive; query?: string }) {
  const [view, setView] = useState('Map')
  const [selected, setSelected] = useState<string | null>(null)
  const areas = archive.areas.filter((a) =>
    `${a.name} ${a.province} ${a.municipality}`.toLowerCase().includes(query.toLowerCase()),
  )
  const themes = archive.themes.filter((t) =>
    `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase()),
  )
  const chosen = areas.find((a) => a.slug === selected)
  return (
    <section className="atlas" aria-labelledby="atlas-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">The evidence atlas</p>
          <h2 id="atlas-title">Explore the archive</h2>
        </div>
        <div className="view-switch" aria-label="Archive display">
          {['Map', 'Areas', 'Themes'].map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              {v === 'Map' && <Map size={15} aria-hidden="true" />}
              {v}
            </button>
          ))}
        </div>
      </div>
      {view === 'Themes' ? (
        themes.length ? (
          <div className="card-grid">
            {themes.map((t) => (
              <article className="area-card" key={t.slug}>
                <span className="eyebrow">{t.category} · Theme archive</span>
                <h3>
                  <Link to={`/themes/${t.slug}`}>
                    {t.name}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                </h3>
                <p>{t.description}</p>
                <Link className="text-link" to={`/themes/${t.slug}`}>
                  Explore evidence →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState />
        )
      ) : !areas.length && view !== 'Map' ? (
        <EmptyState title="No areas match your search." />
      ) : view === 'Areas' ? (
        <div className="card-grid">
          {areas.map((a) => (
            <AreaCard key={a.slug} area={a} />
          ))}
        </div>
      ) : (
        <div className="map-panel">
          <Suspense fallback={<p role="status">Loading map…</p>}>
            <TownshipMap areas={areas} onSelect={setSelected} />
          </Suspense>
          <div className="map-meta">
            <span className="eyebrow">Township evidence · South Africa</span>
            <p>{areas.length} townships with released evidence</p>
            <div className="map-places" aria-label="Explore map areas">
              {areas.map((a) => (
                <button
                  key={a.slug}
                  aria-pressed={selected === a.slug}
                  onClick={() => setSelected(a.slug)}
                >
                  {a.name} ↗
                </button>
              ))}
            </div>
          </div>
          {chosen && (
            <div className="map-selection" role="status">
              <strong>{chosen.name}</strong>
              <span>{chosen.provenance.interviews} fictional interviews</span>
              <Link to={`/areas/${chosen.slug}`}>Open area dashboard →</Link>
              <button
                className="icon-button"
                aria-label="Close area summary"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
      <DemoNotice />
    </section>
  )
}
