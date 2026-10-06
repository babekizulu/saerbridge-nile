import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, ArrowUpRight, Database, Terminal, BookOpen } from 'lucide-react'
import { ArchiveContent, DemoNotice } from '../components/Feedback'
import { Atlas } from '../components/Atlas'
import { ThemeBarChart } from '../components/Charts'
import { PrivacyNotice, QuoteCard } from '../components/Evidence'
import { MethodologySection } from '../components/Methodology'

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  return (
    <ArchiveContent>
      {(archive) => (
        <>
          <section className="hero container">
            <p className="eyebrow">Township voices · South Africa</p>
            <h1>
              What people are saying
              <br className="desktop-break" /> about where they live.
            </h1>
            <p className="hero-description">
              Nile turns consented township interviews into a public evidence archive — so
              residents, researchers and decision-makers can see the everyday realities behind the
              data.
            </p>
            <form
              className="hero-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                navigate(`/findings?q=${encodeURIComponent(query)}`)
              }}
            >
              <Search size={19} aria-hidden="true" />
              <label className="sr-only" htmlFor="archive-search">
                Search places, experiences or themes
              </label>
              <input
                id="archive-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places, experiences or themes"
              />
              <button aria-label="Search archive" type="submit">
                ↗
              </button>
            </form>
            <div className="hero-stats">
              {[
                [String(archive.areas.length).padStart(2, '0'), 'areas covered'],
                [
                  archive.areas.reduce((n, a) => n + a.provenance.interviews, 0),
                  'interviews represented',
                ],
                [
                  String(new Set(archive.areas.map((a) => a.provenance.wave)).size).padStart(
                    2,
                    '0',
                  ),
                  'research waves',
                ],
                [archive.findings.length, 'published theme summaries'],
              ].map(([number, label]) => (
                <div key={label}>
                  <strong>{number}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <DemoNotice />
          </section>
          <PrivacyNotice />
          <div className="container section-space">
            <Atlas archive={archive} />
          </div>
          {archive.areas[0] && (
            <section className="featured-section">
              <div className="container feature-grid">
                <div>
                  <p className="eyebrow">Featured area</p>
                  <h2>{archive.areas[0].name}</h2>
                  <p className="muted">Nelson Mandela Bay · Eastern Cape</p>
                  <div className="badges">
                    <span className="badge">Wave {archive.areas[0].provenance.wave}</span>
                    <span className="badge">
                      {archive.areas[0].provenance.interviews} interviews
                    </span>
                    <span className="badge">Area-level only</span>
                  </div>
                  <p>{archive.areas[0].description}</p>
                  <Link className="button primary" to={`/areas/${archive.areas[0].slug}`}>
                    Open area dashboard <ArrowUpRight size={16} />
                  </Link>
                </div>
                <ThemeBarChart
                  findings={archive.findings
                    .filter((f) => f.area === archive.areas[0].slug)
                    .slice(0, 5)}
                />
              </div>
            </section>
          )}
          <section className="container section-space two-column">
            <div>
              <p className="eyebrow">A closer reading</p>
              <h2>Needs, wants and aspirations can coexist.</h2>
              <p>
                Nile keeps different kinds of evidence visible. A need is not the same as a
                preference, and neither is a measure of sentiment.
              </p>
              <div className="badges">
                {['Need', 'Want', 'Aspiration', 'Asset'].map((category) => (
                  <Link className="badge" key={category} to={`/findings?category=${category}`}>
                    {category}s ↗
                  </Link>
                ))}
              </div>
            </div>
            {archive.quotes[0] ? (
              <QuoteCard quote={archive.quotes[0]} />
            ) : (
              <aside className="quote-card">
                <h3>Context before conclusions</h3>
                <p>
                  Only reviewed aggregate findings are released. Private transcripts and identifying
                  quotations are excluded from this public dashboard.
                </p>
              </aside>
            )}
          </section>
          <MethodologySection />
          <section className="container section-space">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Open by design</p>
                <h2>Datasets & developer access</h2>
                <p>
                  Explore the catalogue, download structured evidence, or build on the API.
                  <br />
                  Raw transcripts are never exposed.
                </p>
              </div>
              <Link className="button" to="/developers">
                <Terminal size={17} />
                View API docs
              </Link>
            </div>
            <div className="resource-grid">
              {[
                {
                  title: 'Evidence datasets',
                  text: 'JSON, CSV and JSONL releases with provenance.',
                  to: '/datasets',
                  Icon: Database,
                },
                {
                  title: 'API reference',
                  text: 'Published aggregates, stable IDs and methodology metadata.',
                  to: '/developers',
                  Icon: Terminal,
                },
                {
                  title: 'Data dictionary',
                  text: 'Understand each field before you analyse.',
                  to: '/developers#dictionary',
                  Icon: BookOpen,
                },
              ].map(({ title, text, to, Icon }) => (
                <Link className="resource-card" key={title} to={to}>
                  <Icon size={22} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="eyebrow">Explore ↗</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </ArchiveContent>
  )
}
