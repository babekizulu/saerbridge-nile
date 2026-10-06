import { useState } from 'react'
import { Link } from 'react-router'
import { Copy, Download, Check } from 'lucide-react'
import { ArchiveContent, DemoNotice } from '../components/Feedback'
import { MethodologySection } from '../components/Methodology'
import { PrivacyNotice } from '../components/Evidence'
import { downloadFindings, type DownloadFormat } from '../utils/download'

export function DatasetsPage() {
  const [format, setFormat] = useState<DownloadFormat>('json')
  const [status, setStatus] = useState('')
  return (
    <div className="container page">
      <p className="eyebrow">Open by design</p>
      <h1>Evidence datasets</h1>
      <p className="page-intro">
        Versioned releases of reviewed qualitative evidence. Every download includes provenance and
        a synthetic-data flag where applicable.
      </p>
      <DemoNotice />
      <div className="section-heading spaced">
        <h2>Published releases</h2>
        <label>
          Download format
          <select value={format} onChange={(e) => setFormat(e.target.value as DownloadFormat)}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="jsonl">JSONL</option>
          </select>
        </label>
      </div>
      <ArchiveContent>
        {(archive) => (
          <div className="table-wrap dataset-table">
            <table>
              <caption>
                Published dataset releases · no raw transcripts or participant identifiers
              </caption>
              <thead>
                <tr>
                  <th scope="col">Dataset</th>
                  <th scope="col">Version</th>
                  <th scope="col">Released</th>
                  <th scope="col">Download</th>
                </tr>
              </thead>
              <tbody>
                {archive.releases.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <strong>{r.title}</strong>
                      <p>{r.description}</p>
                    </th>
                    <td data-label="Version" className="mono">
                      {r.version}
                    </td>
                    <td data-label="Released">{r.date}</td>
                    <td>
                      <button
                        aria-label={`Download ${r.title} as ${format.toUpperCase()}`}
                        onClick={() => {
                          downloadFindings(
                            r.id,
                            archive.findings.filter((f) => r.findingIds.includes(f.id)),
                            format,
                          )
                          setStatus(`${r.title}: ${format.toUpperCase()} download prepared.`)
                        }}
                      >
                        <Download size={15} />
                        {format.toUpperCase()}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ArchiveContent>
      <p role="status">{status}</p>
      <PrivacyNotice />
      <p>
        Suppressed observations remain suppressed in all export formats.{' '}
        <Link to="/developers#dictionary">Read the data dictionary →</Link>
      </p>
    </div>
  )
}
const example = `GET /api/v1/nile/public/archive\n\n{\n  "data": {\n    "areas": [], "themes": [], "findings": [],\n    "quotes": [], "releases": []\n  },\n  "meta": { "demonstration": true, "nextCursor": null }\n}`
export function DevelopersPage() {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(example)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopyError(true)
    }
  }
  return (
    <div className="container page">
      <p className="eyebrow">Build with context</p>
      <h1>Developer access</h1>
      <p className="page-intro">
        A public evidence interface designed for clear provenance, stable identifiers and safe
        reuse.
      </p>
      <div className="notice">
        <strong>Public research API · no key required.</strong>
        <p>
          Request the published archive without cookies or credentials. Synthetic releases are
          explicitly labelled in the response.
        </p>
      </div>
      <div className="two-column spaced">
        <div>
          <h2>One archive. Shared context.</h2>
          <p>
            Use GET /api/v1/nile/public/archive for the public snapshot. Public access is limited to
            120 requests per minute per IP; a 429 response means the current allowance is exhausted.
          </p>
          <p>
            For private research, create an organization-scoped key in your account and send it as
            an Authorization: Bearer header to GET /api/v1/nile/organizations/:organizationId
            /transcripts. Keys are read-only, expire after 90 days, and never grant access to
            another organization.
          </p>
          <Link className="text-link" to="/datasets">
            Download published releases ↗
          </Link>
        </div>
        <div className="code-card">
          <div className="section-heading">
            <span className="eyebrow">Response shape</span>
            <button onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre>
            <code>{example}</code>
          </pre>
          <span role="status">
            {copyError
              ? 'Copy unavailable. Select and copy the example text.'
              : copied
                ? 'Example copied.'
                : ''}
          </span>
        </div>
      </div>
      <section id="dictionary" className="spaced">
        <p className="eyebrow">Read before you analyse</p>
        <h2>Data dictionary</h2>
        <dl className="dictionary">
          {[
            ['id', 'Stable identifier for a published finding. Do not infer identity from an ID.'],
            ['area / theme', 'Slugs linking a finding to its place and thematic category.'],
            [
              'measure',
              'Either a published interview count and sample total, or a suppression object. Never infer a missing value.',
            ],
            [
              'provenance',
              'Interview sample size, research wave, fieldwork period, methodology version and source.',
            ],
            ['evidence', 'Review status; not a statistical confidence score.'],
            [
              'demonstration',
              'Identifies fictional fixtures. Never present them as real research.',
            ],
          ].map(([term, definition]) => (
            <div key={term}>
              <dt>
                <code>{term}</code>
              </dt>
              <dd>{definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
export function MethodologyPage() {
  return (
    <>
      <div className="container page">
        <p className="eyebrow">Methods before metrics</p>
        <h1>Evidence, with its limits.</h1>
        <p className="page-intro">
          Qualitative interviews help us understand experiences. The way evidence is collected and
          reviewed shapes what it can tell us.
        </p>
        <DemoNotice />
      </div>
      <MethodologySection expanded />
      <div className="container section-space prose">
        <h2>What an interview count means</h2>
        <p>
          “24 of 50 interviews mentioned transport cost” describes the interviews in a research
          sample. It does not mean 48% of residents share that experience. Participants can discuss
          more than one theme.
        </p>
        <h2>Sampling & fieldwork</h2>
        <p>
          The demonstration fixtures illustrate purposive sampling in Greenbushes and Walmer
          township. They are not a probability sample. Each visualization exposes its interview
          count, fieldwork period, wave, source and methodology version.
        </p>
        <h2>Privacy is a publication requirement</h2>
        <p>
          A minimum publication threshold of 10 is used in these fictional examples. Smaller
          observations are suppressed and contain no underlying count. A threshold alone does not
          guarantee anonymity: context, consent and combinations of attributes require human review.
        </p>
        <h2>Review & interpretation</h2>
        <p>
          Reviewed is a workflow status, not a confidence interval. AI-assisted coding follows
          privacy review and must be reviewed against transcript evidence before approval.
          Associations between themes do not establish causality.
        </p>
        <h2>Methodology version</h2>
        <p>
          <code>demo-v1.0</code> · illustrative only. The research team must supply approved
          protocols, consent language, retention rules and publication criteria before real data is
          connected.
        </p>
        <Link className="text-link" to="/findings">
          Return to the findings ↗
        </Link>
      </div>
    </>
  )
}
export function AboutPage() {
  return (
    <div className="container page prose">
      <p className="eyebrow">Saerbridge · Nile</p>
      <h1>The everyday realities behind the data.</h1>
      <p className="page-intro">
        Nile is an open-source qualitative civic-data application for making research
        understandable, traceable and useful.
      </p>
      <h2>A public archive, with care.</h2>
      <p>
        The public experience brings together places, themes, reviewed findings and structured
        releases. A separate research workspace is designed for consent, privacy review and
        publication workflows.
      </p>
      <h2>Built for careful interpretation.</h2>
      <p>
        People’s experiences should remain connected to their context. Nile keeps sample sizes and
        methods visible, distinguishes types of evidence, and makes suppression explicit.
      </p>
      <DemoNotice />
      <p>
        The pilot contains clearly labelled synthetic test data. Organization workspaces support
        private text uploads and reviewed analysis. Only Saerbridge administrators can publish
        aggregate public research.
      </p>
      <div className="badges">
        <Link className="button" to="/methodology">
          Read the methodology ↗
        </Link>
        <Link className="button" to="/developers">
          Developer documentation ↗
        </Link>
      </div>
    </div>
  )
}

