import { useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { BarChart3, Table2 } from 'lucide-react'
import type { PublicFinding } from '../types/domain'
import { percentage, describeMeasure } from '../utils/privacy'
import { DataProvenance, SuppressedData } from './Evidence'
import { DemoNotice } from './Feedback'

export function ThemeBarChart({
  findings,
  title = 'What came up in interviews',
}: {
  findings: PublicFinding[]
  title?: string
}) {
  const [view, setView] = useState<'bars' | 'table'>('bars')
  return (
    <section className="chart-card" aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Experience overview</p>
          <h3>{title}</h3>
        </div>
        <div className="view-switch" aria-label="Chart display">
          <button
            aria-label="Bar chart"
            aria-pressed={view === 'bars'}
            onClick={() => setView('bars')}
          >
            <BarChart3 size={16} />
          </button>
          <button
            aria-label="Data table"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            <Table2 size={16} />
          </button>
        </div>
      </div>
      {view === 'bars' ? (
        <>
          <div className="recharts-frame" aria-label="Theme comparison chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                accessibilityLayer
                data={findings
                  .filter((f) => !f.measure.suppressed)
                  .map((f) => ({
                    name: f.title,
                    percentage: f.measure.suppressed
                      ? 0
                      : Math.round((f.measure.count / f.measure.total) * 100),
                  }))}
                layout="vertical"
                margin={{ left: 10, right: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" width={145} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="percentage"
                  name="Share of interviews"
                  fill="#285b61"
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="bar-chart">
            {findings.map((f, i) => (
              <li key={f.id}>
                <div className="bar-label">
                  <span>{f.title}</span>
                  {!f.measure.suppressed && (
                    <span className="mono">
                      {f.measure.count} / {f.measure.total}
                    </span>
                  )}
                </div>
                {f.measure.suppressed ? (
                  <SuppressedData />
                ) : (
                  <div className="bar-row">
                    <div className="bar-track" aria-hidden="true">
                      <div
                        className={`bar-fill tone-${i % 5}`}
                        style={{ width: percentage(f.measure.count, f.measure.total) }}
                      />
                    </div>
                    <span className="mono">{percentage(f.measure.count, f.measure.total)}</span>
                    <span className="sr-only"> of interviews mentioned this theme.</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="table-wrap">
          <table>
            <caption>Interview theme mentions</caption>
            <thead>
              <tr>
                <th scope="col">Theme</th>
                <th scope="col">Interviews mentioning theme</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{f.title}</th>
                  <td>{describeMeasure(f.measure)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="chart-note">
        Share of interviewed participants mentioning each theme. Themes may overlap; these are not
        estimates of all residents.
      </p>
      {findings[0] && <DataProvenance value={findings[0].provenance} />}
      <DemoNotice />
    </section>
  )
}
