import { Link } from 'react-router'
const steps = [
  [
    'Interview',
    'A guided conversation about lived experience, with the research scope documented.',
  ],
  ['Consent', 'Review the permitted use of every interview before any publication.'],
  [
    'De-identification',
    'Remove direct identifiers and review combinations that may identify a person.',
  ],
  ['AI-assisted coding', 'Assists categorisation, never replaces review.'],
  ['Human review', 'Researchers check coding, context, quotations and disclosure risks.'],
  ['Publication', 'Release reviewed summaries with provenance and suppression rules.'],
]
export function MethodologySection({ expanded = false }: { expanded?: boolean }) {
  return (
    <section className="methodology-section">
      <div className="container two-column">
        <div>
          <p className="eyebrow">How Nile works</p>
          <h2>Evidence with its context intact.</h2>
          <p>
            Every published finding retains a trail back to the research process. We show what was
            asked, who was interviewed, and how evidence was reviewed.
          </p>
          {!expanded && (
            <Link className="text-link" to="/methodology">
              Read the full methodology ↗
            </Link>
          )}
        </div>
        <ol className="pipeline-grid">
          {steps.map(([title, description], i) => (
            <li key={title}>
              <span className="mono">0{i + 1}</span>
              <h3>{title}</h3>
              {(expanded || i === 3) && <p>{description}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
