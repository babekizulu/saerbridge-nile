import { Link } from 'react-router'
import { LockKeyhole, ArrowUpRight, ShieldCheck } from 'lucide-react'
import type { Provenance, PublicFinding, PublishedQuote } from '../types/domain'
import { describeMeasure, SUPPRESSED_LABEL } from '../utils/privacy'

export function PrivacyNotice() {
  return (
    <aside className="privacy-notice">
      <ShieldCheck size={18} aria-hidden="true" />
      <p>
        <strong>Read the evidence carefully.</strong> Nile describes the interviews in its dataset.
        Unless a project uses representative sampling, these findings should not be read as
        population estimates.
      </p>
    </aside>
  )
}
export function SuppressedData() {
  return (
    <span className="suppressed">
      <LockKeyhole size={16} aria-hidden="true" />
      {SUPPRESSED_LABEL}
    </span>
  )
}
export function DataProvenance({ value }: { value: Provenance }) {
  return (
    <details className="provenance">
      <summary>
        Source & methodology · {value.interviews} interviews · Wave {value.wave}
      </summary>
      <dl>
        <div>
          <dt>Sample</dt>
          <dd>
            {value.interviews} {value.demonstration ? 'fictional' : 'reviewed'} interviews · see
            study sampling protocol
          </dd>
        </div>
        <div>
          <dt>Fieldwork</dt>
          <dd>{value.fieldwork}</dd>
        </div>
        <div>
          <dt>Methodology</dt>
          <dd>
            <Link to="/methodology">{value.methodology}</Link>
          </dd>
        </div>
        <div>
          <dt>Provenance</dt>
          <dd>{value.source}</dd>
        </div>
      </dl>
      <p>Theme mentions can overlap. These are not population estimates.</p>
    </details>
  )
}
export function FindingCard({ finding, areaName }: { finding: PublicFinding; areaName: string }) {
  return (
    <article className="finding-card">
      <div className="card-top">
        <span className="eyebrow">{areaName}</span>
        <span className="badge">
          <ShieldCheck size={12} aria-hidden="true" />
          {finding.evidence}
        </span>
      </div>
      <h3>
        <Link to={`/themes/${finding.theme}`}>
          {finding.title}
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </h3>
      <p>{finding.summary}</p>
      {finding.measure.suppressed ? (
        <SuppressedData />
      ) : (
        <p className="finding-measure">{describeMeasure(finding.measure)}</p>
      )}
      <DataProvenance value={finding.provenance} />
    </article>
  )
}
export function QuoteCard({ quote }: { quote: PublishedQuote }) {
  return (
    <figure className="quote-card">
      <span className="eyebrow">Resident voice · fictional example</span>
      <blockquote>“{quote.text}”</blockquote>
      <figcaption>
        <span>
          {quote.attribution}
          <br />
          Research Wave {quote.provenance.wave}
        </span>
        <span>
          Area-level location only
          <br />
          Demonstration quote
        </span>
      </figcaption>
    </figure>
  )
}
