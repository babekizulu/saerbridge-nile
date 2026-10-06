import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { LockKeyhole, Upload, Check } from 'lucide-react'
import { Brand } from '../components/Layout'
import { DemoNotice, ErrorState, LoadingState, NotFound } from '../components/Feedback'
import { getResearchPreview } from '../services/archive'
import type { ResearchOverview } from '../types/domain'

const sections = [
  ['', 'Overview'],
  ['projects', 'Research projects'],
  ['interviews', 'Interviews'],
  ['uploads', 'Upload interviews'],
  ['privacy-review', 'De-identification'],
  ['analysis', 'Analysis jobs'],
  ['quotes', 'Coding & quote review'],
  ['releases', 'Publication queue'],
  ['audit', 'Audit log'],
]
const explanations: Record<string, [string, string]> = {
  interviews: [
    'Interview register',
    'Consent status, retention and transcript access belong here. No transcripts or participant records are loaded in this public preview.',
  ],
  uploads: [
    'Upload interviews',
    'Secure ingestion requires an authenticated session, consent checks, server-side validation and encrypted storage. Uploads are unavailable in the preview.',
  ],
  'privacy-review': [
    'De-identification review',
    'Authorised reviewers will assess direct identifiers, contextual disclosure and minimum sample thresholds before material can progress.',
  ],
  analysis: [
    'Analysis jobs',
    'The research pipeline will track coding jobs and human review. This frontend does not run an AI analysis pipeline.',
  ],
  quotes: [
    'Coding & quote review',
    'Review consent, contextual accuracy and disclosure risk before a quotation can enter a public release.',
  ],
  releases: [
    'Publication queue',
    'Authorised release managers will approve versioned datasets after privacy and methodology review. Publishing is unavailable in this preview.',
  ],
  audit: [
    'Audit log',
    'The backend must supply an append-only record of access, review and publication events. No real audit records are exposed here.',
  ],
}
export default function ResearchPage() {
  const { pathname } = useLocation()
  const section = pathname.split('/')[2] || ''
  const [data, setData] = useState<ResearchOverview | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    getResearchPreview()
      .then((d) => {
        if (active) setData(d)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [attempt])
  if (!sections.some(([key]) => key === section)) return <NotFound />
  return (
    <div className="research-shell">
      <a className="skip-link" href="#main">
        Skip to research content
      </a>
      <header className="research-header container">
        <Brand research />
        <Link className="button" to="/">
          × Exit workspace
        </Link>
      </header>
      <div className="research-layout container">
        <aside className="research-sidebar">
          <p className="eyebrow">Workspace</p>
          <nav aria-label="Research navigation">
            {sections.map(([slug, label]) => (
              <NavLink key={slug} to={`/research${slug ? `/${slug}` : ''}`} end>
                <span aria-hidden="true">{section === slug ? '●' : '·'}</span>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main id="main" tabIndex={-1}>
          <div className="research-notice">
            <LockKeyhole size={17} aria-hidden="true" />
            <div>
              <strong>Restricted workspace · frontend preview</strong>
              <p>
                Authentication is not connected. Only fictional examples are shown; private data and
                research actions require server-side access control.
              </p>
            </div>
          </div>
          <p className="eyebrow">Research team · demonstration environment</p>
          <div className="section-heading">
            <h1>
              {section === ''
                ? 'Research overview'
                : sections.find(([slug]) => slug === section)?.[1]}
            </h1>
            {!section && (
              <Link className="button primary" to="/research/uploads">
                <Upload size={16} />
                Upload interviews
              </Link>
            )}
          </div>
          <DemoNotice />
          {error ? (
            <ErrorState
              retry={() => {
                setError(false)
                setAttempt((a) => a + 1)
              }}
            />
          ) : !data ? (
            <LoadingState />
          ) : !section ? (
            <>
              <div className="research-stats">
                <div>
                  <strong>184</strong>
                  <span>interviews in review</span>
                </div>
                <div>
                  <strong>90%</strong>
                  <span>consent verified · rounded</span>
                </div>
                <div>
                  <strong>06</strong>
                  <span>items awaiting publication</span>
                </div>
              </div>
              <div className="research-columns">
                <section className="research-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Active pipeline · fictional</p>
                    <h2>Interview processing</h2>
                  </div>
                  <ol className="pipeline-list">
                    {data.pipeline.map((stage, i) => (
                      <li key={stage.label}>
                        <span className="stage-number">{i < 2 ? <Check size={14} /> : i + 1}</span>
                        <span>{stage.label}</span>
                        <span className="mono">{stage.records} records</span>
                      </li>
                    ))}
                  </ol>
                </section>
                <section className="research-panel panel-heading">
                  <p className="eyebrow">Illustrative activity</p>
                  <ul className="activity-list">
                    {data.activity.map((event) => (
                      <li key={event}>
                        {event}
                        <span className="eyebrow">Demonstration event</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          ) : section === 'projects' ? (
            <div className="table-wrap research-panel">
              <table>
                <caption>Fictional project register</caption>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Interviews</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">{p.name}</th>
                      <td>{p.interviews}</td>
                      <td>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <section className="research-panel auth-state">
              <LockKeyhole size={28} />
              <h2>{explanations[section][0]}</h2>
              <p>{explanations[section][1]}</p>
              <p className="badge">Awaiting authentication & backend integration</p>
              {section === 'uploads' && (
                <button disabled>
                  <Upload size={16} />
                  Upload unavailable
                </button>
              )}
              <Link className="text-link" to="/research">
                ← Research overview
              </Link>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
