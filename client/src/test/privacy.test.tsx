import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ThemeBarChart } from '../components/Charts'
import { archiveFixture } from '../data/fixtures'
import {
  percentage,
  describeMeasure,
  publicMeasure,
  csvCell,
  SUPPRESSED_LABEL,
} from '../utils/privacy'
import { serializeFindings } from '../utils/download'
import type { ChartDatum } from '../types/domain'

describe('privacy boundary', () => {
  const finding = archiveFixture.findings.find((f) => f.measure.suppressed)!
  const poisoned = {
    ...finding,
    measure: {
      ...finding.measure,
      count: 987654,
      total: 765432,
      secret: 'raw-private-value',
    } as unknown as ChartDatum,
  }
  it('suppressed data cannot serialize a raw measurement', () => {
    expect(publicMeasure(poisoned.measure)).toEqual({
      suppressed: true,
      reason: 'MINIMUM_SAMPLE_THRESHOLD',
      minimumRequired: 10,
    })
    expect(describeMeasure(poisoned.measure)).toBe(SUPPRESSED_LABEL)
    for (const format of ['json', 'csv', 'jsonl'] as const) {
      const output = serializeFindings([poisoned], format)
      expect(output).not.toMatch(/987654|765432|raw-private-value/)
      expect(output).toContain('Demonstration data')
    }
  })
  it('suppressed values do not reach DOM, styles, tooltips or accessible labels', () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeBarChart findings={[poisoned]} />
      </MemoryRouter>,
    )
    expect(screen.getByText(SUPPRESSED_LABEL)).toBeVisible()
    expect(container.innerHTML).not.toMatch(/987654|765432|raw-private-value/)
    expect(container.querySelector('.bar-fill')).toBeNull()
  })
  it('fixtures do not store counts in suppressed observations', () => {
    expect(Object.keys(finding.measure).sort()).toEqual(['minimumRequired', 'reason', 'suppressed'])
  })
})
describe('formatting', () => {
  it('formats interview shares and rejects invalid denominators', () => {
    expect(percentage(24, 50)).toBe('48%')
    expect(percentage(1, 3)).toBe('33%')
    for (const [n, d] of [
      [0, 0],
      [2, 1],
      [-1, 5],
      [NaN, 50],
      [1, Infinity],
    ])
      expect(percentage(n, d)).toBe('Not available')
  })
  it('escapes CSV cells and guards spreadsheet formula interpretation', () => {
    expect(csvCell('A "quote", here')).toBe('"A ""quote"", here"')
    expect(csvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"')
  })
})
