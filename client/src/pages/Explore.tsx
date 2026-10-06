import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { ArchiveContent, DemoNotice, EmptyState, NotFound } from '../components/Feedback'
import { AreaCard } from '../components/Atlas'
import { ThemeBarChart } from '../components/Charts'
import { DataProvenance, FindingCard, PrivacyNotice, QuoteCard } from '../components/Evidence'
import { FilterPanel, type Filters } from '../components/FilterPanel'

export function AreasPage() {
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('')
  return (
    <div className="container page">
      <p className="eyebrow">The places behind the evidence</p>
      <h1>Area catalogue</h1>
      <p className="page-intro">
        Explore lived experience, one place at a time. Each area keeps its research context visible.
      </p>
      <DemoNotice />
      <ArchiveContent>
        {(archive) => {
          const areas = archive.areas.filter(
            (a) =>
              `${a.name} ${a.municipality}`.toLowerCase().includes(query.toLowerCase()) &&
              (!province || a.province === province),
          )
          return (
            <>
              <div className="catalogue-controls">
                <label className="search-field">
                  <Search size={18} aria-hidden="true" />
                  <span className="sr-only">Search areas</span>
                  <input
                    placeholder="Search areas or municipalities"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label>
                  Province
                  <select value={province} onChange={(e) => setProvince(e.target.value)}>
                    <option value="">All provinces</option>
                    {archive.areas.map((a) => (
                      <option key={a.slug}>{a.province}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="result-count" role="status">
                {areas.length} areas in this view
              </p>
              {areas.length ? (
                <div className="card-grid">
                  {areas.map((a) => (
                    <AreaCard area={a} key={a.slug} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No areas match your search.">
                  <button
                    onClick={() => {
                      setQuery('')
                      setProvince('')
                    }}
                  >
                    Clear search
                  </button>
                </EmptyState>
              )}
            </>
          )
        }}
      </ArchiveContent>
    </div>
  )
}
export function AreaPage() {
  const { slug } = useParams()
  return (
    <ArchiveContent>
      {(archive) => {
        const area = archive.areas.find((a) => a.slug === slug)
        if (!area) return <NotFound />
        const findings = archive.findings.filter((f) => f.area === slug)
        return (
          <>
            <div className="container page area-hero">
              <Link className="text-link" to="/areas">
                ← All areas
              </Link>
              <p className="eyebrow">Area evidence dashboard</p>
              <h1>{area.name}</h1>
              <p className="page-intro">
                {area.municipality} · {area.province}
              </p>
              <div className="badges">
                <span className="badge">Wave {area.provenance.wave}</span>
                <span className="badge">{area.provenance.interviews} interviews</span>
                <span className="badge">Area-level only</span>
              </div>
              <p>{area.description}</p>
              <DemoNotice />
            </div>
            <PrivacyNotice />
            <div className="container section-space">
              <div className="dashboard-grid">
                <ThemeBarChart findings={findings} />
                <aside className="context-card">
                  <p className="eyebrow">Before you interpret</p>
                  <h2>A sample, with a story.</h2>
                  <p>
                    These interviews explore experiences in depth. They do not measure how common an
                    experience is across all residents.
                  </p>
                  <DataProvenance value={area.provenance} />
                  <Link className="text-link" to="/methodology">
                    Understand the methodology ↗
                  </Link>
                </aside>
              </div>
              <div className="section-heading spaced">
                <div>
                  <p className="eyebrow">A closer reading</p>
                  <h2>Published findings</h2>
                </div>
                <Link className="text-link" to={`/findings?area=${area.slug}`}>
                  Explore all findings ↗
                </Link>
              </div>
              <div className="card-grid two">
                {findings.map((f) => (
                  <FindingCard key={f.id} finding={f} areaName={area.name} />
                ))}
              </div>
              {archive.quotes
                .filter((q) => q.area === slug)
                .map((q) => (
                  <QuoteCard key={q.id} quote={q} />
                ))}
            </div>
          </>
        )
      }}
    </ArchiveContent>
  )
}
export function FindingsPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const filters: Filters = {
    area: params.get('area') || '',
    theme: params.get('theme') || '',
    category: params.get('category') || '',
    wave: params.get('wave') || '',
  }
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(params)
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setParams(next, { replace: true })
  }
  return (
    <div className="container page">
      <p className="eyebrow">Themes, in context</p>
      <h1>Findings Explorer</h1>
      <p className="page-intro">
        Follow a theme across places. Read the evidence alongside its sample, source and
        limitations.
      </p>
      <DemoNotice />
      <ArchiveContent>
        {(archive) => {
          const findings = archive.findings.filter((f) => {
            const theme = archive.themes.find((t) => t.slug === f.theme)
            const area = archive.areas.find((a) => a.slug === f.area)
            return (
              (!filters.area || f.area === filters.area) &&
              (!filters.theme || f.theme === filters.theme) &&
              (!filters.wave || f.provenance.wave === filters.wave) &&
              (!filters.category || theme?.category === filters.category) &&
              `${f.title} ${f.summary} ${area?.name} ${area?.province}`
                .toLowerCase()
                .includes(query.toLowerCase())
            )
          })
          return (
            <div className="findings-layout">
              <FilterPanel
                areas={archive.areas}
                themes={archive.themes}
                value={filters}
                onChange={(value) => update({ ...value })}
              />
              <section aria-label="Finding results">
                <label className="search-field">
                  <Search size={18} aria-hidden="true" />
                  <span className="sr-only">Search findings</span>
                  <input
                    placeholder="Search places, experiences or themes"
                    value={query}
                    onChange={(e) => update({ q: e.target.value })}
                  />
                </label>
                <p className="result-count" role="status">
                  {findings.length} findings · {archive.releases.some(r => r.demonstration) ? 'fictional demonstration evidence' : 'published research'}
                </p>
                {findings.length ? (
                  <div className="card-grid two">
                    {findings.map((f) => (
                      <FindingCard
                        key={f.id}
                        finding={f}
                        areaName={archive.areas.find((a) => a.slug === f.area)?.name || f.area}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState>
                    <button onClick={() => setParams({})}>Clear all filters</button>
                  </EmptyState>
                )}
              </section>
            </div>
          )
        }}
      </ArchiveContent>
    </div>
  )
}
export function ThemePage() {
  const { slug } = useParams()
  return (
    <ArchiveContent>
      {(archive) => {
        const theme = archive.themes.find((t) => t.slug === slug)
        if (!theme) return <NotFound />
        return (
          <div className="container page">
            <Link className="text-link" to="/findings">
              ← Themes & findings
            </Link>
            <p className="eyebrow">Theme archive · {theme.category}</p>
            <h1>{theme.name}</h1>
            <p className="page-intro">{theme.description}</p>
            <DemoNotice />
            <PrivacyNotice />
            <div className="section-heading spaced">
              <div>
                <p className="eyebrow">Across the archive</p>
                <h2>Different places. Different contexts.</h2>
              </div>
            </div>
            <p>
              Each area has its own sample and fieldwork period. These views are not a ranking of
              places.
            </p>
            <div className="card-grid">
              {archive.areas.map((a) => (
                <div key={a.slug}>
                  <h3>
                    <Link to={`/areas/${a.slug}`}>{a.name} ↗</Link>
                  </h3>
                  <ThemeBarChart
                    title={theme.name}
                    findings={archive.findings.filter((f) => f.area === a.slug && f.theme === slug)}
                  />
                </div>
              ))}
            </div>
            <h2 className="spaced">Read the findings</h2>
            <div className="card-grid two">
              {archive.findings
                .filter((f) => f.theme === slug)
                .map((f) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    areaName={archive.areas.find((a) => a.slug === f.area)?.name || f.area}
                  />
                ))}
            </div>
          </div>
        )
      }}
    </ArchiveContent>
  )
}
