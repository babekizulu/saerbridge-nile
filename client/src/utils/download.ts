import { DEMO_NOTICE, type PublicFinding } from '../types/domain'
import { csvCell, describeMeasure, publicFinding } from './privacy'
export type DownloadFormat = 'json' | 'csv' | 'jsonl'
export function serializeFindings(findings: PublicFinding[], format: DownloadFormat): string {
  const safe = findings.map(publicFinding)
  const notice = findings.some((f) => f.provenance.demonstration)
    ? DEMO_NOTICE
    : 'Reviewed qualitative research; not population estimates.'
  if (format === 'json') return JSON.stringify({ notice, data: safe }, null, 2)
  if (format === 'jsonl') return safe.map((f) => JSON.stringify({ notice, ...f })).join('\n')
  const rows = safe.map((f) => [
    f.id,
    f.area,
    f.theme,
    describeMeasure(f.measure),
    f.provenance.wave,
    f.provenance.fieldwork,
    f.provenance.methodology,
    f.provenance.source,
    notice,
  ])
  return [
    [
      'id',
      'area',
      'theme',
      'interview_mentions',
      'wave',
      'fieldwork',
      'methodology',
      'source',
      'notice',
    ],
    ...rows,
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')
}
export function downloadFindings(id: string, findings: PublicFinding[], format: DownloadFormat) {
  const blob = new Blob([serializeFindings(findings, format)], {
    type:
      format === 'csv'
        ? 'text/csv;charset=utf-8'
        : format === 'jsonl'
          ? 'application/x-ndjson'
          : 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${id}.${format}`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
