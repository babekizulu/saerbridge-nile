import type { ChartDatum, PublicFinding } from '../types/domain'
export const SUPPRESSED_LABEL = 'Suppressed — sample too small to publish safely.'
export function percentage(count: number, total: number): string {
  if (
    !Number.isFinite(count) ||
    !Number.isFinite(total) ||
    total <= 0 ||
    count < 0 ||
    count > total
  )
    return 'Not available'
  return `${Math.round((count / total) * 100)}%`
}
export function describeMeasure(measure: ChartDatum): string {
  return measure.suppressed
    ? SUPPRESSED_LABEL
    : `${measure.count} of ${measure.total} interviews (${percentage(measure.count, measure.total)})`
}
// Allowlist both branches: never spread an untrusted measurement into public exports.
export function publicMeasure(measure: ChartDatum): ChartDatum {
  return measure.suppressed
    ? {
        suppressed: true,
        reason: 'MINIMUM_SAMPLE_THRESHOLD',
        minimumRequired: measure.minimumRequired,
      }
    : { suppressed: false, count: measure.count, total: measure.total }
}
export function publicFinding(finding: PublicFinding): PublicFinding {
  return {
    id: finding.id,
    area: finding.area,
    theme: finding.theme,
    title: finding.title,
    summary: finding.summary,
    measure: publicMeasure(finding.measure),
    provenance: finding.provenance,
    evidence: finding.evidence,
  }
}
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}
