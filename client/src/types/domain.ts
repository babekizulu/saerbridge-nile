export const DEMO_NOTICE = 'Demonstration data — not real research findings.'
export interface Provenance {
  demonstration: boolean
  wave: string
  fieldwork: string
  methodology: string
  source: string
  interviews: number
}
export interface Area {
  slug: string
  name: string
  municipality: string
  province: string
  description: string
  longitude: number
  latitude: number
  provenance: Provenance
}
export interface Theme {
  slug: string
  name: string
  description: string
  category: 'Need' | 'Want' | 'Aspiration' | 'Asset'
}
export type PrivacySuppression = {
  suppressed: true
  reason: 'MINIMUM_SAMPLE_THRESHOLD'
  minimumRequired: number
}
export type PublishedMeasure = { suppressed: false; count: number; total: number }
export type ChartDatum = PrivacySuppression | PublishedMeasure
export interface PublicFinding {
  id: string
  area: string
  theme: string
  title: string
  summary: string
  measure: ChartDatum
  provenance: Provenance
  evidence: 'Reviewed' | 'Exploratory'
}
export interface PublishedQuote {
  id: string
  text: string
  area: string
  provenance: Provenance
  attribution: string
}
export interface DatasetRelease {
  id: string
  title: string
  description: string
  date: string
  version: string
  findingIds: string[]
  demonstration: boolean
}
export interface ResearchProject {
  id: string
  name: string
  area: string
  status: 'Privacy review' | 'Coding review' | 'Draft'
  interviews: number
  demonstration: boolean
}
export interface ResearchOverview {
  projects: ResearchProject[]
  pipeline: { label: string; records: number }[]
  activity: string[]
  demonstration: boolean
}
export interface Archive {
  areas: Area[]
  themes: Theme[]
  findings: PublicFinding[]
  quotes: PublishedQuote[]
  releases: DatasetRelease[]
}
export interface APIResponse<T> {
  data: T
  meta: { demonstration: boolean; nextCursor: string | null }
}
